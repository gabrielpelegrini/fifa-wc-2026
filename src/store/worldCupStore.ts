import { create } from 'zustand';
import { MatchDef, TeamStanding, ThirdPlaceEntry, ESPNMatchScore, RawKnockoutEvent } from '@/data/types';
import { GROUP_MATCHES, BRACKET_CONFIG } from '@/data/worldcup';
import { calculateGroupStandings } from '@/lib/standings';
import { calculateThirdPlaceRanking, resolveAllThirdPlaceSlots } from '@/lib/thirdPlaceRanking';
import { resolveBracket } from '@/lib/bracketResolver';
import { ESPN_TO_TEAM } from '@/lib/espnMapping';
import { classifyESPNStatus } from '@/lib/espnStatus';

interface KnockoutResult {
  home: number;
  away: number;
  penaltyHome?: number;  // penalty shootout score
  penaltyAway?: number;
}

export interface KnockoutLiveEntry {
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
  minute?: number;
  displayClock?: string;
}

export type { RawKnockoutEvent };

interface WorldCupState {
  matches: MatchDef[];
  knockoutResults: Map<string, KnockoutResult>;
  timezone: string;
  activeTab: string;
  filterGroup: string;
  filterTeam: string;
  filterRound: string;

  allStandings: Map<string, TeamStanding[]>;
  thirdPlaceRanking: ThirdPlaceEntry[];
  bracket: ReturnType<typeof resolveBracket> | null;

  lastPollTime: string | null;
  liveMatches: Record<string, number>;
  knockoutLiveInfo: Record<string, KnockoutLiveEntry>;
  rawKnockoutEvents: RawKnockoutEvent[];
  espnBracketTeams: Record<string, { homeTeam: string; awayTeam: string }>;
  isRefreshing: boolean;
  lastError: string | null;

  setScore: (matchId: string, home: number | null, away: number | null) => void;
  setScoreLive: (matchId: string, home: number, away: number, minute: number) => void;
  setKnockoutScore: (matchId: string, home: number, away: number) => void;
  setTimezone: (tz: string) => void;
  setActiveTab: (tab: string) => void;
  setFilterGroup: (g: string) => void;
  setFilterTeam: (t: string) => void;
  setFilterRound: (r: string) => void;
  recalculate: () => void;
  setLastPollTime: (t: string | null) => void;
  setLiveMatches: (m: Record<string, number>) => void;
  bulkUpdateFromESPN: (scores: Record<string, ESPNMatchScore>) => void;
  updateKnockoutLive: (events: RawKnockoutEvent[]) => void;
  refreshNow: () => Promise<void>;
}

function deepCloneMatches(): MatchDef[] {
  return GROUP_MATCHES.map(m => ({ ...m }));
}

function computeAll(matches: MatchDef[], knockoutResults: Map<string, KnockoutResult>) {
  const allStandings = new Map<string, TeamStanding[]>();
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  for (const g of groups) {
    allStandings.set(g, calculateGroupStandings(g, matches));
  }
  const thirdPlaceRanking = calculateThirdPlaceRanking(allStandings, matches);
  const bracket = resolveBracket(allStandings, thirdPlaceRanking, knockoutResults);
  return { allStandings, thirdPlaceRanking, bracket };
}

export const useWorldCupStore = create<WorldCupState>((set, get) => {
  const initialMatches = deepCloneMatches();
  const initialKR = new Map<string, KnockoutResult>();
  const initial = computeAll(initialMatches, initialKR);

  return {
    matches: initialMatches,
    knockoutResults: initialKR,
    timezone: 'America/Sao_Paulo',
    activeTab: 'live',
    filterGroup: '',
    filterTeam: '',
    filterRound: '',

    allStandings: initial.allStandings,
    thirdPlaceRanking: initial.thirdPlaceRanking,
    bracket: initial.bracket,

    lastPollTime: null,
    liveMatches: {},
    knockoutLiveInfo: {},
    rawKnockoutEvents: [],
    espnBracketTeams: {},
    isRefreshing: false,
    lastError: null,

    setLastPollTime: (t: string | null) => set({ lastPollTime: t }),
    setLiveMatches: (m: Record<string, number>) => set({ liveMatches: m }),
    setLastError: (e: string | null) => set({ lastError: e }),

    setScore: (matchId, home, away) => {
      const newMatches = get().matches.map(m =>
        m.id === matchId
          ? { ...m, homeScore: home, awayScore: away, status: (home !== null && away !== null) ? 'finished' as const : 'upcoming' as const }
          : m
      );
      const kr = get().knockoutResults;
      const computed = computeAll(newMatches, kr);
      set({ matches: newMatches, ...computed });
    },

    setScoreLive: (matchId, home, away, minute) => {
      const newMatches = get().matches.map(m =>
        m.id === matchId
          ? { ...m, homeScore: home, awayScore: away, status: 'live' as const }
          : m
      );
      const newLive = { ...get().liveMatches, [matchId]: minute };
      const kr = get().knockoutResults;
      const computed = computeAll(newMatches, kr);
      set({ matches: newMatches, liveMatches: newLive, ...computed });
    },

    setKnockoutScore: (matchId, home, away) => {
      const newKR = new Map(get().knockoutResults);
      newKR.set(matchId, { home, away });
      const computed = computeAll(get().matches, newKR);
      set({ knockoutResults: newKR, ...computed });
    },

    setTimezone: (tz) => set({ timezone: tz }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setFilterGroup: (g) => set({ filterGroup: g }),
    setFilterTeam: (t) => set({ filterTeam: t }),
    setFilterRound: (r) => set({ filterRound: r }),

    recalculate: () => {
      const { matches, knockoutResults } = get();
      const computed = computeAll(matches, knockoutResults);
      set(computed);
    },

    bulkUpdateFromESPN: (scores) => {
      let matchesChanged = false;
      const newMatches = get().matches.map(m => {
        const s = scores[m.id];
        if (!s) return m;
        if (m.homeScore !== s.homeScore || m.awayScore !== s.awayScore || m.status !== s.status || (s.espnTime && m.time !== s.espnTime)) {
          matchesChanged = true;
        }
        return {
          ...m,
          homeScore: s.homeScore,
          awayScore: s.awayScore,
          status: s.status,
          // Update time/venue/city from ESPN (all UTC-based or venue info)
          // Do NOT update date — ESPN UTC dates can shift matches to wrong days
          ...(s.espnTime && { time: s.espnTime }),
          ...(s.espnVenue && { venue: s.espnVenue }),
          ...(s.espnCity && { city: s.espnCity }),
        };
      });
      const newLiveMatches: Record<string, number> = { ...get().liveMatches }; // preserve existing (e.g. knockout)
      let liveMatchesChanged = false;
      for (const [id, s] of Object.entries(scores)) {
        if (s.status === 'live' && s.minute != null) {
          if (newLiveMatches[id] !== s.minute) liveMatchesChanged = true;
          newLiveMatches[id] = s.minute;
        }
      }

      const kr = get().knockoutResults;

      if (matchesChanged) {
        const computed = computeAll(newMatches, kr);
        set({ matches: newMatches, liveMatches: newLiveMatches, ...computed });
      } else if (liveMatchesChanged) {
        set({ liveMatches: newLiveMatches });
      }
    },

    updateKnockoutLive: (events) => {
      const { allStandings, knockoutResults, thirdPlaceRanking, espnBracketTeams: currentEspnBracketTeams } = get();
      // Clear stale live data when no knockout events from ESPN
      if (events.length === 0) {
        set({ knockoutLiveInfo: {}, rawKnockoutEvents: [] });
        return;
      }

      // Re-compute bracket to ensure latest team assignments (including 3rd place pools)
      const freshBracket = resolveBracket(allStandings, thirdPlaceRanking, knockoutResults, currentEspnBracketTeams);

      // Build a function to resolve a slot to teamId using current standings
      const slotToTeam = (slot: string): string | null => {
        const m = slot.match(/^([12])([A-L])$/);
        if (m) {
          const pos = parseInt(m[1]); // 1 or 2
          const grp = m[2];
          const sts = allStandings.get(grp);
          if (!sts) return null;
          const found = sts.find(s => s.position === pos);
          return found?.teamId ?? null;
        }
        return null;
      };

      // Build a flat list of ALL bracket configs with their match objects
      // Each entry: { id, homeSlot, awaySlot, homeTeam, awayTeam, matchObj }
      type BracketEntry = {
        id: string;
        homeSlot: string;
        awaySlot: string;
        homeTeam: string | null;
        awayTeam: string | null;
        date: string;
      };

      const allEntries: BracketEntry[] = [];
      for (const m of freshBracket.r32) allEntries.push(m);
      for (const m of freshBracket.r16) allEntries.push(m);
      for (const m of freshBracket.qf) allEntries.push(m);
      for (const m of freshBracket.sf) allEntries.push(m);
      allEntries.push(freshBracket.thirdPlace);
      allEntries.push(freshBracket.final);

      const newInfo: Record<string, KnockoutLiveEntry> = {};
      const newKnockoutLive: Record<string, number> = {};
      const finishedKO: Array<{ id: string; home: number; away: number; penaltyHome?: number; penaltyAway?: number }> = [];

      for (const evt of events) {
        const homeId = ESPN_TO_TEAM[evt.homeAbbr];
        const awayId = ESPN_TO_TEAM[evt.awayAbbr];
        if (!homeId || !awayId) continue;

        // Find matching bracket entry
        let matchedEntry: BracketEntry | undefined;
        let isReversed = false;

        // Method 1: Match by resolved team names (works when groups are complete)
        // Works for ALL rounds (R32, R16, QF, SF, 3RD, FINAL)
        matchedEntry = allEntries.find(e =>
          (e.homeTeam === homeId && e.awayTeam === awayId) ||
          (e.homeTeam === awayId && e.awayTeam === homeId)
        );
        if (matchedEntry) {
          isReversed = matchedEntry.homeTeam === awayId;
        }

        // Method 2: For R32, match by resolving slots from current standings
        // This works even when the bracket hasn't re-resolved yet
        if (!matchedEntry) {
          for (const cfg of BRACKET_CONFIG.r32) {
            const slotHome = slotToTeam(cfg.homeSlot);
            const slotAway = slotToTeam(cfg.awaySlot);
            if (slotHome && slotAway &&
              ((slotHome === homeId && slotAway === awayId) ||
               (slotHome === awayId && slotAway === homeId))) {
              // Found the R32 config match. Find the corresponding bracket entry
              matchedEntry = allEntries.find(e => e.id === cfg.id);
              isReversed = slotHome === awayId;
              break;
            }
          }
        }

        if (!matchedEntry) continue;

        // Classify status using shared utility
        const status = classifyESPNStatus(evt.statusName);

        const isLiveOrFinished = status === 'live' || status === 'finished';
        const parsedHome = parseInt(evt.homeScore, 10);
        const parsedAway = parseInt(evt.awayScore, 10);
        const evtHomeScore = isLiveOrFinished && !isNaN(parsedHome) ? parsedHome : null;
        const evtAwayScore = isLiveOrFinished && !isNaN(parsedAway) ? parsedAway : null;

        // Align scores to our bracket's home/away order
        let homeScore = evtHomeScore;
        let awayScore = evtAwayScore;
        if (isReversed) {
          const tmp = homeScore;
          homeScore = awayScore;
          awayScore = tmp;
        }

        // Minute for live matches
        const minute = status === 'live' && evt.clock
          ? Math.floor(evt.clock / 60)
          : undefined;

        newInfo[matchedEntry.id] = {
          status,
          homeScore,
          awayScore,
          minute,
          displayClock: evt.displayClock,
        };

        if (status === 'live' && minute != null) {
          newKnockoutLive[matchedEntry.id] = minute;
        }

        // Collect finished results for bracket auto-resolution
        if (status === 'finished' && homeScore !== null && awayScore !== null) {
          // Parse penalty info from shortDetail (e.g. "Team wins in PK 4-2")
          let penaltyHome: number | undefined;
          let penaltyAway: number | undefined;
          if (evt.shortDetail) {
            const pkMatch = evt.shortDetail.match(/PK\s+(\d+)\s*[-–]\s*(\d+)/i);
            if (pkMatch) {
              // shortDetail is from ESPN's perspective (home/away aligned to ESPN)
              const pkH = parseInt(pkMatch[1], 10);
              const pkA = parseInt(pkMatch[2], 10);
              penaltyHome = isReversed ? pkA : pkH;
              penaltyAway = isReversed ? pkH : pkA;
            }
          }
          finishedKO.push({ id: matchedEntry.id, home: homeScore, away: awayScore, penaltyHome, penaltyAway });
        }
      }

      // ── Team-position-based matching for unmatched R32 events ──
      // Instead of matching by date (which is unreliable — multiple R32 share dates),
      // match by each team's group position (e.g., 1A, 2B, 3_ABCDF) to find the
      // correct BRACKET_CONFIG slot.
      const matchedIds = new Set(Object.keys(newInfo));
      const usedIds = new Set<string>();
      const espnBracketTeams: Record<string, { homeTeam: string; awayTeam: string }> = { ...get().espnBracketTeams };

      // Build date-indexed list for non-R32 fallback matching
      const dateToUnmatched = new Map<string, Array<{ id: string; homeTeam: string | null; awayTeam: string | null; date: string }>>();
      for (const entry of allEntries) {
        if (matchedIds.has(entry.id)) continue;
        if (!entry.date) continue;
        const arr = dateToUnmatched.get(entry.date) || [];
        arr.push(entry);
        dateToUnmatched.set(entry.date, arr);
      }

      // Build teamId → slotKey map from current standings
      const teamToSlot = new Map<string, string>();
      for (const [groupId, standings] of allStandings) {
        for (const s of standings) {
          if (s.position === 1) teamToSlot.set(s.teamId, `1${groupId}`);
          else if (s.position === 2) teamToSlot.set(s.teamId, `2${groupId}`);
        }
      }
      // Add 3rd-place pool assignments
      const allGroupsComplete = (['A','B','C','D','E','F','G','H','I','J','K','L'] as const)
        .every(g => {
          const sts = allStandings.get(g);
          return sts?.every(s => s.played === 3) ?? false;
        });
      if (allGroupsComplete) {
        const thirdPlaceMap = resolveAllThirdPlaceSlots(allStandings, thirdPlaceRanking);
        for (const [pool, teamId] of thirdPlaceMap) {
          teamToSlot.set(teamId, pool);
        }
      }

      // For each unmatched ESPN R32 event, match by slot keys
      for (const evt of events) {
        const homeId = ESPN_TO_TEAM[evt.homeAbbr];
        const awayId = ESPN_TO_TEAM[evt.awayAbbr];
        if (!homeId || !awayId) continue;
        if (matchedIds.has(`${homeId}:${awayId}`) || matchedIds.has(`${awayId}:${homeId}`)) continue;

        // Skip if this team pair was already matched in espnBracketTeams
        const pairKey = [homeId, awayId].sort().join(':');
        let alreadyMatched = false;
        for (const [, teams] of Object.entries(espnBracketTeams)) {
          if ([teams.homeTeam, teams.awayTeam].sort().join(':') === pairKey) {
            alreadyMatched = true;
            break;
          }
        }
        if (alreadyMatched) continue;

        const note = evt.altGameNote || '';
        const isR32Event = note.includes('Round of 32');

        if (isR32Event && teamToSlot.has(homeId) && teamToSlot.has(awayId)) {
          const homeSlotKey = teamToSlot.get(homeId)!;
          const awaySlotKey = teamToSlot.get(awayId)!;

          // Find R32 config where slot keys match (order-independent)
          const cfg = BRACKET_CONFIG.r32.find(c =>
            (c.homeSlot === homeSlotKey && c.awaySlot === awaySlotKey) ||
            (c.homeSlot === awaySlotKey && c.awaySlot === homeSlotKey)
          );
          if (!cfg) continue;
          if (matchedIds.has(cfg.id)) continue;

          const isReversed = cfg.homeSlot === awaySlotKey;
          usedIds.add(cfg.id);
          matchedIds.add(cfg.id);
          espnBracketTeams[cfg.id] = {
            homeTeam: isReversed ? awayId : homeId,
            awayTeam: isReversed ? homeId : awayId,
          };

          // Add live info
          const status = classifyESPNStatus(evt.statusName);
          const isLiveOrFinished = status === 'live' || status === 'finished';
          const pH = parseInt(evt.homeScore, 10);
          const pA = parseInt(evt.awayScore, 10);
          const homeScore = isLiveOrFinished && !isNaN(pH) ? (isReversed ? pA : pH) : null;
          const awayScore = isLiveOrFinished && !isNaN(pA) ? (isReversed ? pH : pA) : null;

          newInfo[cfg.id] = {
            status,
            homeScore,
            awayScore,
            minute: status === 'live' && evt.clock ? Math.floor(evt.clock / 60) : undefined,
            displayClock: evt.displayClock,
          };

          if (status === 'live' && newInfo[cfg.id].minute != null) {
            newKnockoutLive[cfg.id] = newInfo[cfg.id].minute!;
          }

          if (status === 'finished' && homeScore !== null && awayScore !== null) {
            let penH: number | undefined, penA: number | undefined;
            if (evt.shortDetail) {
              const pk = evt.shortDetail.match(/PK\s+(\d+)\s*[-–]\s*(\d+)/i);
              if (pk) {
                penH = isReversed ? parseInt(pk[2], 10) : parseInt(pk[1], 10);
                penA = isReversed ? parseInt(pk[1], 10) : parseInt(pk[2], 10);
              }
            }
            finishedKO.push({
              id: cfg.id,
              home: homeScore,
              away: awayScore,
              penaltyHome: penH, penaltyAway: penA,
            });
          }
          continue;
        }

        // For non-R32 events, use date-based matching (strict team pair)
        const evtDate = evt.date;
        if (!evtDate) continue;

        const d = new Date(evtDate + 'T12:00:00Z');
        const dates = [
          evtDate,
          new Date(d.getTime() - 86400000).toISOString().slice(0, 10),
          new Date(d.getTime() + 86400000).toISOString().slice(0, 10),
        ];

        let matchedEntry: { id: string; homeTeam: string | null; awayTeam: string | null; date: string } | undefined;
        for (const tryDate of dates) {
          const candidates = dateToUnmatched.get(tryDate);
          if (!candidates) continue;
          matchedEntry = candidates.find(e =>
            !usedIds.has(e.id) &&
            ((e.homeTeam === homeId && e.awayTeam === awayId) ||
             (e.homeTeam === awayId && e.awayTeam === homeId))
          );
          if (matchedEntry) break;
        }
        if (!matchedEntry) continue;

        // Find the full bracket entry for this matched ID (to get scores etc.)
        const fullEntry = allEntries.find(e => e.id === matchedEntry!.id);
        usedIds.add(matchedEntry.id);
        let confirmedHome = homeId;
        let confirmedAway = awayId;
        if (matchedEntry.homeTeam && matchedEntry.awayTeam) {
          if (matchedEntry.homeTeam === awayId && matchedEntry.awayTeam === homeId) {
            confirmedHome = awayId;
            confirmedAway = homeId;
          }
        }
        espnBracketTeams[matchedEntry.id] = { homeTeam: confirmedHome, awayTeam: confirmedAway };
        if (!newInfo[matchedEntry.id]) {
          const status = classifyESPNStatus(evt.statusName);
          const isLiveOrFinished = status === 'live' || status === 'finished';
          const pH = parseInt(evt.homeScore, 10);
          const pA = parseInt(evt.awayScore, 10);
          const isRev = fullEntry ? fullEntry.homeTeam === awayId : false;
          newInfo[matchedEntry.id] = {
            status,
            homeScore: isLiveOrFinished && !isNaN(pH) ? pH : null,
            awayScore: isLiveOrFinished && !isNaN(pA) ? pA : null,
            minute: status === 'live' && evt.clock ? Math.floor(evt.clock / 60) : undefined,
            displayClock: evt.displayClock,
          };
          if (status === 'finished' && !isNaN(pH) && !isNaN(pA)) {
            let penH: number | undefined, penA: number | undefined;
            if (evt.shortDetail) {
              const pk = evt.shortDetail.match(/PK\s+(\d+)\s*[-–]\s*(\d+)/i);
              if (pk) {
                penH = isRev ? parseInt(pk[2], 10) : parseInt(pk[1], 10);
                penA = isRev ? parseInt(pk[1], 10) : parseInt(pk[2], 10);
              }
            }
            finishedKO.push({
              id: matchedEntry.id,
              home: isRev ? pA : pH,
              away: isRev ? pH : pA,
              penaltyHome: penH, penaltyAway: penA,
            });
          }
        }
      }

      // Also store confirmed teams for entries matched in the main loop
      for (const entry of allEntries) {
        if (matchedIds.has(entry.id) && entry.homeTeam && entry.awayTeam) {
          espnBracketTeams[entry.id] = { homeTeam: entry.homeTeam, awayTeam: entry.awayTeam };
        }
      }

      // Auto-update knockout bracket with finished results so winners advance
      let finalBracket = freshBracket;
      if (finishedKO.length > 0) {
        const newKR = new Map(get().knockoutResults);
        for (const r of finishedKO) {
          newKR.set(r.id, {
            home: r.home,
            away: r.away,
            ...(r.penaltyHome != null && { penaltyHome: r.penaltyHome }),
            ...(r.penaltyAway != null && { penaltyAway: r.penaltyAway }),
          });
        }
        // Re-compute entirely with the new results so the bracket progresses correctly
        finalBracket = resolveBracket(allStandings, thirdPlaceRanking, newKR, espnBracketTeams);
        const computed = computeAll(get().matches, newKR);
        set({ knockoutResults: newKR, ...computed });
      }

      // Single atomic set() — no intermediate render state
      const update: Record<string, unknown> = {
        knockoutLiveInfo: newInfo,
        liveMatches: { ...get().liveMatches, ...newKnockoutLive },
        rawKnockoutEvents: events, // Store raw ESPN data for LiveTab fallback display
        bracket: finalBracket, // Use the fresh bracket we computed above
        espnBracketTeams,
      };

      set(update);
    },

    refreshNow: async () => {
      set({ isRefreshing: true, lastError: null });
      try {
        const url = `/api/live-scores?_refresh=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.source && data.source !== 'espn') {
          set({ lastError: 'Erro ao buscar dados. Tente novamente.' });
          return;
        }
        if (data.scores) {
          get().bulkUpdateFromESPN(data.scores);
        }
        if (data.knockoutEvents && data.knockoutEvents.length > 0) {
          get().updateKnockoutLive(data.knockoutEvents);
        }
        get().setLastPollTime(new Date().toISOString());
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        set({ lastError: `Falha ao atualizar: ${msg}` });
      } finally {
        set({ isRefreshing: false });
      }
    },
  };
});