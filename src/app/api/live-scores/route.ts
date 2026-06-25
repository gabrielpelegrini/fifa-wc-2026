import { NextResponse } from 'next/server';
import { GROUP_MATCHES } from '@/data/worldcup';

// Deterministic pseudo-random based on seed string
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 16807 + 0) % 2147483647;
    return (h & 0x7fffffff) / 0x7fffffff;
  };
}

interface LiveScoreUpdate {
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'finished';
  minute?: number;
  elapsed?: number; // minutes elapsed
}

/**
 * Simulates progressive live scores for matches.
 *
 * Logic:
 * - A match is "live" if current time is within 105 min after kickoff (90 + 15 HT)
 * - A match is "finished" if current time is > 105 min after kickoff
 * - Scores are deterministic per match ID + date (no random jumps between polls)
 * - Within "live", score advances proportionally to elapsed time
 * - Returns updates only for live/just-finished matches not already finished client-side
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientFinishedIds = searchParams.get('finished')?.split(',').filter(Boolean) ?? [];

    const now = new Date();
    const updates: LiveScoreUpdate[] = [];

    for (const match of GROUP_MATCHES) {
      // Skip if client already has this match finished
      if (clientFinishedIds.includes(match.id)) continue;

      const kickoff = new Date(`${match.date}T${match.time}:00Z`);
      const elapsedMs = now.getTime() - kickoff.getTime();
      const elapsedMin = elapsedMs / (1000 * 60);
      const MATCH_DURATION = 105; // 90 min + 15 min half-time equivalent

      if (elapsedMin < 0) {
        // Match hasn't started yet
        continue;
      }

      if (elapsedMin >= MATCH_DURATION) {
        // Match is finished - generate final score
        const rng = seededRandom(match.id + '-final');
        const r = rng();
        let homeScore: number, awayScore: number;

        if (r < 0.25) {
          // Draw
          const goals = Math.floor(rng() * 4); // 0-3
          homeScore = goals;
          awayScore = goals;
        } else if (r < 0.625) {
          // Home win
          homeScore = 1 + Math.floor(rng() * 3); // 1-3
          awayScore = Math.floor(rng() * 3); // 0-2
          if (homeScore === awayScore) homeScore = awayScore + 1;
        } else {
          // Away win
          awayScore = 1 + Math.floor(rng() * 3);
          homeScore = Math.floor(rng() * 3);
          if (homeScore === awayScore) awayScore = homeScore + 1;
        }

        updates.push({
          matchId: match.id,
          homeScore,
          awayScore,
          status: 'finished',
          minute: 90,
        });
      } else {
        // Match is live - generate progressive score
        const rng = seededRandom(match.id + '-live');
        const progress = elapsedMin / MATCH_DURATION; // 0 to 1

        // Generate potential final score first
        const r = rng();
        let finalHome: number, finalAway: number;

        if (r < 0.25) {
          const goals = Math.floor(rng() * 4);
          finalHome = goals;
          finalAway = goals;
        } else if (r < 0.625) {
          finalHome = 1 + Math.floor(rng() * 3);
          finalAway = Math.floor(rng() * 3);
          if (finalHome === finalAway) finalHome = finalAway + 1;
        } else {
          finalAway = 1 + Math.floor(rng() * 3);
          finalHome = Math.floor(rng() * 3);
          if (finalHome === finalAway) finalAway = finalHome + 1;
        }

        const totalGoals = finalHome + finalAway;

        // Distribute goals across time - goals tend to come in bursts
        const rngTime = seededRandom(match.id + '-timing');
        const goalMinutes: number[] = [];
        for (let g = 0; g < totalGoals; g++) {
          // Goals distributed across 90 min, weighted toward 2nd half
          const base = 30 + rngTime() * 55; // 30-85 min range
          goalMinutes.push(Math.round(base));
        }
        goalMinutes.sort((a, b) => a - b);

        // Count how many goals should have happened by now
        const displayMinute = Math.min(Math.floor(elapsedMin * (90 / MATCH_DURATION)), 90);
        const currentHome = goalMinutes.filter((m, i) => m <= displayMinute && i % 2 === 0).length;
        const currentAway = goalMinutes.filter((m, i) => m <= displayMinute && i % 2 === 1).length;

        // Alternate goal assignment: even index = home, odd = away
        // But also check if we need to re-assign based on final score
        let liveHome = 0, liveAway = 0;
        for (let i = 0; i < goalMinutes.length; i++) {
          if (goalMinutes[i] <= displayMinute) {
            if (i < finalHome + finalAway) {
              // Simple: first finalHome goals are home, rest are away
              if (i < finalHome) liveHome++;
              else liveAway++;
            }
          }
        }

        updates.push({
          matchId: match.id,
          homeScore: liveHome,
          awayScore: liveAway,
          status: 'live',
          minute: displayMinute,
          elapsed: Math.round(elapsedMin),
        });
      }
    }

    return NextResponse.json({
      serverTime: now.toISOString(),
      updates,
      pollIntervalMs: 5 * 60 * 1000, // 5 minutes
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}