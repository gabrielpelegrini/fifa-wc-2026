import { NextResponse } from 'next/server';
import { GROUP_MATCHES } from '@/data/worldcup';
import { ESPN_TO_TEAM, extractGroup } from '@/lib/espnMapping';

// ── Types ──────────────────────────────────────────────────────────────

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  competitions: Array<{
    competitors: Array<{
      homeAway: string;
      score: string;
      team: { abbreviation: string; displayName: string };
    }>;
    status: {
      clock?: number;
      displayClock?: string;
      type: { name: string; completed: boolean; shortDetail?: string };
    };
    venue?: { fullName: string; address?: { city: string; country: string } };
    altGameNote?: string;
  }>;
}

interface MatchScore {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  minute?: number;
  displayClock?: string;
  // Optional date/time corrections from ESPN
  espnDate?: string;
  espnTime?: string;
  espnVenue?: string;
  espnCity?: string;
}

// ── In-memory cache ────────────────────────────────────────────────────

let cachedScores: Record<string, MatchScore> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

// ── Group stage date range ─────────────────────────────────────────────

const GROUP_STAGE_DATES = [
  '20260611', '20260612', '20260613', '20260614', '20260615',
  '20260616', '20260617', '20260618', '20260619', '20260620',
  '20260621', '20260622', '20260623', '20260624', '20260625',
  '20260626', '20260627',
];

// ── Build match lookup ─────────────────────────────────────────────────

function getMatchLookup(): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const m of GROUP_MATCHES) {
    const pair = [m.homeTeam, m.awayTeam].sort().join(':');
    const key = `${m.group}:${pair}`;
    lookup.set(key, m.id);
  }
  return lookup;
}

// ── Fetch ESPN scoreboard for a single date ────────────────────────────

async function fetchESPNDate(dateStr: string): Promise<ESPNEvent[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

// ── Classify ESPN status ───────────────────────────────────────────────

function classifyStatus(statusName: string): 'upcoming' | 'live' | 'finished' {
  if (statusName === 'STATUS_FULL_TIME' || statusName === 'STATUS_POSTPONED') return 'finished';
  if (
    statusName === 'STATUS_IN_PROGRESS' ||
    statusName === 'STATUS_HALFTIME' ||
    statusName === 'STATUS_1ST_PERIOD' ||
    statusName === 'STATUS_2ND_PERIOD' ||
    statusName === 'STATUS_EXTRA_TIME' ||
    statusName === 'STATUS_PENALTY_SHOOTOUT'
  ) return 'live';
  return 'upcoming'; // STATUS_SCHEDULED, etc.
}

// ── Main GET handler ───────────────────────────────────────────────────

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (cachedScores && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        serverTime: new Date().toISOString(),
        scores: cachedScores,
        source: 'cache',
        pollIntervalMs: 5 * 60 * 1000,
      });
    }

    // Fetch all dates in parallel
    const allEvents = await Promise.all(
      GROUP_STAGE_DATES.map(d => fetchESPNDate(d))
    );

    const lookup = getMatchLookup();
    const scores: Record<string, MatchScore> = {};

    for (const events of allEvents) {
      for (const event of events) {
        const comp = event.competitions[0];
        if (!comp) continue;

        // Extract group
        const group = comp.altGameNote ? extractGroup(comp.altGameNote) : null;
        if (!group) continue;

        // Get team IDs from ESPN abbreviations
        const homeComp = comp.competitors.find(c => c.homeAway === 'home');
        const awayComp = comp.competitors.find(c => c.homeAway === 'away');
        if (!homeComp || !awayComp) continue;

        const homeTeamId = ESPN_TO_TEAM[homeComp.team.abbreviation];
        const awayTeamId = ESPN_TO_TEAM[awayComp.team.abbreviation];
        if (!homeTeamId || !awayTeamId) continue;

        // Look up our match ID (order-independent)
        const pair = [homeTeamId, awayTeamId].sort().join(':');
        const matchId = lookup.get(`${group}:${pair}`);
        if (!matchId) continue;

        // Classify status
        const statusType = classifyStatus(comp.status.type.name);
        const isFinished = statusType === 'finished';
        const isLive = statusType === 'live';

        // Parse ESPN scores
        const espnHomeScore = isFinished || isLive
          ? parseInt(homeComp.score, 10) || 0
          : null;
        const espnAwayScore = isFinished || isLive
          ? parseInt(awayComp.score, 10) || 0
          : null;

        // CRITICAL: ESPN home/away may differ from our match's home/away.
        // Align scores to OUR match definition.
        const ourMatch = GROUP_MATCHES.find(m => m.id === matchId);
        let homeScore: number | null = null;
        let awayScore: number | null = null;

        if (ourMatch && (isFinished || isLive)) {
          if (homeTeamId === ourMatch.homeTeam) {
            // ESPN home = our home → same order
            homeScore = espnHomeScore;
            awayScore = espnAwayScore;
          } else {
            // ESPN home = our away → swap
            homeScore = espnAwayScore;
            awayScore = espnHomeScore;
          }
        }

        // Minute info for live matches
        const minute = isLive && comp.status.clock
          ? Math.floor(comp.status.clock / 60)
          : undefined;

        // Parse ESPN date/time for schedule correction
        const espnDate = event.date ? event.date.slice(0, 10) : undefined;
        const espnTime = event.date ? event.date.slice(11, 16) : undefined;

        scores[matchId] = {
          matchId,
          homeScore,
          awayScore,
          status: statusType,
          minute,
          displayClock: comp.status.displayClock,
          espnDate,
          espnTime,
          espnVenue: comp.venue?.fullName,
          espnCity: comp.venue?.address?.city,
        };
      }
    }

    // Update cache
    cachedScores = scores;
    cacheTimestamp = now;

    const finishedCount = Object.values(scores).filter(s => s.status === 'finished').length;
    const liveCount = Object.values(scores).filter(s => s.status === 'live').length;

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      scores,
      source: 'espn',
      _debug: { total: Object.keys(scores).length, finished: finishedCount, live: liveCount },
      pollIntervalMs: 5 * 60 * 1000,
    });
  } catch (error) {
    // If ESPN fails, return cached data (even if stale) or empty
    return NextResponse.json({
      serverTime: new Date().toISOString(),
      scores: cachedScores ?? {},
      source: cachedScores ? 'stale_cache' : 'error',
      error: String(error),
      pollIntervalMs: 5 * 60 * 1000,
    });
  }
}