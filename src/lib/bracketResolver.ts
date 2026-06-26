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
  knockoutResults: Map<string, { home: number; away: number }>
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
    return {
      id: cfg.id,
      round: 'r32',
      homeSlot: cfg.homeSlot,
      awaySlot: cfg.awaySlot,
      homeTeam: home.teamId,
      awayTeam: away.teamId,
      homeScore: result?.home ?? null,
      awayScore: result?.away ?? null,
      date: cfg.date,
      time: cfg.time,
      venue: cfg.venue,
      city: cfg.city,
    };
  });

  // Resolve R16 - fed by R32 winners
  const r16: KnockoutMatch[] = BRACKET_CONFIG.r16.map(cfg => {
    const result = knockoutResults.get(cfg.id);
    // Only populate teams if the feeder R32 matches have been played
    const homeR32Result = knockoutResults.get(cfg.feederHome);
    const awayR32Result = knockoutResults.get(cfg.feederAway);
    let homeTeam: string | null = null;
    let awayTeam: string | null = null;
    if (homeR32Result && homeR32Result.home !== homeR32Result.away) {
      const homeFeeder = r32.find(m => m.id === cfg.feederHome);
      homeTeam = homeR32Result.home > homeR32Result.away
        ? homeFeeder?.homeTeam ?? null
        : homeFeeder?.awayTeam ?? null;
    }
    if (awayR32Result && awayR32Result.home !== awayR32Result.away) {
      const awayFeeder = r32.find(m => m.id === cfg.feederAway);
      awayTeam = awayR32Result.home > awayR32Result.away
        ? awayFeeder?.homeTeam ?? null
        : awayFeeder?.awayTeam ?? null;
    }

    return {
      id: cfg.id,
      round: 'r16',
      homeSlot: `V(${cfg.feederHome})`,
      awaySlot: `V(${cfg.feederAway})`,
      homeTeam,
      awayTeam,
      homeScore: result?.home ?? null,
      awayScore: result?.away ?? null,
      date: cfg.date,
      time: cfg.time,
      venue: cfg.venue,
      city: cfg.city,
    };
  });

  // Resolve QF - fed by R16 winners
  const qf: KnockoutMatch[] = BRACKET_CONFIG.qf.map(cfg => {
    const result = knockoutResults.get(cfg.id);
    const homeR16Result = knockoutResults.get(cfg.feederHome);
    const awayR16Result = knockoutResults.get(cfg.feederAway);
    let homeTeam: string | null = null;
    let awayTeam: string | null = null;
    if (homeR16Result && homeR16Result.home !== homeR16Result.away) {
      const homeFeeder = r16.find(m => m.id === cfg.feederHome);
      homeTeam = homeR16Result.home > homeR16Result.away
        ? homeFeeder?.homeTeam ?? null
        : homeFeeder?.awayTeam ?? null;
    }
    if (awayR16Result && awayR16Result.home !== awayR16Result.away) {
      const awayFeeder = r16.find(m => m.id === cfg.feederAway);
      awayTeam = awayR16Result.home > awayR16Result.away
        ? awayFeeder?.homeTeam ?? null
        : awayFeeder?.awayTeam ?? null;
    }

    return {
      id: cfg.id,
      round: 'qf',
      homeSlot: `V(${cfg.feederHome})`,
      awaySlot: `V(${cfg.feederAway})`,
      homeTeam,
      awayTeam,
      homeScore: result?.home ?? null,
      awayScore: result?.away ?? null,
      date: cfg.date,
      time: cfg.time,
      venue: cfg.venue,
      city: cfg.city,
    };
  });

  // Resolve SF - fed by QF winners
  const sf: KnockoutMatch[] = BRACKET_CONFIG.sf.map(cfg => {
    const result = knockoutResults.get(cfg.id);
    const homeQFResult = knockoutResults.get(cfg.feederHome);
    const awayQFResult = knockoutResults.get(cfg.feederAway);
    let homeTeam: string | null = null;
    let awayTeam: string | null = null;
    if (homeQFResult && homeQFResult.home !== homeQFResult.away) {
      const homeFeeder = qf.find(m => m.id === cfg.feederHome);
      homeTeam = homeQFResult.home > homeQFResult.away
        ? homeFeeder?.homeTeam ?? null
        : homeFeeder?.awayTeam ?? null;
    }
    if (awayQFResult && awayQFResult.home !== awayQFResult.away) {
      const awayFeeder = qf.find(m => m.id === cfg.feederAway);
      awayTeam = awayQFResult.home > awayQFResult.away
        ? awayFeeder?.homeTeam ?? null
        : awayFeeder?.awayTeam ?? null;
    }

    return {
      id: cfg.id,
      round: 'sf',
      homeSlot: `V(${cfg.feederHome})`,
      awaySlot: `V(${cfg.feederAway})`,
      homeTeam,
      awayTeam,
      homeScore: result?.home ?? null,
      awayScore: result?.away ?? null,
      date: cfg.date,
      time: cfg.time,
      venue: cfg.venue,
      city: cfg.city,
    };
  });

  // Third place - only populate when both SF matches have decisive results
  const sf01Result = knockoutResults.get('SF-01');
  const sf02Result = knockoutResults.get('SF-02');
  const thirdPlaceResult = knockoutResults.get('3RD');
  let thirdHomeTeam: string | null = null;
  let thirdAwayTeam: string | null = null;
  if (sf01Result && sf01Result.home !== sf01Result.away) {
    thirdHomeTeam = sf01Result.home < sf01Result.away
      ? sf[0]?.homeTeam ?? null
      : sf[0]?.awayTeam ?? null;
  }
  if (sf02Result && sf02Result.home !== sf02Result.away) {
    thirdAwayTeam = sf02Result.home < sf02Result.away
      ? sf[1]?.homeTeam ?? null
      : sf[1]?.awayTeam ?? null;
  }
  const thirdPlace: KnockoutMatch = {
    id: BRACKET_CONFIG.third_place.id,
    round: 'third_place',
    homeSlot: `P(${BRACKET_CONFIG.third_place.feederHome})`,
    awaySlot: `P(${BRACKET_CONFIG.third_place.feederAway})`,
    homeTeam: thirdHomeTeam,
    awayTeam: thirdAwayTeam,
    homeScore: thirdPlaceResult?.home ?? null,
    awayScore: thirdPlaceResult?.away ?? null,
    date: BRACKET_CONFIG.third_place.date,
    time: BRACKET_CONFIG.third_place.time,
    venue: BRACKET_CONFIG.third_place.venue,
    city: BRACKET_CONFIG.third_place.city,
  };

  // Final - only populate when both SF matches have decisive results
  const finalResult = knockoutResults.get('FINAL');
  let finalHomeTeam: string | null = null;
  let finalAwayTeam: string | null = null;
  if (sf01Result && sf01Result.home !== sf01Result.away) {
    finalHomeTeam = sf01Result.home > sf01Result.away
      ? sf[0]?.homeTeam ?? null
      : sf[0]?.awayTeam ?? null;
  }
  if (sf02Result && sf02Result.home !== sf02Result.away) {
    finalAwayTeam = sf02Result.home > sf02Result.away
      ? sf[1]?.homeTeam ?? null
      : sf[1]?.awayTeam ?? null;
  }
  const final: KnockoutMatch = {
    id: BRACKET_CONFIG.final.id,
    round: 'final',
    homeSlot: `V(${BRACKET_CONFIG.final.feederHome})`,
    awaySlot: `V(${BRACKET_CONFIG.final.feederAway})`,
    homeTeam: finalHomeTeam,
    awayTeam: finalAwayTeam,
    homeScore: finalResult?.home ?? null,
    awayScore: finalResult?.away ?? null,
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