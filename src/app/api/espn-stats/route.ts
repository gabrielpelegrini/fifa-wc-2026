import { NextResponse } from 'next/server';

// ── Types ──────────────────────────────────────────────────────────────

interface PlayerStat {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamAbbr: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  appearances: number;
}

interface EventSummary {
  id: string;
  date: string;
  homeTeam: { id: string; name: string; abbr: string };
  awayTeam: { id: string; name: string; abbr: string };
  homeScore: number;
  awayScore: number;
  status: string;
  keyEvents: Array<{
    type: { text: string; type: string };
    team: { id: string; displayName: string; abbreviation: string };
    participants: Array<{ athlete: { id: string; displayName: string } }>;
    clock: { displayValue: string };
    scoringPlay: boolean;
    text: string;
    shortText: string;
  }>;
}

// ── Cache ──────────────────────────────────────────────────────────────
let _cache: { data: { scorers: PlayerStat[]; all: PlayerStat[] }; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── ESPN API helpers ───────────────────────────────────────────────────

async function fetchScoreboard(dates: string[], signal?: AbortSignal) {
  const allEvents: Array<{ id: string; date: string; status: string; note: string }> = [];
  const BATCH = 10;
  for (let i = 0; i < dates.length; i += BATCH) {
    if (signal?.aborted) break;
    const batch = dates.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (d) => {
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${d}`;
          const res = await fetch(url, { signal, next: { revalidate: 60 } });
          if (!res.ok) return [];
          const data = await res.json();
          return (data.events ?? []).map((e: Record<string, unknown>) => ({
            id: String(e.id),
            date: (e.date as string)?.slice(0, 10) ?? '',
            status: e.competitions?.[0]?.status?.type?.name ?? '',
            note: e.competitions?.[0]?.altGameNote ?? '',
          }));
        } catch { return []; }
      })
    );
    for (const r of results) allEvents.push(...r);
  }
  return allEvents;
}

async function fetchSummary(eventId: string, signal?: AbortSignal): Promise<EventSummary | null> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`;
    const res = await fetch(url, { signal, next: { revalidate: 300 } });
    if (!res.ok) return null;
    const d = await res.json();
    if (d.code) return null;

    const comp = d.header?.competitions?.[0];
    if (!comp) return null;

    const hc = comp.competitors?.find((c: Record<string, unknown>) => c.homeAway === 'home');
    const ac = comp.competitors?.find((c: Record<string, unknown>) => c.homeAway === 'away');
    if (!hc || !ac) return null;

    return {
      id: d.header?.id ?? eventId,
      date: comp.date?.slice(0, 10) ?? '',
      homeTeam: {
        id: String(hc.team?.id ?? ''),
        name: hc.team?.displayName ?? '',
        abbr: hc.team?.abbreviation ?? '',
      },
      awayTeam: {
        id: String(ac.team?.id ?? ''),
        name: ac.team?.displayName ?? '',
        abbr: ac.team?.abbreviation ?? '',
      },
      homeScore: parseInt(hc.score, 10) || 0,
      awayScore: parseInt(ac.score, 10) || 0,
      status: comp.status?.type?.name ?? '',
      keyEvents: (d.keyEvents ?? []).map((ev: Record<string, unknown>) => ({
        type: { text: (ev.type as Record<string, string>)?.text ?? '', type: (ev.type as Record<string, string>)?.type ?? '' },
        team: { id: String((ev.team as Record<string, string>)?.id ?? ''), displayName: (ev.team as Record<string, string>)?.displayName ?? '', abbreviation: (ev.team as Record<string, string>)?.abbreviation ?? '' },
        participants: ((ev.participants ?? []) as Array<Record<string, unknown>>).map((p: Record<string, unknown>) => ({
          athlete: { id: String((p.athlete as Record<string, string>)?.id ?? ''), displayName: (p.athlete as Record<string, string>)?.displayName ?? '' },
        })),
        clock: { displayValue: (ev.clock as Record<string, string>)?.displayValue ?? '' },
        scoringPlay: ev.scoringPlay === true,
        text: (ev.text as string) ?? '',
        shortText: (ev.shortText as string) ?? '',
      })),
    };
  } catch { return null; }
}

// ── Aggregation ────────────────────────────────────────────────────────

function aggregateStats(summaries: EventSummary[]): { scorers: PlayerStat[]; all: PlayerStat[] } {
  const map = new Map<string, PlayerStat>();

  const ensure = (pid: string, pname: string, tid: string, tname: string, tabbr: string): PlayerStat => {
    const key = pid;
    let s = map.get(key);
    if (!s) {
      s = { playerId: pid, playerName: pname, teamId: tid, teamName: tname, teamAbbr: tabbr, goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0 };
      map.set(key, s);
    }
    return s;
  };

  for (const sm of summaries) {
    if (sm.status !== 'STATUS_FULL_TIME' && sm.status !== 'STATUS_FINAL' && sm.status !== 'STATUS_FINAL_PEN') continue;

    for (const ev of sm.keyEvents) {
      const tType = ev.type.type.toLowerCase();
      const tText = ev.type.text;

      // Goals
      if (tType.startsWith('goal') && ev.scoringPlay && ev.participants.length > 0) {
        const scorer = ev.participants[0].athlete;
        const p = ensure(scorer.id, scorer.displayName, ev.team.id, ev.team.displayName, ev.team.abbreviation);
        p.goals++;
        p.appearances = Math.max(p.appearances, 1);

        // Assist (2nd participant)
        if (ev.participants.length > 1) {
          const assister = ev.participants[1].athlete;
          const a = ensure(assister.id, assister.displayName, ev.team.id, ev.team.displayName, ev.team.abbreviation);
          a.assists++;
          a.appearances = Math.max(a.appearances, 1);
        }
      }

      // Yellow cards
      if (tText === 'Yellow Card' && ev.participants.length > 0) {
        const p = ensure(ev.participants[0].athlete.id, ev.participants[0].athlete.displayName, ev.team.id, ev.team.displayName, ev.team.abbreviation);
        p.yellowCards++;
        p.appearances = Math.max(p.appearances, 1);
      }

      // Red cards
      if (tText === 'Red Card' && ev.participants.length > 0) {
        const p = ensure(ev.participants[0].athlete.id, ev.participants[0].athlete.displayName, ev.team.id, ev.team.displayName, ev.team.abbreviation);
        p.redCards++;
        p.appearances = Math.max(p.appearances, 1);
      }

      // Second Yellow -> Red
      if (tText === 'Second Yellow Card' && ev.participants.length > 0) {
        const p = ensure(ev.participants[0].athlete.id, ev.participants[0].athlete.displayName, ev.team.id, ev.team.displayName, ev.team.abbreviation);
        p.redCards++;
        p.appearances = Math.max(p.appearances, 1);
      }
    }
  }

  const all = Array.from(map.values());
  const scorers = all.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  const sorted = all.sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.yellowCards - b.yellowCards);

  return { scorers, all: sorted };
}

// ── Main handler ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Return cached data if fresh
  if (_cache && Date.now() - _cache.timestamp < CACHE_TTL) {
    return NextResponse.json({
      ..._cache.data,
      cached: true,
      serverTime: new Date().toISOString(),
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50_000);

  try {
    // 1. Get all match event IDs
    const ALL_DATES: string[] = [];
    // Group stage: June 11-28
    for (let d = 11; d <= 28; d++) ALL_DATES.push(`202606${String(d).padStart(2, '0')}`);
    // Knockout: June 28 - yesterday (no need to fetch future dates)
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const koEnd = todayStr < '20260719' ? todayStr : '20260719';
    // June 28-30
    for (let d = 28; d <= 30; d++) ALL_DATES.push(`202606${String(d).padStart(2, '0')}`);
    // July 1 - min(koEnd, today)
    for (let d = 1; d <= 19; d++) {
      const ds = `202607${String(d).padStart(2, '0')}`;
      if (ds <= koEnd) ALL_DATES.push(ds);
      else break;
    }
    // Deduplicate (June 28 appears in both ranges)
    const uniqueDates = [...new Set(ALL_DATES)];

    const events = await fetchScoreboard(uniqueDates, controller.signal);
    // Only fetch finished matches
    const finishedIds = events
      .filter(e => e.status === 'STATUS_FULL_TIME' || e.status === 'STATUS_FINAL' || e.status === 'STATUS_FINAL_PEN')
      .map(e => e.id);

    // 2. Fetch summaries in parallel batches
    const BATCH = 8;
    const summaries: EventSummary[] = [];
    for (let i = 0; i < finishedIds.length; i += BATCH) {
      if (controller.signal.aborted) break;
      const batch = finishedIds.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(id => fetchSummary(id, controller.signal))
      );
      for (const r of results) {
        if (r) summaries.push(r);
      }
    }

    // 3. Aggregate
    const data = aggregateStats(summaries);

    // Cache
    _cache = { data, timestamp: Date.now() };

    return NextResponse.json({
      ...data,
      cached: false,
      matchesProcessed: summaries.length,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    // On error, return stale cache if available
    if (_cache) {
      return NextResponse.json({
        ..._cache.data,
        cached: true,
        stale: true,
        serverTime: new Date().toISOString(),
      });
    }
    const msg = error instanceof DOMException && error.name === 'AbortError'
      ? 'Timeout aggregating stats'
      : 'Error fetching stats';
    return NextResponse.json({ error: msg, scorers: [], all: [] }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}