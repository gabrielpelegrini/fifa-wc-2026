/**
 * Shared ESPN status classification utility.
 * Used by: route.ts, worldCupStore.ts, LiveTab.tsx
 *
 * Maps ESPN statusName strings to our unified 'upcoming' | 'live' | 'finished'.
 */
export function classifyESPNStatus(
  statusName: string
): 'upcoming' | 'live' | 'finished' {
  if (statusName === 'STATUS_FULL_TIME') return 'finished';
  if (
    statusName === 'STATUS_IN_PROGRESS' ||
    statusName === 'STATUS_HALFTIME' ||
    statusName === 'STATUS_1ST_PERIOD' ||
    statusName === 'STATUS_2ND_PERIOD' ||
    statusName === 'STATUS_EXTRA_TIME' ||
    statusName === 'STATUS_PENALTY_SHOOTOUT'
  ) {
    return 'live';
  }
  return 'upcoming';
}