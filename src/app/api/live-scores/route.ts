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
  espnDate?: string;
  espnTime?: string;
  espnVenue?: string;
  espnCity?: string;
}

interface RawKnockoutEvent {
  homeAbbr: string;
  awayAbbr: string;
  homeName: string;
  awayName: string;
  homeScore: string;
  awayScore: string;
  statusName: string;
  clock?: number;
  displayClock?: string;
  shortDetail?: string; // e.g. "Argentina wins in PK 4-2"
  date?: string;        // ISO date from ESPN
  time?: string;        // HH:MM UTC
  venue?: string;
  city?: string;
}

// ── NO in-memory cache ──────────────────────────────────────────────
// Removed: in-memory cache is useless on Vercel serverless (instances don't share state).
// Each request fetches fresh data. Client-side polling (5min) handles dedup.
// For manual refresh, the _refresh param is kept but now just bypasses any CDN.

// ── Group stage date range ─────────────────────────────────────────────
// Full list of ALL group stage dates (June 11–28, 2026)
// NOTE: Group J Matchday 3 is on June 28 — MUST be included!
const ALL_GROUP_DATES = [
  '20260611', '20260612', '20260613', '20260614', '20260615',
  '20260616', '20260617', '20260618', '20260619', '20260620',
  '20260621', '20260622', '20260623', '20260624', '20260625',
  '20260626', '20260627', '20260628',
];

// ── Knockout stage date range ───────────────────────────────────────────
// Full knockout stage: June 28 – July 19, 2026 (R32 through Final)
const KNOCKOUT_DATES = [
  '20260628', '20260629', '20260630',
  '20260701', '20260702', '20260703', '20260704',
  '20260705', '20260706', '20260707',
  '20260709', '20260710', '20260711', '20260712',
  '20260714', '20260715',
  '20260718', '20260719',
];

/** Build a smart date list: all group dates + all knockout dates + dynamic window */
function buildFetchDates(): string[] {
  const dates = new Set<string>();
  const nowUtc = new Date();

  // Always include ALL group stage dates (needed for correct standings)
  for (const gd of ALL_GROUP_DATES) {
    dates.add(gd);
  }

  // Always include ALL knockout stage dates (for bracket live scores)
  for (const kd of KNOCKOUT_DATES) {
    dates.add(kd);
  }

  // Dynamic window: -2 to +10 days (catches recently-added/rescheduled matches near today)
  // Note: all group + knockout dates are already explicitly included above
  for (let offset = -2; offset <= 10; offset++) {
    const d = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate() + offset));
    dates.add(d.toISOString().slice(0, 10).replace(/-/g, ''));
  }

  return Array.from(dates).sort();
}

// ── Build match lookup ─────────────────────────────────────────────────

let _matchLookup: Map<string, string> | null = null;
function getMatchLookup(): Map<string, string> {
  if (_matchLookup) return _matchLookup;
  _matchLookup = new Map<string, string>();
  for (const m of GROUP_MATCHES) {
    const pair = [m.homeTeam, m.awayTeam].sort().join(':');
    const key = `${m.group}:${pair}`;
    _matchLookup.set(key, m.id);
  }
  return _matchLookup;
}

// ── Fetch ESPN scoreboard for a single date ────────────────────────────

async function fetchESPNDate(dateStr: string, signal?: AbortSignal): Promise<ESPNEvent[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`;
    const res = await fetch(url, { signal, next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch (err) {
    console.error(`[live-scores] ESPN fetch failed for ${dateStr}:`, err);
    return [];
  }
}

// ── Fetch dates in batches to avoid timeout ────────────────────────────
// Instead of 25 parallel fetches, batch in groups of 5 with sequential batches

async function fetchAllDatesBatched(dates: string[], signal?: AbortSignal): Promise<ESPNEvent[]> {
  const BATCH_SIZE = 10; // Larger batches for speed
  const allEvents: ESPNEvent[] = [];

  for (let i = 0; i < dates.length; i += BATCH_SIZE) {
    if (signal?.aborted) break;
    const batch = dates.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(d => fetchESPNDate(d, signal))
    );
    for (const events of results) {
      allEvents.push(...events);
    }
  }

  return allEvents;
}

// ── Classify ESPN status ───────────────────────────────────────────────

function classifyStatus(statusName: string): 'upcoming' | 'live' | 'finished' {
  if (statusName === 'STATUS_FULL_TIME') return 'finished';
  if (
    statusName === 'STATUS_IN_PROGRESS' ||
    statusName === 'STATUS_HALFTIME' ||
    statusName === 'STATUS_1ST_PERIOD' ||
    statusName === 'STATUS_2ND_PERIOD' ||
    statusName === 'STATUS_EXTRA_TIME' ||
    statusName === 'STATUS_PENALTY_SHOOTOUT'
  ) return 'live';
  return 'upcoming';
}

// ── Main GET handler ───────────────────────────────────────────────────

export async function GET(request: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout (all group + knockout dates)

  try {
    const { searchParams } = new URL(request.url);

    // Smart date list: dynamic window + last 3 group dates (avoids 27-date timeout)
    const ALL_DATES = buildFetchDates();

    // Fetch in batches of 5 to avoid timeout
    const allEvents = await fetchAllDatesBatched(ALL_DATES, controller.signal);

    const lookup = getMatchLookup();
    const scores: Record<string, MatchScore> = {};
    const rawKnockout: RawKnockoutEvent[] = [];

    for (const event of allEvents) {
      const comp = event.competitions[0];
      if (!comp) continue;

      // Extract group
      const group = comp.altGameNote ? extractGroup(comp.altGameNote) : null;
      if (!group) {
        // Non-group event — collect as potential knockout match
        const hc = comp.competitors.find(c => c.homeAway === 'home');
        const ac = comp.competitors.find(c => c.homeAway === 'away');
        if (hc && ac) {
          rawKnockout.push({
            homeAbbr: hc.team.abbreviation,
            awayAbbr: ac.team.abbreviation,
            homeName: hc.team.displayName,
            awayName: ac.team.displayName,
            homeScore: hc.score,
            awayScore: ac.score,
            statusName: comp.status.type.name,
            clock: comp.status.clock,
            displayClock: comp.status.displayClock,
            shortDetail: comp.status.type.shortDetail,
            date: event.date ? event.date.slice(0, 10) : undefined,
            time: event.date ? event.date.slice(11, 16) : undefined,
            venue: comp.venue?.fullName,
            city: comp.venue?.address?.city,
          });
        }
        continue;
      }

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
      const ourMatch = GROUP_MATCHES.find(m => m.id === matchId);
      let homeScore: number | null = null;
      let awayScore: number | null = null;

      if (ourMatch && (isFinished || isLive)) {
        if (homeTeamId === ourMatch.homeTeam) {
          homeScore = espnHomeScore;
          awayScore = espnAwayScore;
        } else {
          homeScore = espnAwayScore;
          awayScore = espnHomeScore;
        }
      }

      // Minute info for live matches
      const minute = isLive && comp.status.clock
        ? Math.floor(comp.status.clock / 60)
        : undefined;

      // Parse ESPN date/time
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

    const finishedCount = Object.values(scores).filter(s => s.status === 'finished').length;
    const liveCount = Object.values(scores).filter(s => s.status === 'live').length;

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      scores,
      knockoutEvents: rawKnockout,
      source: 'espn',
      pollIntervalMs: 5 * 60 * 1000,
    });
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    return NextResponse.json({
      serverTime: new Date().toISOString(),
      scores: {},
      knockoutEvents: [],
      source: 'error',
      error: isTimeout ? 'ESPN timeout — too many dates' : 'Internal server error',
      pollIntervalMs: 5 * 60 * 1000,
    });
  } finally {
    clearTimeout(timeout);
  }
}