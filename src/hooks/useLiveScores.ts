'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';

interface ESPNMatchScore {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  minute?: number;
  displayClock?: string;
}

interface LiveScoresResponse {
  serverTime: string;
  scores: Record<string, ESPNMatchScore>;
  source: string;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Polls /api/live-scores every 5 minutes.
 * Fetches REAL data from ESPN API.
 */
export function useLiveScores() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const firstPollDone = useRef(false);

  const bulkUpdateFromESPN = useWorldCupStore(s => s.bulkUpdateFromESPN);
  const lastPollTime = useWorldCupStore(s => s.lastPollTime);
  const setLastPollTime = useWorldCupStore(s => s.setLastPollTime);

  const poll = useCallback(async () => {
    try {
      const url = `/api/live-scores?XTransformPort=3000`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data: LiveScoresResponse = await res.json();

      if (!mountedRef.current) return;

      if (data.scores && Object.keys(data.scores).length > 0) {
        bulkUpdateFromESPN(data.scores);
      }

      setLastPollTime(new Date().toISOString());
      firstPollDone.current = true;
    } catch {
      // Silently fail - polling will retry
    }
  }, [bulkUpdateFromESPN, setLastPollTime]);

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