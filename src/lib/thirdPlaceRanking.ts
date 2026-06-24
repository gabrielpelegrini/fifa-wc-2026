import { TeamStanding, ThirdPlaceEntry, MatchDef } from '@/data/types';
import { calculateGroupStandings, getTeamName } from './standings';

export function calculateThirdPlaceRanking(
  allStandings: Map<string, TeamStanding[]>,
  matches: MatchDef[]
): ThirdPlaceEntry[] {
  const thirds: ThirdPlaceEntry[] = [];

  for (const [groupId, standings] of allStandings) {
    const third = standings.find(s => s.position === 3);
    if (!third) continue;

    // Calculate fair play (cards) - for now use 0 since we don't track cards
    const fairPlay = 0;

    thirds.push({
      teamId: third.teamId,
      groupId,
      points: third.points,
      goalDiff: third.goalDiff,
      goalsFor: third.goalsFor,
      fairPlay,
      rank: 0,
      qualified: false,
    });
  }

  // Sort: points > goal diff > goals for > fair play
  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (a.fairPlay !== b.fairPlay) return a.fairPlay - b.fairPlay; // fewer cards = better
    return 0;
  });

  // Assign ranks and qualification
  thirds.forEach((t, i) => {
    t.rank = i + 1;
    t.qualified = i < 8;
  });

  return thirds;
}

/**
 * Get the team ID for a given third-place pool slot.
 * poolGroups: the groups in this pool (e.g., ['A','B','C'])
 * index: 0 = best, 1 = second best
 */
export function resolveThirdPlaceSlot(
  poolSlotId: string,
  allStandings: Map<string, TeamStanding[]>,
  thirds: ThirdPlaceEntry[]
): string | null {
  // Map slot IDs to pool groups
  const slotPools: Record<string, { groups: string[]; index: number }> = {
    '3ABC_1': { groups: ['A', 'B', 'C'], index: 0 },
    '3ABC_2': { groups: ['A', 'B', 'C'], index: 1 },
    '3DEF_1': { groups: ['D', 'E', 'F'], index: 0 },
    '3DEF_2': { groups: ['D', 'E', 'F'], index: 1 },
    '3GHI_1': { groups: ['G', 'H', 'I'], index: 0 },
    '3GHI_2': { groups: ['G', 'H', 'I'], index: 1 },
    '3JKL_1': { groups: ['J', 'K', 'L'], index: 0 },
    '3JKL_2': { groups: ['J', 'K', 'L'], index: 1 },
    '3ADEF_1': { groups: ['A', 'D', 'E', 'F'], index: 0 },
  };

  const pool = slotPools[poolSlotId];
  if (!pool) return null;

  // Filter third-place teams that belong to this pool's groups
  const poolThirds = thirds
    .filter(t => pool.groups.includes(t.groupId) && t.qualified)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.fairPlay - b.fairPlay;
    });

  if (pool.index < poolThirds.length) {
    return poolThirds[pool.index].teamId;
  }
  return null;
}

export function getThirdPlacePoolLabel(slotId: string): string {
  const labels: Record<string, string> = {
    '3ABC_1': 'Melhor 3° de A/B/C',
    '3ABC_2': '2° melhor 3° de A/B/C',
    '3DEF_1': 'Melhor 3° de D/E/F',
    '3DEF_2': '2° melhor 3° de D/E/F',
    '3GHI_1': 'Melhor 3° de G/H/I',
    '3GHI_2': '2° melhor 3° de G/H/I',
    '3JKL_1': 'Melhor 3° de J/K/L',
    '3JKL_2': '2° melhor 3° de J/K/L',
    '3ADEF_1': 'Melhor 3° de A/D/E/F',
  };
  return labels[slotId] || slotId;
}