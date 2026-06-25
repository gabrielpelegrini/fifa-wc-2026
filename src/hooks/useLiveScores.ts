'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';

interface LiveUpdate {
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'finished';
  minute?: number;
}

interface LiveScoresResponse {
  serverTime: string;
  updates: LiveUpdate[];
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Polls /api/live-scores every 5 minutes.
 * Auto-starts on mount (no toggle needed — data is always automatic).
 */
export function useLiveScores() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const setScore = useWorldCupStore(s => s.setScore);
  const setScoreLive = useWorldCupStore(s => s.setScoreLive);
  const matches = useWorldCupStore(s => s.matches);
  const lastPollTime = useWorldCupStore(s => s.lastPollTime);
  const setLastPollTime = useWorldCupStore(s => s.setLastPollTime);
  const setLiveMatches = useWorldCupStore(s => s.setLiveMatches);

  const poll = useCallback(async () => {
    try {
      const finishedIds = matches
        .filter(m => m.status === 'finished')
        .map(m => m.id)
        .join(',');

      const url = `/api/live-scores?XTransformPort=3000&finished=${encodeURIComponent(finishedIds)}`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data: LiveScoresResponse = await res.json();

      if (!mountedRef.current) return;

      const newLiveMatches: Record<string, number> = {};

      for (const update of data.updates) {
        if (update.status === 'live') {
          const minute = update.minute ?? 0;
          setScoreLive(update.matchId, update.homeScore, update.awayScore, minute);
          newLiveMatches[update.matchId] = minute;
        } else if (update.status === 'finished') {
          setScore(update.matchId, update.homeScore, update.awayScore);
        }
      }

      setLiveMatches(newLiveMatches);
      setLastPollTime(new Date().toISOString());
    } catch {
      // Silently fail - polling will retry
    }
  }, [matches, setScore, setScoreLive, setLiveMatches, setLastPollTime]);

  // Always poll — no toggle needed
  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [poll]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return { poll, lastPollTime };
}