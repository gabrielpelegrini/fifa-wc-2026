import { create } from 'zustand';
import { MatchDef, TeamStanding, ThirdPlaceEntry } from '@/data/types';
import { GROUP_MATCHES, BRACKET_CONFIG } from '@/data/worldcup';
import { calculateGroupStandings } from '@/lib/standings';
import { calculateThirdPlaceRanking } from '@/lib/thirdPlaceRanking';
import { resolveBracket } from '@/lib/bracketResolver';
import { ESPN_TO_TEAM } from '@/lib/espnMapping';

interface KnockoutResult {
  home: number;
  away: number;
}

interface ESPNMatchScore {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  minute?: number;
  displayClock?: string;
  espnDate?: string;
  espnTime?: string;
  espnVenue?: string;
  espnCity?: string;
}

export interface KnockoutLiveEntry {
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
  minute?: number;
  displayClock?: string;
}

export interface RawKnockoutEvent {
  homeAbbr: string;
  awayAbbr: string;
  homeScore: string;
  awayScore: string;
  statusName: string;
  clock?: number;
  displayClock?: string;
}

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
  isRefreshing: boolean;

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
    isRefreshing: false,

    setLastPollTime: (t: string | null) => set({ lastPollTime: t }),
    setLiveMatches: (m: Record<string, number>) => set({ liveMatches: m }),

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
      const newMatches = get().matches.map(m => {
        const s = scores[m.id];
        if (!s) return m;
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
      const newLiveMatches: Record<string, number> = {};
      for (const [id, s] of Object.entries(scores)) {
        if (s.status === 'live' && s.minute != null) {
          newLiveMatches[id] = s.minute;
        }
      }
      const kr = get().knockoutResults;
      const computed = computeAll(newMatches, kr);
      set({ matches: newMatches, liveMatches: newLiveMatches, ...computed });
    },

    updateKnockoutLive: (events) => {
      const bracket = get().bracket;
      if (!bracket || events.length === 0) return;

      // Flatten all bracket matches for searching
      const allBracket = [
        ...bracket.r32, ...bracket.r16, ...bracket.qf, ...bracket.sf,
        bracket.thirdPlace, bracket.final,
      ];

      const newInfo: Record<string, KnockoutLiveEntry> = {};
      const newKnockoutLive: Record<string, number> = {};

      for (const evt of events) {
        const homeId = ESPN_TO_TEAM[evt.homeAbbr];
        const awayId = ESPN_TO_TEAM[evt.awayAbbr];
        if (!homeId || !awayId) continue;

        // Find matching bracket match (home/away order may differ)
        const match = allBracket.find(m =>
          (m.homeTeam === homeId && m.awayTeam === awayId) ||
          (m.homeTeam === awayId && m.awayTeam === homeId)
        );
        if (!match) continue;

        // Classify status
        let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
        if (evt.statusName === 'STATUS_FULL_TIME' || evt.statusName === 'STATUS_POSTPONED') status = 'finished';
        else if (
          evt.statusName === 'STATUS_IN_PROGRESS' ||
          evt.statusName === 'STATUS_HALFTIME' ||
          evt.statusName === 'STATUS_1ST_PERIOD' ||
          evt.statusName === 'STATUS_2ND_PERIOD' ||
          evt.statusName === 'STATUS_EXTRA_TIME' ||
          evt.statusName === 'STATUS_PENALTY_SHOOTOUT'
        ) status = 'live';

        const isLiveOrFinished = status === 'live' || status === 'finished';
        const evtHomeScore = isLiveOrFinished ? (parseInt(evt.homeScore, 10) || 0) : null;
        const evtAwayScore = isLiveOrFinished ? (parseInt(evt.awayScore, 10) || 0) : null;

        // Align scores to our bracket's home/away
        let homeScore = evtHomeScore;
        let awayScore = evtAwayScore;
        if (homeId === match.awayTeam) {
          const tmp = homeScore;
          homeScore = awayScore;
          awayScore = tmp;
        }

        // Minute for live matches
        const minute = status === 'live' && evt.clock
          ? Math.floor(evt.clock / 60)
          : undefined;

        newInfo[match.id] = {
          status,
          homeScore,
          awayScore,
          minute,
          displayClock: evt.displayClock,
        };

        if (status === 'live' && minute != null) {
          newKnockoutLive[match.id] = minute;
        }
      }

      set({
        knockoutLiveInfo: newInfo,
        liveMatches: { ...get().liveMatches, ...newKnockoutLive },
      });
    },

    refreshNow: async () => {
      set({ isRefreshing: true });
      try {
        // Bypass server cache with _refresh parameter
        const url = `/api/live-scores?XTransformPort=3000&_refresh=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.scores) {
          get().bulkUpdateFromESPN(data.scores);
        }
        if (data.knockoutEvents && data.knockoutEvents.length > 0) {
          get().updateKnockoutLive(data.knockoutEvents);
        }
        get().setLastPollTime(new Date().toISOString());
      } catch { /* silently fail */ }
      set({ isRefreshing: false });
    },
  };
});