import { TeamStanding, ThirdPlaceEntry, MatchDef } from '@/data/types';
import { calculateGroupStandings, getTeamName } from './standings';
import { THIRD_PLACE_POOLS } from '@/data/worldcup';

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

  // Assign ranks and qualification (top 8 of 12 third-place teams qualify)
  thirds.forEach((t, i) => {
    t.rank = i + 1;
    t.qualified = i < 8;
  });

  return thirds;
}

/**
 * Resolve ALL 8 third-place bracket slots at once.
 * Returns a Map: slotId (e.g. '3_ABCDF') → teamId
 *
 * Approach: for each pool (in match order R32-01..R32-16),
 * find the best qualified third-place team from the pool's groups
 * that hasn't already been assigned to another slot.
 *
 * Note: FIFA uses a 495-row lookup table for exact assignment.
 * This heuristic is correct for the vast majority of scenarios.
 */
export function resolveAllThirdPlaceSlots(
  allStandings: Map<string, TeamStanding[]>,
  thirds: ThirdPlaceEntry[]
): Map<string, string> {
  const result = new Map<string, string>();
  const assigned = new Set<string>(); // teamIds already assigned

  // Get the pool slot IDs in R32 match order (from BRACKET_CONFIG)
  const poolSlotsInOrder = [
    '3_ABCDF',  // R32-02
    '3_CDFGH',  // R32-05
    '3_CEFHI',  // R32-07
    '3_EHIJK',  // R32-08
    '3_BEFIJ',  // R32-09
    '3_AEHIJ',  // R32-10
    '3_EFGIJ',  // R32-13
    '3_DEIJL',  // R32-15
  ];

  for (const slotId of poolSlotsInOrder) {
    const pool = (THIRD_PLACE_POOLS as Record<string, { groups: readonly string[] }>)[slotId];
    if (!pool) continue;

    // Find best qualified third from this pool's groups that isn't already assigned
    const poolThirds = thirds
      .filter(t => pool.groups.includes(t.groupId) && t.qualified && !assigned.has(t.teamId))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.fairPlay - b.fairPlay;
      });

    if (poolThirds.length > 0) {
      result.set(slotId, poolThirds[0].teamId);
      assigned.add(poolThirds[0].teamId);
    }
  }

  return result;
}

/**
 * Legacy function - resolves a single third-place slot.
 * Used by bracketResolver for backward compatibility.
 */
export function resolveThirdPlaceSlot(
  poolSlotId: string,
  allStandings: Map<string, TeamStanding[]>,
  thirds: ThirdPlaceEntry[],
  preResolved?: Map<string, string>
): string | null {
  // If pre-resolved map is provided, use it directly
  if (preResolved) {
    return preResolved.get(poolSlotId) ?? null;
  }

  // Fallback: resolve individually (less accurate for overlapping pools)
  const pool = (THIRD_PLACE_POOLS as Record<string, { groups: readonly string[] }>)[poolSlotId];
  if (!pool) return null;

  const poolThirds = thirds
    .filter(t => pool.groups.includes(t.groupId) && t.qualified)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.fairPlay - b.fairPlay;
    });

  if (poolThirds.length > 0) {
    return poolThirds[0].teamId;
  }
  return null;
}

export function getThirdPlacePoolLabel(slotId: string): string {
  const pool = (THIRD_PLACE_POOLS as Record<string, { label: string }>)[slotId];
  if (pool) return pool.label;
  // Fallback for old-style slot IDs
  if (/^3([A-L])/.test(slotId)) {
    return `3° lugar ${slotId.replace('3', '')}`;
  }
  return slotId;
}