import { TeamStanding, KnockoutMatch, ThirdPlaceEntry } from '@/data/types';
import { BRACKET_CONFIG } from '@/data/worldcup';
import { resolveAllThirdPlaceSlots, getThirdPlacePoolLabel } from './thirdPlaceRanking';

export interface ResolvedBracket {
  r32: KnockoutMatch[];
  r16: KnockoutMatch[];
  qf: KnockoutMatch[];
  sf: KnockoutMatch[];
  thirdPlace: KnockoutMatch;
  final: KnockoutMatch;
}

/**
 * Determine the winner of a knockout match.
 * If scores are different, higher score wins.
 * If scores are equal, use penalty shootout if available.
 * Returns 'home' or 'away', or null if no decisive result.
 */
function getWinner(
  result: { home: number; away: number; penaltyHome?: number; penaltyAway?: number } | undefined,
  matchId: string
): 'home' | 'away' | null {
  if (!result) return null;
  if (result.home > result.away) return 'home';
  if (result.away > result.home) return 'away';
  // Draw — check penalties
  if (result.penaltyHome != null && result.penaltyAway != null) {
    return result.penaltyHome > result.penaltyAway ? 'home' : 'away';
  }
  // Draw without penalties — not yet decided
  return null;
}

/**
 * Check if a group has completed all 3 matchdays (6 matches played total)
 */
function isGroupComplete(groupId: string, allStandings: Map<string, TeamStanding[]>): boolean {
  const standings = allStandings.get(groupId);
  if (!standings) return false;
  // Group is complete if all 4 teams have played 3 matches each (12 total)
  return standings.every(s => s.played === 3);
}

/**
 * Check if all groups are complete (needed for third-place resolution)
 */
function allGroupsComplete(allStandings: Map<string, TeamStanding[]>): boolean {
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  return groups.every(g => isGroupComplete(g, allStandings));
}

function resolveSlotToTeamId(
  slot: string,
  allStandings: Map<string, TeamStanding[]>,
  thirdPlaceMap: Map<string, string>
): { teamId: string | null; label: string } {
  // Group winner: 1A, 1B, ...
  // Only resolve when group is complete (all 3 matchdays played)
  if (/^1([A-L])$/.test(slot)) {
    const group = slot[1];
    if (!isGroupComplete(group, allStandings)) {
      return { teamId: null, label: `1° ${group}` };
    }
    const standings = allStandings.get(group);
    const winner = standings?.find(s => s.position === 1);
    return { teamId: winner?.teamId || null, label: slot };
  }

  // Group runner-up: 2A, 2B, ...
  // Only resolve when group is complete (all 3 matchdays played)
  if (/^2([A-L])$/.test(slot)) {
    const group = slot[1];
    if (!isGroupComplete(group, allStandings)) {
      return { teamId: null, label: `2° ${group}` };
    }
    const standings = allStandings.get(group);
    const runner = standings?.find(s => s.position === 2);
    return { teamId: runner?.teamId || null, label: slot };
  }

  // Third place pool: 3_ABCDF, 3_CDFGH, etc.
  // Only resolve when ALL groups are complete (third-place ranking is definitive)
  if (/^3_/.test(slot)) {
    if (!allGroupsComplete(allStandings)) {
      return { teamId: null, label: getThirdPlacePoolLabel(slot) };
    }
    const teamId = thirdPlaceMap.get(slot) ?? null;
    return { teamId, label: getThirdPlacePoolLabel(slot) };
  }

  return { teamId: null, label: slot };
}

export function resolveBracket(
  allStandings: Map<string, TeamStanding[]>,
  thirds: ThirdPlaceEntry[],
  knockoutResults: Map<string, { home: number; away: number; penaltyHome?: number; penaltyAway?: number }>,
  espnTeamsOverride?: Record<string, { homeTeam: string; awayTeam: string }>
): ResolvedBracket {
  // Pre-resolve all 8 third-place slots at once (prevents double-assignment)
  const thirdPlaceMap = allGroupsComplete(allStandings)
    ? resolveAllThirdPlaceSlots(allStandings, thirds)
    : new Map<string, string>();

  // Resolve R32
  const r32: KnockoutMatch[] = BRACKET_CONFIG.r32.map(cfg => {
    const home = resolveSlotToTeamId(cfg.homeSlot, allStandings, thirdPlaceMap);
    const away = resolveSlotToTeamId(cfg.awaySlot, allStandings, thirdPlaceMap);
    const result = knockoutResults.get(cfg.id);

    // ESPN overrides for teams in case group standings are incomplete or mismatch
    const espnOverride = espnTeamsOverride?.[cfg.id];

    return {
      id: cfg.id,
      round: 'r32',
      homeSlot: cfg.homeSlot,
      awaySlot: cfg.awaySlot,
      homeTeam: espnOverride ? espnOverride.homeTeam : home.teamId,
      awayTeam: espnOverride ? espnOverride.awayTeam : away.teamId,
      homeScore: result?.home ?? null,
      awayScore: result?.away ?? null,
      penaltyHome: result?.penaltyHome ?? null,
      penaltyAway: result?.penaltyAway ?? null,
      date: cfg.date,
      time: cfg.time,
      venue: cfg.venue,
      city: cfg.city,
    };
  });

  // Generic helper: resolve a round fed by winners from a previous round
  function resolveFeederRound<T extends { id: string; feederHome: string; feederAway: string }>(
    configs: readonly T[],
    roundName: KnockoutMatch['round'],
    prevRound: KnockoutMatch[],
    results: Map<string, { home: number; away: number; penaltyHome?: number; penaltyAway?: number }>
  ): KnockoutMatch[] {
    return configs.map(cfg => {
      const result = results.get(cfg.id);
      const homeWinner = getWinner(results.get(cfg.feederHome), cfg.feederHome);
      const awayWinner = getWinner(results.get(cfg.feederAway), cfg.feederAway);
      let homeTeam: string | null = null;
      let awayTeam: string | null = null;
      if (homeWinner) {
        const homeFeeder = prevRound.find(m => m.id === cfg.feederHome);
        homeTeam = homeWinner === 'home'
          ? homeFeeder?.homeTeam ?? null
          : homeFeeder?.awayTeam ?? null;
      }
      if (awayWinner) {
        const awayFeeder = prevRound.find(m => m.id === cfg.feederAway);
        awayTeam = awayWinner === 'home'
          ? awayFeeder?.homeTeam ?? null
          : awayFeeder?.awayTeam ?? null;
      }

      const espnOverride = espnTeamsOverride?.[cfg.id];

      return {
        id: cfg.id,
        round: roundName,
        homeSlot: `V(${cfg.feederHome})`,
        awaySlot: `V(${cfg.feederAway})`,
        homeTeam: espnOverride ? espnOverride.homeTeam : homeTeam,
        awayTeam: espnOverride ? espnOverride.awayTeam : awayTeam,
        homeScore: result?.home ?? null,
        awayScore: result?.away ?? null,
        penaltyHome: result?.penaltyHome ?? null,
        penaltyAway: result?.penaltyAway ?? null,
        date: (cfg as unknown as { date: string }).date,
        time: (cfg as unknown as { time: string }).time,
        venue: (cfg as unknown as { venue: string }).venue,
        city: (cfg as unknown as { city: string }).city,
      };
    });
  }

  // Resolve R16 - fed by R32 winners
  const r16 = resolveFeederRound(BRACKET_CONFIG.r16, 'r16', r32, knockoutResults);

  // Resolve QF - fed by R16 winners
  const qf = resolveFeederRound(BRACKET_CONFIG.qf, 'qf', r16, knockoutResults);

  // Resolve SF - fed by QF winners
  const sf = resolveFeederRound(BRACKET_CONFIG.sf, 'sf', qf, knockoutResults);

  // Helper: get team from a feeder match by side ('home' or 'away')
  function getTeamFromMatch(
    matchId: string, side: 'home' | 'away', round: KnockoutMatch[]
  ): string | null {
    const m = round.find(m => m.id === matchId);
    return m ? (side === 'home' ? m.homeTeam : m.awayTeam) : null;
  }

  // Third place - losers of SF (not winners)
  // FIX: use BRACKET_CONFIG IDs instead of sf[0]/sf[1] array indexing
  const sf01Result = knockoutResults.get('SF-01');
  const sf02Result = knockoutResults.get('SF-02');
  const thirdPlaceResult = knockoutResults.get('3RD');
  let thirdHomeTeam: string | null = null;
  let thirdAwayTeam: string | null = null;
  // 3rd place: home = loser of SF-01, away = loser of SF-02
  if (sf01Result && getWinner(sf01Result, 'SF-01')) {
    const loser = getWinner(sf01Result, 'SF-01') === 'home' ? 'away' : 'home';
    thirdHomeTeam = getTeamFromMatch('SF-01', loser, sf);
  }
  if (sf02Result && getWinner(sf02Result, 'SF-02')) {
    const loser = getWinner(sf02Result, 'SF-02') === 'home' ? 'away' : 'home';
    thirdAwayTeam = getTeamFromMatch('SF-02', loser, sf);
  }

  const thirdPlaceOverride = espnTeamsOverride?.[BRACKET_CONFIG.third_place.id];

  const thirdPlace: KnockoutMatch = {
    id: BRACKET_CONFIG.third_place.id,
    round: 'third_place',
    homeSlot: `P(${BRACKET_CONFIG.third_place.feederHome})`,
    awaySlot: `P(${BRACKET_CONFIG.third_place.feederAway})`,
    homeTeam: thirdPlaceOverride ? thirdPlaceOverride.homeTeam : thirdHomeTeam,
    awayTeam: thirdPlaceOverride ? thirdPlaceOverride.awayTeam : thirdAwayTeam,
    homeScore: thirdPlaceResult?.home ?? null,
    awayScore: thirdPlaceResult?.away ?? null,
    penaltyHome: thirdPlaceResult?.penaltyHome ?? null,
    penaltyAway: thirdPlaceResult?.penaltyAway ?? null,
    date: BRACKET_CONFIG.third_place.date,
    time: BRACKET_CONFIG.third_place.time,
    venue: BRACKET_CONFIG.third_place.venue,
    city: BRACKET_CONFIG.third_place.city,
  };

  // Final - winners of SF
  // FIX: use BRACKET_CONFIG IDs instead of sf[0]/sf[1] array indexing
  const finalResult = knockoutResults.get('FINAL');
  let finalHomeTeam: string | null = null;
  let finalAwayTeam: string | null = null;
  if (sf01Result && getWinner(sf01Result, 'SF-01')) {
    finalHomeTeam = getTeamFromMatch('SF-01', getWinner(sf01Result, 'SF-01')!, sf);
  }
  if (sf02Result && getWinner(sf02Result, 'SF-02')) {
    finalAwayTeam = getTeamFromMatch('SF-02', getWinner(sf02Result, 'SF-02')!, sf);
  }

  const finalOverride = espnTeamsOverride?.[BRACKET_CONFIG.final.id];

  const final: KnockoutMatch = {
    id: BRACKET_CONFIG.final.id,
    round: 'final',
    homeSlot: `V(${BRACKET_CONFIG.final.feederHome})`,
    awaySlot: `V(${BRACKET_CONFIG.final.feederAway})`,
    homeTeam: finalOverride ? finalOverride.homeTeam : finalHomeTeam,
    awayTeam: finalOverride ? finalOverride.awayTeam : finalAwayTeam,
    homeScore: finalResult?.home ?? null,
    awayScore: finalResult?.away ?? null,
    penaltyHome: finalResult?.penaltyHome ?? null,
    penaltyAway: finalResult?.penaltyAway ?? null,
    date: BRACKET_CONFIG.final.date,
    time: BRACKET_CONFIG.final.time,
    venue: BRACKET_CONFIG.final.venue,
    city: BRACKET_CONFIG.final.city,
  };

  return { r32, r16, qf, sf, thirdPlace, final };
}

/**
 * Get the slot label for display
 */
export function getSlotLabel(slot: string): string {
  if (/^1([A-L])$/.test(slot)) return `1° ${slot[1]}`;
  if (/^2([A-L])$/.test(slot)) return `2° ${slot[1]}`;
  return getThirdPlacePoolLabel(slot);
}

/**
 * For crossover prediction: given a team and group position,
 * return the R32 match they would play in and their potential path.
 */
export function getCrossoverPath(
  teamId: string,
  groupId: string,
  position: 1 | 2 | 3,
): { r32MatchId: string; r32Slot: string; opponentSlot: string; path: string[] } | null {
  const slotKey = `${position}${groupId}`;
  const match = BRACKET_CONFIG.r32.find(
    m => m.homeSlot === slotKey || m.awaySlot === slotKey
  );

  if (!match) {
    // If position is 3, they might not qualify
    return null;
  }

  const isHome = match.homeSlot === slotKey;
  const opponentSlot = isHome ? match.awaySlot : match.homeSlot;

  // Build path
  const path: string[] = [];
  const r16Match = BRACKET_CONFIG.r16.find(
    m => m.feederHome === match.id || m.feederAway === match.id
  );
  if (r16Match) {
    path.push(r16Match.id);
    const qfMatch = BRACKET_CONFIG.qf.find(
      m => m.feederHome === r16Match.id || m.feederAway === r16Match.id
    );
    if (qfMatch) {
      path.push(qfMatch.id);
      const sfMatch = BRACKET_CONFIG.sf.find(
        m => m.feederHome === qfMatch.id || m.feederAway === qfMatch.id
      );
      if (sfMatch) {
        path.push(sfMatch.id);
        path.push('FINAL');
      }
    }
  }

  return {
    r32MatchId: match.id,
    r32Slot: slotKey,
    opponentSlot,
    path,
  };
}