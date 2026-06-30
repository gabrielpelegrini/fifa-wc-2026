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
    homeName: string;
    awayName: string;
    homeScore: string;
    awayScore: string;
    statusName: string;
    clock?: number;
    displayClock?: string;
    shortDetail?: string;
    date?: string;
    time?: string;
    venue?: string;
    city?: string;
  }>;
  source: string;
}

const SLOW_POLL_MS = 5 * 60 * 1000;  // 5 minutes
const FAST_POLL_MS = 30 * 1000;       // 30 seconds

/**
 * Polls /api/live-scores with a mutex lock to prevent overlapping requests.
 * Supports fast mode (30s) for live minute-by-minute updates.
 */
export function useLiveScores() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const pollingLock = useRef(false); // Mutex: prevent overlapping polls
  const [fastMode, setFastMode] = useState(false);

  const bulkUpdateFromESPN = useWorldCupStore(s => s.bulkUpdateFromESPN);
  const updateKnockoutLive = useWorldCupStore(s => s.updateKnockoutLive);
  const setLastPollTime = useWorldCupStore(s => s.setLastPollTime);
  const setLiveMatches = useWorldCupStore(s => s.setLiveMatches);
  const lastPollTime = useWorldCupStore(s => s.lastPollTime);
  const isRefreshing = useWorldCupStore(s => s.isRefreshing);

  const poll = useCallback(async () => {
    // Mutex lock — skip if a poll is already in flight
    if (pollingLock.current) return;
    pollingLock.current = true;

    try {
      const url = `/api/live-scores`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data: LiveScoresResponse = await res.json();

      if (!mountedRef.current) return;

      if (data.source && data.source !== 'espn') {
        // API returned an error (timeout, etc.) — don't update state
        return;
      }

      if (data.scores && Object.keys(data.scores).length > 0) {
        bulkUpdateFromESPN(data.scores);
      }

      if (data.knockoutEvents && data.knockoutEvents.length > 0) {
        updateKnockoutLive(data.knockoutEvents);
      }

      // Clean liveMatches: remove entries for matches no longer live
      const currentLive = useWorldCupStore.getState().liveMatches;
      const newLive: Record<string, number> = {};
      for (const [matchId, minute] of Object.entries(currentLive)) {
        const score = data.scores?.[matchId];
        if (score && score.status === 'live') {
          newLive[matchId] = minute as number;
        }
      }
      if (Object.keys(newLive).length !== Object.keys(currentLive).length) {
        setLiveMatches(newLive);
      }

      setLastPollTime(new Date().toISOString());
    } catch {
      // Silently fail - polling will retry
    } finally {
      pollingLock.current = false;
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

  // Initial poll (uses same poll function — mutex prevents double)
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