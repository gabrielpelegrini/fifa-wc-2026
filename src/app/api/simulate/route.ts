import { NextRequest, NextResponse } from 'next/server';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function simulateGroupMatch(): { home: number; away: number } {
  const r = Math.random();
  if (r < 0.25) {
    const goals = randInt(0, 3);
    return { home: goals, away: goals };
  }
  if (r < 0.625) {
    return { home: randInt(1, 3), away: randInt(0, 2) };
  }
  return { home: randInt(0, 2), away: randInt(1, 3) };
}

function simulateKnockoutMatch(): { home: number; away: number } {
  const r = Math.random();
  if (r < 0.3) {
    const goals = randInt(0, 2);
    const winner = Math.random() < 0.5 ? 1 : -1;
    return winner > 0
      ? { home: goals + 1, away: goals }
      : { home: goals, away: goals + 1 };
  }
  if (r < 0.65) {
    return { home: randInt(1, 3), away: randInt(0, 2) };
  }
  return { home: randInt(0, 2), away: randInt(1, 3) };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { round, all } = body as { round?: number; all?: boolean };

    const { GROUP_MATCHES } = await import('@/data/worldcup');
    const scores: Record<string, { home: number; away: number }> = {};

    if (all) {
      for (const m of GROUP_MATCHES) {
        scores[m.id] = simulateGroupMatch();
      }
    } else if (round) {
      const roundMatches = GROUP_MATCHES.filter(m => m.round === round);
      for (const m of roundMatches) {
        scores[m.id] = simulateGroupMatch();
      }
    }

    return NextResponse.json({ scores });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}