import { TeamStanding, KnockoutMatch } from '@/data/types';
import { BRACKET_CONFIG } from '@/data/worldcup';
import { resolveThirdPlaceSlot, getThirdPlacePoolLabel } from './thirdPlaceRanking';
import { getTeamName } from './standings';
import { ThirdPlaceEntry } from '@/data/types';

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
  thirds: ThirdPlaceEntry[]
): { teamId: string | null; label: string } {
  // Group winner: 1A, 1B, ...
  if (/^1([A-L])$/.test(slot)) {
    const group = slot[1];
    const standings = allStandings.get(group);
    if (standings) {
      // Only resolve if the group has at least started playing
      const hasPlayed = standings.some(s => s.played > 0);
      if (!hasPlayed) return { teamId: null, label: `1° ${group}` };
      const winner = standings.find(s => s.position === 1);
      return { teamId: winner?.teamId || null, label: slot };
    }
    return { teamId: null, label: `1° ${group}` };
  }

  // Group runner-up: 2A, 2B, ...
  if (/^2([A-L])$/.test(slot)) {
    const group = slot[1];
    const standings = allStandings.get(group);
    if (standings) {
      const hasPlayed = standings.some(s => s.played > 0);
      if (!hasPlayed) return { teamId: null, label: `2° ${group}` };
      const runner = standings.find(s => s.position === 2);
      return { teamId: runner?.teamId || null, label: slot };
    }
    return { teamId: null, label: `2° ${group}` };
  }

  // Third place pool: 3ABC_1, 3DEF_2, etc.
  // Only resolve when ALL groups are complete (third-place ranking is definitive)
  if (/^3/.test(slot)) {
    if (!allGroupsComplete(allStandings)) {
      return { teamId: null, label: getThirdPlacePoolLabel(slot) };
    }
    const teamId = resolveThirdPlaceSlot(slot, allStandings, thirds);
    return { teamId, label: getThirdPlacePoolLabel(slot) };
  }

  return { teamId: null, label: slot };
}

function getWinnerOfMatch(matchId: string, knockoutResults: Map<string, { home: number; away: number }>): string | null {
  const result = knockoutResults.get(matchId);
  if (!result) return null;
  if (result.home > result.away) return `winner:${matchId}`;
  if (result.away > result.home) return `winner:${matchId}`;
  // Draw - for now, no penalties handling
  return null;
}

function getLoserOfMatch(matchId: string, knockoutResults: Map<string, { home: number; away: number }>): string | null {
  const result = knockoutResults.get(matchId);
  if (!result) return null;
  if (result.home > result.away) return `loser:${matchId}`;
  if (result.away > result.home) return `loser:${matchId}`;
  return null;
}

export function resolveBracket(
  allStandings: Map<string, TeamStanding[]>,
  thirds: ThirdPlaceEntry[],
  knockoutResults: Map<string, { home: number; away: number }>
): ResolvedBracket {
  // Resolve R32
  const r32: KnockoutMatch[] = BRACKET_CONFIG.r32.map(cfg => {
    const home = resolveSlotToTeamId(cfg.homeSlot, allStandings, thirds);
    const away = resolveSlotToTeamId(cfg.awaySlot, allStandings, thirds);
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
      venue: cfg.venue,
      city: cfg.city,
    };
  });

  // Resolve R16 - fed by R32
  const r16: KnockoutMatch[] = BRACKET_CONFIG.r16.map(cfg => {
    const homeFeeder = r32.find(m => m.id === cfg.feederHome);
    const awayFeeder = r32.find(m => m.id === cfg.feederAway);
    const homeTeamId = getWinnerOfMatch(cfg.feederHome, knockoutResults);
    const awayTeamId = getWinnerOfMatch(cfg.feederAway, knockoutResults);
    const result = knockoutResults.get(cfg.id);

    return {
      id: cfg.id,
      round: 'r16',
      homeSlot: `V(${cfg.feederHome})`,
      awaySlot: `V(${cfg.feederAway})`,
      homeTeam: homeTeamId?.replace('winner:', '') || homeFeeder?.homeTeam || null,
      awayTeam: awayTeamId?.replace('winner:', '') || awayFeeder?.awayTeam || null,
      homeScore: result?.home ?? null,
      awayScore: result?.away ?? null,
      date: cfg.date,
      venue: cfg.venue,
      city: cfg.city,
    };
  });

  // Resolve QF
  const qf: KnockoutMatch[] = BRACKET_CONFIG.qf.map(cfg => {
    const homeFeeder = r16.find(m => m.id === cfg.feederHome);
    const awayFeeder = r16.find(m => m.id === cfg.feederAway);
    const result = knockoutResults.get(cfg.id);
    return {
      id: cfg.id,
      round: 'qf',
      homeSlot: `V(${cfg.feederHome})`,
      awaySlot: `V(${cfg.feederAway})`,
      homeTeam: homeFeeder?.homeTeam || null,
      awayTeam: awayFeeder?.awayTeam || null,
      homeScore: result?.home ?? null,
      awayScore: result?.away ?? null,
      date: cfg.date,
      venue: cfg.venue,
      city: cfg.city,
    };
  });

  // Resolve SF
  const sf: KnockoutMatch[] = BRACKET_CONFIG.sf.map(cfg => {
    const homeFeeder = qf.find(m => m.id === cfg.feederHome);
    const awayFeeder = qf.find(m => m.id === cfg.feederAway);
    const result = knockoutResults.get(cfg.id);
    return {
      id: cfg.id,
      round: 'sf',
      homeSlot: `V(${cfg.feederHome})`,
      awaySlot: `V(${cfg.feederAway})`,
      homeTeam: homeFeeder?.homeTeam || null,
      awayTeam: awayFeeder?.awayTeam || null,
      homeScore: result?.home ?? null,
      awayScore: result?.away ?? null,
      date: cfg.date,
      venue: cfg.venue,
      city: cfg.city,
    };
  });

  // Third place
  const sf01Result = knockoutResults.get('SF-01');
  const sf02Result = knockoutResults.get('SF-02');
  const thirdPlaceResult = knockoutResults.get('3RD');
  const thirdPlace: KnockoutMatch = {
    id: BRACKET_CONFIG.third_place.id,
    round: 'third_place',
    homeSlot: `P(${BRACKET_CONFIG.third_place.feederHome})`,
    awaySlot: `P(${BRACKET_CONFIG.third_place.feederAway})`,
    homeTeam: sf01Result ? (sf01Result.home < sf01Result.away ? sf[0]?.homeTeam : sf[0]?.awayTeam) : sf[0]?.homeTeam || null,
    awayTeam: sf02Result ? (sf02Result.home < sf02Result.away ? sf[1]?.homeTeam : sf[1]?.awayTeam) : sf[1]?.homeTeam || null,
    homeScore: thirdPlaceResult?.home ?? null,
    awayScore: thirdPlaceResult?.away ?? null,
    date: BRACKET_CONFIG.third_place.date,
    venue: BRACKET_CONFIG.third_place.venue,
    city: BRACKET_CONFIG.third_place.city,
  };

  // Final
  const finalResult = knockoutResults.get('FINAL');
  const final: KnockoutMatch = {
    id: BRACKET_CONFIG.final.id,
    round: 'final',
    homeSlot: `V(${BRACKET_CONFIG.final.feederHome})`,
    awaySlot: `V(${BRACKET_CONFIG.final.feederAway})`,
    homeTeam: sf01Result ? (sf01Result.home > sf01Result.away ? sf[0]?.homeTeam : sf[0]?.awayTeam) : sf[0]?.homeTeam || null,
    awayTeam: sf02Result ? (sf02Result.home > sf02Result.away ? sf[1]?.homeTeam : sf[1]?.awayTeam) : sf[1]?.homeTeam || null,
    homeScore: finalResult?.home ?? null,
    awayScore: finalResult?.away ?? null,
    date: BRACKET_CONFIG.final.date,
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