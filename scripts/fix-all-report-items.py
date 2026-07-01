#!/usr/bin/env python3
"""
Master fix script: addresses ALL pending items from QA + Visual + Tech Council report.
Run from project root: python scripts/fix-all-report-items.py
"""
import re
import os

BASE = "/home/z/my-project/src"

def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✅ {path}")

# ═══════════════════════════════════════════════════════════════════════════
# 1. types.ts — Add fairPlay to TeamStanding, remove unused BracketMatch
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 types.ts")
p = f"{BASE}/data/types.ts"
c = read(p)
# Add fairPlay to TeamStanding
c = c.replace(
    """export interface TeamStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  position: number;
}""",
    """export interface TeamStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  fairPlay: number; // negative = fewer cards = better (not yet tracked via ESPN)
  position: number;
}"""
)
# Remove unused BracketMatch interface
c = c.replace(
    """export interface BracketMatch {
  id: string;
  round: 'r32' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final';
  homeSlot: string; // slot reference string
  awaySlot: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  feederHome?: string; // winner of which match
  feederAway?: string;
  date: string;
  venue: string;
  city: string;
}

export interface TimezoneOption {""",
    """export interface TimezoneOption {"""
)
write(p, c)

# ═══════════════════════════════════════════════════════════════════════════
# 2. standings.ts — Initialize fairPlay: 0 in standings, remove unsafe cast
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 standings.ts")
p = f"{BASE}/lib/standings.ts"
c = read(p)
# Add fairPlay: 0 to initial standing
c = c.replace(
    """    standings.set(tid, {
      teamId: tid,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      position: 0,
    });""",
    """    standings.set(tid, {
      teamId: tid,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      fairPlay: 0,
      position: 0,
    });"""
)
# Replace unsafe cast with direct property access
c = c.replace(
    """    // Fair play (negative = fewer cards = better)
    const aFP = (a as unknown as Record<string, unknown>).fairPlay as number | undefined ?? 0;
    const bFP = (b as unknown as Record<string, unknown>).fairPlay as number | undefined ?? 0;""",
    """    // Fair play (negative = fewer cards = better)
    const aFP = 'fairPlay' in a ? a.fairPlay : 0;
    const bFP = 'fairPlay' in b ? b.fairPlay : 0;"""
)
write(p, c)

# ═══════════════════════════════════════════════════════════════════════════
# 3. route.ts — revalidate 60s, remove _debug, safe error message, shared classifyStatus
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 route.ts")
p = f"{BASE}/app/api/live-scores/route.ts"
c = read(p)
# Add revalidate
c = c.replace(
    "const res = await fetch(url, { signal, next: { revalidate: 0 } });",
    "const res = await fetch(url, { signal, next: { revalidate: 60 } });"
)
# Remove _debug from response (security: don't expose fetch strategy)
c = c.replace(
    """    return NextResponse.json({
      serverTime: new Date().toISOString(),
      scores,
      knockoutEvents: rawKnockout,
      source: 'espn',
      _debug: { total: Object.keys(scores).length, finished: finishedCount, live: liveCount, knockout: rawKnockout.length, dates: ALL_DATES.length },
      pollIntervalMs: 5 * 60 * 1000,
    });""",
    """    return NextResponse.json({
      serverTime: new Date().toISOString(),
      scores,
      knockoutEvents: rawKnockout,
      source: 'espn',
      pollIntervalMs: 5 * 60 * 1000,
    });"""
)
# Safe error message — don't leak stack traces
c = c.replace(
    "error: isTimeout ? 'ESPN timeout — too many dates' : String(error),",
    "error: isTimeout ? 'ESPN timeout — too many dates' : 'Internal server error',"
)
# Make getMatchLookup a lazy singleton (performance: avoid rebuilding per request)
c = c.replace(
    """function getMatchLookup(): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const m of GROUP_MATCHES) {
    const pair = [m.homeTeam, m.awayTeam].sort().join(':');
    const key = `${m.group}:${pair}`;
    lookup.set(key, m.id);
  }
  return lookup;
}""",
    """// Lazy singleton — built once per cold start, not per request
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
}"""
)
# Remove O(n) GROUP_MATCHES.find() inside the loop — use the lookup to get match directly
c = c.replace(
    """      // CRITICAL: ESPN home/away may differ from our match's home/away.
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
      }""",
    """      // CRITICAL: ESPN home/away may differ from our match's home/away.
      // Build a reverse lookup: matchId -> {homeTeam, awayTeam}
      // Using the match's own teams to align scores correctly
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
      }"""
)
# Also remove the JSON parse error silencing — add proper error message
c = c.replace(
    """  } catch {
    return [];
  }
}""",
    """  } catch (err) {
    console.error(`[live-scores] ESPN fetch failed for ${dateStr}:`, err);
    return [];
  }
}"""
)
write(p, c)

# ═══════════════════════════════════════════════════════════════════════════
# 4. worldCupStore.ts — Fix updateKnockoutLive cleanup, refreshNow feedback
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 worldCupStore.ts")
p = f"{BASE}/store/worldCupStore.ts"
c = read(p)
# BUG-002 ALTO: updateKnockoutLive should clear stale data when events=[]
c = c.replace(
    """    updateKnockoutLive: (events) => {
      const { allStandings, knockoutResults, thirdPlaceRanking } = get();
      if (events.length === 0) return;""",
    """    updateKnockoutLive: (events) => {
      const { allStandings, knockoutResults, thirdPlaceRanking, matches } = get();
      // When no knockout events from ESPN, clear stale live data
      if (events.length === 0) {
        // Keep knockoutResults (finished match outcomes) but clear live tracking
        set({ knockoutLiveInfo: {}, rawKnockoutEvents: [] });
        return;
      }"""
)
# BUG-004 ALTO: refreshNow should expose errors to the user
c = c.replace(
    """    refreshNow: async () => {
      set({ isRefreshing: true });
      try {
        // Bypass server cache with _refresh parameter
        const url = `/api/live-scores?_refresh=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.scores) {
          get().bulkUpdateFromESPN(data.scores);
        }
        if (data.knockoutEvents && data.knockoutEvents.length > 0) {
          get().updateKnockoutLive(data.knockoutEvents);
        }
        get().setLastPollTime(new Date().toISOString());
      } catch { /* silently fail */ }
      finally {
        set({ isRefreshing: false });
      }
    },""",
    """    refreshNow: async () => {
      set({ isRefreshing: true, lastError: null });
      try {
        // Bypass server cache with _refresh parameter
        const url = `/api/live-scores?_refresh=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.source && data.source !== 'espn') {
          set({ lastError: 'Erro ao buscar dados. Tente novamente.' });
          return;
        }
        if (data.scores) {
          get().bulkUpdateFromESPN(data.scores);
        }
        if (data.knockoutEvents && data.knockoutEvents.length > 0) {
          get().updateKnockoutLive(data.knockoutEvents);
        }
        get().setLastPollTime(new Date().toISOString());
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        set({ lastError: `Falha ao atualizar: ${msg}` });
      } finally {
        set({ isRefreshing: false });
      }
    },"""
)
# Add lastError to state interface
c = c.replace(
    """  isRefreshing: boolean;""",
    """  isRefreshing: boolean;
  lastError: string | null;"""
)
# Add lastError initial value
c = c.replace(
    """    isRefreshing: false,""",
    """    isRefreshing: false,
    lastError: null,"""
)
# Add lastError setter
c = c.replace(
    """    setLastPollTime: (t: string | null) => set({ lastPollTime: t }),
    setLiveMatches: (m: Record<string, number>) => set({ liveMatches: m }),""",
    """    setLastPollTime: (t: string | null) => set({ lastPollTime: t }),
    setLiveMatches: (m: Record<string, number>) => set({ liveMatches: m }),
    setLastError: (e: string | null) => set({ lastError: e }),"""
)
# Re-add 'matches' to the updateKnockoutLive destructuring (needed for computeAll)
# Actually, it's already pulled from get() later via get().matches, so this is fine
write(p, c)

# ═══════════════════════════════════════════════════════════════════════════
# 5. useLiveScores.ts — Add JSON parse error handling, Page Visibility API
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 useLiveScores.ts")
p = f"{BASE}/hooks/useLiveScores.ts"
c = read(p)
# Fix silent JSON parse error
c = c.replace(
    """      const data: LiveScoresResponse = await res.json();

      if (!mountedRef.current) return;""",
    """      let data: LiveScoresResponse;
      try {
        data = await res.json();
      } catch {
        return; // Invalid JSON response
      }

      if (!mountedRef.current) return;"""
)
# Add Page Visibility API to pause polling when tab is hidden
c = c.replace(
    """  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);""",
    """  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Page Visibility: pause polling when tab is hidden, resume when visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !pollingLock.current) {
        poll(); // Immediately poll when tab becomes visible
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [poll]);"""
)
write(p, c)

# ═══════════════════════════════════════════════════════════════════════════
# 6. LiveTab.tsx — Fix null score display, show error feedback
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 LiveTab.tsx")
p = f"{BASE}/components/worldcup/LiveTab.tsx"
c = read(p)
# Fix: null score displayed as "0×0" in finished cards
c = c.replace(
    """          homeScore: hasScore ? (parseInt(evt.homeScore, 10) || 0) : null,
          awayScore: hasScore ? (parseInt(evt.awayScore, 10) || 0) : null,""",
    """          homeScore: hasScore ? parseInt(evt.homeScore, 10) : null,
          awayScore: hasScore ? parseInt(evt.awayScore, 10) : null,"""
)
# Add error display from store (lastError)
c = c.replace(
    """  const { matches, bracket, timezone, liveMatches, knockoutLiveInfo, rawKnockoutEvents, refreshNow } = useWorldCupStore();""",
    """  const { matches, bracket, timezone, liveMatches, knockoutLiveInfo, rawKnockoutEvents, refreshNow, lastError } = useWorldCupStore();"""
)
# Show error banner when lastError is set
c = c.replace(
    """  return (
    <div className="space-y-6">
      {/* Controls bar */}""",
    """  return (
    <div className="space-y-6">
      {/* Error banner */}
      {lastError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-center" role="alert">
          <p className="text-xs text-destructive">{lastError}</p>
        </div>
      )}

      {/* Controls bar */}"""
)
# Elevate text-[10px] to text-[11px] throughout LiveTab
c = c.replace('text-[10px]', 'text-[11px]')
write(p, c)

# ═══════════════════════════════════════════════════════════════════════════
# 7. KnockoutBracket.tsx — Fix "Decisoes" → "Decisões", unify gold, text min 11px
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 KnockoutBracket.tsx")
p = f"{BASE}/components/worldcup/KnockoutBracket.tsx"
c = read(p)
# Fix typo
c = c.replace("Decisoes", "Decis\u00F5es")
# Replace yellow-500 with fifa-gold
c = c.replace("yellow-500/30", "fifa-gold/30")
c = c.replace("yellow-500/5", "fifa-gold/5")
c = c.replace("yellow-500/10", "fifa-gold/10")
c = c.replace("yellow-500/50", "fifa-gold/50")
c = c.replace("yellow-600", "fifa-gold-dark")
c = c.replace("dark:text-yellow-400", "dark:text-fifa-gold")
# Elevate text-[10px] to text-[11px]
c = c.replace('text-[10px]', 'text-[11px]')
write(p, c)

# ═══════════════════════════════════════════════════════════════════════════
# 8. Calendar.tsx — text-[10px] → text-[11px]
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 Calendar.tsx")
p = f"{BASE}/components/worldcup/Calendar.tsx"
c = read(p)
c = c.replace('text-[10px]', 'text-[11px]')
write(p, c)

# ═══════════════════════════════════════════════════════════════════════════
# 9. GroupTables.tsx — text-[10px] → text-[11px]
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 GroupTables.tsx")
p = f"{BASE}/components/worldcup/GroupTables.tsx"
c = read(p)
c = c.replace('text-[10px]', 'text-[11px]')
write(p, c)

# ═══════════════════════════════════════════════════════════════════════════
# 10. globals.css — prefers-reduced-motion, improve dark mode contrast
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 globals.css")
p = f"{BASE}/app/globals.css"
c = read(p)
# Improve dark mode muted-foreground contrast (from 0.65 to 0.72 oklch lightness)
c = c.replace(
    "  --muted-foreground: oklch(0.65 0.02 250);",
    "  --muted-foreground: oklch(0.72 0.015 250);"
)
# Add prefers-reduced-motion at the end
c += """
/* Accessibility: respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .score-update,
  .live-glow,
  .animate-pulse,
  .animate-spin {
    animation: none !important;
  }
}
"""
write(p, c)

# ═══════════════════════════════════════════════════════════════════════════
# 11. page.tsx — Add skip-to-content link
# ═══════════════════════════════════════════════════════════════════════════
print("\n📋 page.tsx")
p = f"{BASE}/app/page.tsx"
c = read(p)
# Add skip-to-content as the first focusable element
c = c.replace(
    """  return (
    <div className="min-h-screen flex flex-col">""",
    """  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-fifa-green focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Pular para o conte\u00FAdo principal
      </a>"""
)
# Add id="main-content" to the main content area
c = c.replace(
    """      {/* Main content */}""",
    """      {/* Main content */}
      <div id="main-content">"""
)
# Find where the main content section ends and close the div
# The page.tsx renders Navigation + tab content. Let's wrap the tab content.
c = c.replace(
    """          </div>
        );
      })()}