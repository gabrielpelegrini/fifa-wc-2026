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
  pollIntervalMs: number;
}

/**
 * Polls /api/live-scores every 20 minutes.
 * Only active when autoUpdate is enabled in the store.
 * Skips matches the client already knows are finished.
 */
export function useLiveScores() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const setScore = useWorldCupStore(s => s.setScore);
  const setScoreLive = useWorldCupStore(s => s.setScoreLive);
  const matches = useWorldCupStore(s => s.matches);
  const autoUpdate = useWorldCupStore(s => s.autoUpdate);
  const lastPollTime = useWorldCupStore(s => s.lastPollTime);
  const liveMatches = useWorldCupStore(s => s.liveMatches);
  const setAutoUpdate = useWorldCupStore(s => s.setAutoUpdate);
  const setLastPollTime = useWorldCupStore(s => s.setLastPollTime);
  const setLiveMatches = useWorldCupStore(s => s.setLiveMatches);

  const poll = useCallback(async () => {
    try {
      // Collect match IDs that are already finished on client
      const finishedIds = matches
        .filter(m => m.status === 'finished')
        .map(m => m.id)
        .join(',');

      const url = `/api/live-scores?XTransformPort=3000&finished=${encodeURIComponent(finishedIds)}`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data: LiveScoresResponse = await res.json();

      if (!mountedRef.current) return;

      // Apply updates
      let hadUpdates = false;
      const newLiveMatches: Record<string, number> = {};

      for (const update of data.updates) {
        if (update.status === 'live') {
          const minute = update.minute ?? 0;
          setScoreLive(update.matchId, update.homeScore, update.awayScore, minute);
          newLiveMatches[update.matchId] = minute;
          hadUpdates = true;
        } else if (update.status === 'finished') {
          setScore(update.matchId, update.homeScore, update.awayScore);
          hadUpdates = true;
        }
      }

      setLiveMatches(newLiveMatches);
      setLastPollTime(new Date().toISOString());

      // Clear interval if no live matches and all group matches done
      if (Object.keys(newLiveMatches).length === 0 && data.updates.length === 0) {
        // Could stop polling, but keep going in case knockout matches start
      }
    } catch {
      // Silently fail - polling will retry on next interval
    }
  }, [matches, setScore, setScoreLive, setLiveMatches, setLastPollTime]);

  // Start/stop polling based on autoUpdate flag
  useEffect(() => {
    if (!autoUpdate) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial poll immediately
    poll();

    // Then every 20 minutes
    intervalRef.current = setInterval(poll, 20 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoUpdate, poll]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { poll, autoUpdate, setAutoUpdate, lastPollTime, liveMatches };
}