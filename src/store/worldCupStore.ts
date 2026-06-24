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
  // All group matches (mutable copies with scores)
  matches: MatchDef[];
  // Knockout round results
  knockoutResults: Map<string, KnockoutResult>;
  // Selected timezone
  timezone: string;
  // Active tab
  activeTab: string;
  // Calendar filters
  filterGroup: string;
  filterTeam: string;
  filterRound: string;
  // Edit dialog
  editingMatch: string | null;

  // Computed
  allStandings: Map<string, TeamStanding[]>;
  thirdPlaceRanking: ThirdPlaceEntry[];
  bracket: ReturnType<typeof resolveBracket> | null;

  // Actions
  setScore: (matchId: string, home: number | null, away: number | null) => void;
  setKnockoutScore: (matchId: string, home: number, away: number) => void;
  setTimezone: (tz: string) => void;
  setActiveTab: (tab: string) => void;
  setFilterGroup: (g: string) => void;
  setFilterTeam: (t: string) => void;
  setFilterRound: (r: string) => void;
  setEditingMatch: (id: string | null) => void;
  recalculate: () => void;
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
    activeTab: 'calendar',
    filterGroup: '',
    filterTeam: '',
    filterRound: '',
    editingMatch: null,

    allStandings: initial.allStandings,
    thirdPlaceRanking: initial.thirdPlaceRanking,
    bracket: initial.bracket,

    setScore: (matchId, home, away) => {
      const newMatches = get().matches.map(m =>
        m.id === matchId ? { ...m, homeScore: home, awayScore: away, status: (home !== null && away !== null) ? 'finished' as const : 'upcoming' as const } : m
      );
      const kr = get().knockoutResults;
      const computed = computeAll(newMatches, kr);
      set({ matches: newMatches, ...computed });
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
    setEditingMatch: (id) => set({ editingMatch: id }),

    recalculate: () => {
      const { matches, knockoutResults } = get();
      const computed = computeAll(matches, knockoutResults);
      set(computed);
    },
  };
});