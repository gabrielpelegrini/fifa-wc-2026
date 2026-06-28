'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
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
  knockoutEvents?: Array<{
    homeAbbr: string;
    awayAbbr: string;
    homeScore: string;
    awayScore: string;
    statusName: string;
    clock?: number;
    displayClock?: string;
  }>;
  source: string;
}

const SLOW_POLL_MS = 5 * 60 * 1000;  // 5 minutes
const FAST_POLL_MS = 30 * 1000;       // 30 seconds

/**
 * Polls /api/live-scores.
 * Supports fast mode (30s) for live minute-by-minute updates.
 */
export function useLiveScores() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const firstPollDone = useRef(false);
  const [fastMode, setFastMode] = useState(false);

  const bulkUpdateFromESPN = useWorldCupStore(s => s.bulkUpdateFromESPN);
  const updateKnockoutLive = useWorldCupStore(s => s.updateKnockoutLive);
  const lastPollTime = useWorldCupStore(s => s.lastPollTime);
  const setLastPollTime = useWorldCupStore(s => s.setLastPollTime);
  const isRefreshing = useWorldCupStore(s => s.isRefreshing);

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

      if (data.knockoutEvents && data.knockoutEvents.length > 0) {
        updateKnockoutLive(data.knockoutEvents);
      }

      setLastPollTime(new Date().toISOString());
      firstPollDone.current = true;
    } catch {
      // Silently fail - polling will retry
    }
  }, [bulkUpdateFromESPN, updateKnockoutLive, setLastPollTime]);

  // Restart interval when fastMode changes
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const ms = fastMode ? FAST_POLL_MS : SLOW_POLL_MS;
    intervalRef.current = setInterval(poll, ms);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [poll, fastMode]);

  // Initial poll
  useEffect(() => {
    poll();
  }, [poll]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const toggleFastMode = useCallback(() => {
    setFastMode(prev => !prev);
  }, []);

  return { poll, lastPollTime, fastMode, toggleFastMode, isRefreshing };
}