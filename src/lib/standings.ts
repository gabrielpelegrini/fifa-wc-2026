import { MatchDef, TeamStanding, Team } from '@/data/types';
import { TEAMS, GROUP_MAP } from '@/data/worldcup';

export function calculateGroupStandings(
  groupId: string,
  matches: MatchDef[]
): TeamStanding[] {
  const group = GROUP_MAP[groupId];
  if (!group) return [];

  const teamIds = group.teams;
  const standings: Map<string, TeamStanding> = new Map();

  for (const tid of teamIds) {
    standings.set(tid, {
      teamId: tid,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      position: 0,
    });
  }

  const groupMatches = matches.filter(
    m => m.group === groupId && m.homeScore !== null && m.awayScore !== null
  );

  for (const m of groupMatches) {
    const home = standings.get(m.homeTeam);
    const away = standings.get(m.awayTeam);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore!;
    home.goalsAgainst += m.awayScore!;
    away.goalsFor += m.awayScore!;
    away.goalsAgainst += m.homeScore!;

    if (m.homeScore! > m.awayScore!) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.homeScore! < m.awayScore!) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const s of standings.values()) {
    s.goalDiff = s.goalsFor - s.goalsAgainst;
  }

  // Sort and assign positions
  const sorted = applyTiebreakers(Array.from(standings.values()), matches, groupId);

  return sorted.map((s, i) => ({ ...s, position: i + 1 }));
}

function applyTiebreakers(
  teams: TeamStanding[],
  matches: MatchDef[],
  groupId: string
): TeamStanding[] {
  // Primary sort: points desc, goal diff desc, goals for desc
  const primary = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    // Fair play (negative = fewer cards = better)
    const aFP = (a as unknown as Record<string, unknown>).fairPlay as number | undefined ?? 0;
    const bFP = (b as unknown as Record<string, unknown>).fairPlay as number | undefined ?? 0;
    if (aFP !== bFP) return aFP - bFP;
    return 0;
  });

  // Group teams by points to find ties
  const pointsGroups = new Map<number, TeamStanding[]>();
  for (const t of primary) {
    const arr = pointsGroups.get(t.points) || [];
    arr.push(t);
    pointsGroups.set(t.points, arr);
  }

  const result: TeamStanding[] = [];

  for (const [pts, group] of pointsGroups) {
    if (group.length <= 1) {
      result.push(group[0]);
      continue;
    }

    // FIFA tiebreaker rules for 2+ teams tied:
    // 1. Head-to-head points among ALL tied teams (subset of matches where ALL competitors are tied)
    // 2. Head-to-head goal diff in those matches
    // 3. Head-to-head goals for in those matches
    // 4. Full group goal diff
    // 5. Full group goals for
    // 6. Fair play points (not yet tracked — defaults to 0)
    // 7. Drawing of lots

    const tiedIds = new Set(group.map(t => t.teamId));

    // Find all H2H matches among tied teams only
    const h2hMatches = matches.filter(m =>
      m.group === groupId &&
      m.homeScore != null &&
      m.awayScore != null &&
      tiedIds.has(m.homeTeam) &&
      tiedIds.has(m.awayTeam)
    );

    // Build H2H stats among tied teams
    const h2hPoints: Map<string, number> = new Map();
    const h2hGD: Map<string, number> = new Map();
    const h2hGF: Map<string, number> = new Map();

    for (const tid of tiedIds) {
      h2hPoints.set(tid, 0);
      h2hGD.set(tid, 0);
      h2hGF.set(tid, 0);
    }

    for (const m of h2hMatches) {
      const hs: number = m.homeScore!;
      const as: number = m.awayScore!;

      h2hPoints.set(m.homeTeam, (h2hPoints.get(m.homeTeam) || 0) + (hs > as ? 3 : hs === as ? 1 : 0));
      h2hPoints.set(m.awayTeam, (h2hPoints.get(m.awayTeam) || 0) + (as > hs ? 3 : as === hs ? 1 : 0));
      h2hGD.set(m.homeTeam, (h2hGD.get(m.homeTeam) || 0) + hs - as);
      h2hGD.set(m.awayTeam, (h2hGD.get(m.awayTeam) || 0) + as - hs);
      h2hGF.set(m.homeTeam, (h2hGF.get(m.homeTeam) || 0) + hs);
      h2hGF.set(m.awayTeam, (h2hGF.get(m.awayTeam) || 0) + as);
    }

    // Sort by H2H criteria
    const h2hSorted = [...group].sort((a, b) => {
      const ap = h2hPoints.get(a.teamId) || 0;
      const bp = h2hPoints.get(b.teamId) || 0;
      if (ap !== bp) return bp - ap;
      const agd = h2hGD.get(a.teamId) || 0;
      const bgd = h2hGD.get(b.teamId) || 0;
      if (agd !== bgd) return bgd - agd;
      const agf = h2hGF.get(a.teamId) || 0;
      const bgf = h2hGF.get(b.teamId) || 0;
      if (agf !== bgf) return bgf - agf;
      // If still tied after full H2H, fall back to overall group stats
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return 0;
    });

    // FIFA subset rule: if H2H doesn't fully break a 3+ team tie
    // (e.g., A beats B, B beats C, C beats A → circular), we need to
    // check if a subset of teams can be isolated.
    // The standard H2H filter above already handles this by only
    // considering matches where ALL teams involved are from the tied group.
    // For true circular ties that remain, FIFA uses fair play / drawing of lots.
    result.push(...h2hSorted);
  }

  return result;
}

export function getTeamName(teamId: string): string {
  return TEAMS[teamId]?.name || teamId;
}

export function getTeamFlag(teamId: string): string {
  const team = TEAMS[teamId];
  if (!team || team.flag === 'tbd') return '';
  return team.flag;
}

export function isPlaceholder(teamId: string): boolean {
  return TEAMS[teamId]?.isPlaceholder ?? true;
}

export function getAllTeams(): Team[] {
  return Object.values(TEAMS);
}