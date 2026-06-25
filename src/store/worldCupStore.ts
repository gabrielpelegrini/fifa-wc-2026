import { create } from 'zustand';
import { MatchDef, TeamStanding, ThirdPlaceEntry } from '@/data/types';
import { GROUP_MATCHES, BRACKET_CONFIG } from '@/data/worldcup';
import { calculateGroupStandings } from '@/lib/standings';
import { calculateThirdPlaceRanking } from '@/lib/thirdPlaceRanking';
import { resolveBracket } from '@/lib/bracketResolver';

interface KnockoutResult {
  home: number;
  away: number;
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

    refreshNow: async () => {
      set({ isRefreshing: true });
      try {
        const finishedIds = get().matches
          .filter(m => m.status === 'finished')
          .map(m => m.id)
          .join(',');
        const url = `/api/live-scores?XTransformPort=3000&finished=${encodeURIComponent(finishedIds)}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const newLiveMatches: Record<string, number> = {};
        for (const update of data.updates) {
          if (update.status === 'live') {
            const minute = update.minute ?? 0;
            get().setScoreLive(update.matchId, update.homeScore, update.awayScore, minute);
            newLiveMatches[update.matchId] = minute;
          } else if (update.status === 'finished') {
            get().setScore(update.matchId, update.homeScore, update.awayScore);
          }
        }
        get().setLiveMatches(newLiveMatches);
        get().setLastPollTime(new Date().toISOString());
      } catch { /* silently fail */ }
      set({ isRefreshing: false });
    },
  };
});