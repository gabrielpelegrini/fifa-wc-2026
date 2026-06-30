'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';
import { useLiveScores } from '@/hooks/useLiveScores';
import { getTeamName } from '@/lib/standings';
import { formatTime, getLocalDate } from '@/lib/dateUtils';
import { getSlotLabel } from '@/lib/bracketResolver';
import FlagIcon from './FlagIcon';
import { cn } from '@/lib/utils';
import { Clock, MapPin, Zap, RefreshCw, Loader2, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useShareResult } from './Engagement';
import { ESPN_TO_TEAM } from '@/lib/espnMapping';

// ── Round labels in Portuguese ──────────────────────────────────────
const ROUND_LABELS: Record<string, string> = {
  r32: '32 Avos',
  r16: 'Oitavas',
  qf: 'Quartas',
  sf: 'Semifinal',
  third_place: '3\u00B0 Lugar',
  final: 'Final',
};

// ── Unified match format for LiveTab ───────────────────────────────
interface DisplayMatch {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeLabel: string;
  awayLabel: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  roundLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
}

function formatSlotLabel(slot: string): string {
  if (slot.startsWith('V(')) {
    const matchId = slot.slice(2, -1);
    return `Vencedor ${matchId}`;
  }
  if (slot.startsWith('P(')) {
    const matchId = slot.slice(2, -1);
    return `Perdedor ${matchId}`;
  }
  return getSlotLabel(slot);
}

/** Animated score component — pulses when score changes */
function AnimatedScore({ score }: { score: number }) {
  const [prevScore, setPrevScore] = useState(score);
  const [animating, setAnimating] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (score !== prevScore) {
      setAnimating(true);
      setPrevScore(score);
      const timer = setTimeout(() => setAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [score, prevScore]);

  return (
    <span
      ref={ref}
      className={cn(
        'transition-transform',
        animating && 'score-update'
      )}
    >
      {score}
    </span>
  );
}

export default function LiveTab() {
  const { matches, bracket, timezone, liveMatches, knockoutLiveInfo, rawKnockoutEvents, refreshNow } = useWorldCupStore();
  const { poll, lastPollTime, fastMode, toggleFastMode, isRefreshing } = useLiveScores();
  const [initialLoading, setInitialLoading] = useState(true);
  const share = useShareResult();

  // Show skeleton for 1.5s on first load
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // ── Build unified match list (group + knockout) ────────────────
  const allDisplayMatches = useMemo((): DisplayMatch[] => {
    const list: DisplayMatch[] = [];

    // 1) Group stage matches
    for (const m of matches) {
      list.push({
        id: m.id,
        homeTeamId: m.homeTeam,
        awayTeamId: m.awayTeam,
        homeLabel: getTeamName(m.homeTeam),
        awayLabel: getTeamName(m.awayTeam),
        date: m.date,
        time: m.time,
        venue: m.venue,
        city: m.city,
        roundLabel: `Grupo ${m.group || ''}`,
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
        status: m.status || 'upcoming',
      });
    }

    // 2) Knockout bracket matches
    if (bracket) {
      const allKnockout = [
        ...bracket.r32,
        ...bracket.r16,
        ...bracket.qf,
        ...bracket.sf,
        bracket.thirdPlace,
        bracket.final,
      ] as const;

      // Track which raw events were matched to bracket entries
      const matchedAbbrPairs = new Set<string>();

      for (const m of allKnockout) {
        const koInfo = knockoutLiveInfo[m.id];
        const hasResult = m.homeScore !== null && m.awayScore !== null;
        list.push({
          id: m.id,
          homeTeamId: m.homeTeam,
          awayTeamId: m.awayTeam,
          homeLabel: m.homeTeam ? getTeamName(m.homeTeam) : formatSlotLabel(m.homeSlot),
          awayLabel: m.awayTeam ? getTeamName(m.awayTeam) : formatSlotLabel(m.awaySlot),
          date: m.date,
          time: m.time,
          venue: m.venue,
          city: m.city,
          roundLabel: ROUND_LABELS[m.round] || m.round,
          homeScore: koInfo?.homeScore ?? m.homeScore,
          awayScore: koInfo?.awayScore ?? m.awayScore,
          status: koInfo?.status ?? (hasResult ? 'finished' : 'upcoming'),
        });

        // Track matched pairs to avoid duplicates from raw fallback
        if (m.homeTeam && m.awayTeam) {
          matchedAbbrPairs.add([m.homeTeam, m.awayTeam].sort().join(':'));
        }
      }

      // 3) Fallback: show raw ESPN knockout events that weren't matched to bracket
      // This ensures live/upcoming knockout matches always appear even if bracket resolution fails
      for (const evt of rawKnockoutEvents) {
        const homeId = ESPN_TO_TEAM[evt.homeAbbr];
        const awayId = ESPN_TO_TEAM[evt.awayAbbr];
        const pairKey = (homeId && awayId) ? [homeId, awayId].sort().join(':') : null;
        if (pairKey && matchedAbbrPairs.has(pairKey)) continue; // Already shown via bracket

        const status = evt.statusName === 'STATUS_FULL_TIME' ? 'finished'
          : (evt.statusName === 'STATUS_IN_PROGRESS' || evt.statusName === 'STATUS_HALFTIME' ||
             evt.statusName === 'STATUS_1ST_PERIOD' || evt.statusName === 'STATUS_2ND_PERIOD')
            ? 'live' as const
          : 'upcoming' as const;
        const hasScore = status === 'live' || status === 'finished';
        const minute = status === 'live' && evt.clock ? Math.floor(evt.clock / 60) : undefined;

        list.push({
          id: `espn-${evt.homeAbbr}-${evt.awayAbbr}`,
          homeTeamId: homeId ?? null,
          awayTeamId: awayId ?? null,
          homeLabel: evt.homeName,
          awayLabel: evt.awayName,
          date: evt.date || '',
          time: evt.time || '',
          venue: evt.venue || '',
          city: evt.city || '',
          roundLabel: 'Mata-mata',
          homeScore: hasScore ? (parseInt(evt.homeScore, 10) || 0) : null,
          awayScore: hasScore ? (parseInt(evt.awayScore, 10) || 0) : null,
          status,
        });

        // Also add to liveMatches for the badge if live
        if (status === 'live' && minute != null) {
          useWorldCupStore.getState().setLiveMatches({
            ...useWorldCupStore.getState().liveMatches,
            [`espn-${evt.homeAbbr}-${evt.awayAbbr}`]: minute,
          });
        }
      }
    }

    return list;
  }, [matches, bracket, knockoutLiveInfo, rawKnockoutEvents]);

  // ── Classify into live / upcoming / finished ────────────────────
  const { liveList, nextUpList, recentList } = useMemo(() => {
    const live: DisplayMatch[] = [];
    const upcoming: DisplayMatch[] = [];
    const finished: DisplayMatch[] = [];

    for (const m of allDisplayMatches) {
      if (m.status === 'finished') {
        finished.push(m);
      } else if (m.status === 'live') {
        live.push(m);
      } else {
        upcoming.push(m);
      }
    }

    // Most recent 8 finished matches (sort by date DESC)
    const recent = [...finished]
      .sort((a, b) => {
        const da = `${b.date}T${b.time}`;
        const db = `${a.date}T${a.time}`;
        return da.localeCompare(db);
      })
      .slice(0, 8);

    // Show today's upcoming matches (user timezone) + matches with no date (ESPN fallback)
    const todayLocal = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    // Also compute yesterday and tomorrow for broader matching
    const tomorrowDate = new Date(Date.now() + 86400000);
    const tomorrowLocal = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(tomorrowDate);

    const upcomingSorted = upcoming
      .filter(m => {
        // Show if no date (ESPN raw fallback) — these are recent knockout matches
        if (!m.date) return true;
        const localDate = getLocalDate(m.date, m.time, timezone);
        return localDate === todayLocal || localDate === tomorrowLocal;
      })
      .sort((a, b) => {
        const da = `${a.date}T${a.time}`;
        const db = `${b.date}T${b.time}`;
        return da.localeCompare(db);
      });

    return { liveList: live, nextUpList: upcomingSorted, recentList: recent };
  }, [allDisplayMatches, timezone]);

  const hasLive = liveList.length > 0;

  // Format last poll time for display
  const lastPollDisplay = useMemo(() => {
    if (!lastPollTime) return null;
    const d = new Date(lastPollTime);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [lastPollTime]);

  // Today's date label
  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('pt-BR', {
      timeZone: timezone,
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }, [timezone]);

  // ── Skeleton loading state ──────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-10" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-12" />
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={refreshNow}
            disabled={isRefreshing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              isRefreshing
                ? 'opacity-50 cursor-wait border-border'
                : 'hover:bg-fifa-green/10 border-fifa-green/20 text-fifa-green'
            )}
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Atualizar
          </button>

          <button
            onClick={toggleFastMode}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              fastMode
                ? 'bg-fifa-gold/15 border-fifa-gold/50 text-fifa-gold-dark dark:text-fifa-gold'
                : 'hover:bg-fifa-gold/5 border-border'
            )}
          >
            <Zap className={cn('h-3.5 w-3.5', fastMode && 'text-fifa-gold')} />
            {fastMode ? 'Modo R\u00E1pido ON' : 'Modo R\u00E1pido'}
          </button>
        </div>

        {lastPollDisplay && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {`Última atualização: ${lastPollDisplay}`}
            {fastMode && <span className="text-fifa-gold ml-1">{'\u00B7 30s'}</span>}
          </span>
        )}
      </div>

      {/* LIVE matches */}
      {hasLive && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-400">Ao Vivo</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {liveList.map(m => (
              <LiveMatchCard
                key={m.id}
                homeTeamId={m.homeTeamId}
                awayTeamId={m.awayTeamId}
                homeLabel={m.homeLabel}
                awayLabel={m.awayLabel}
                homeScore={m.homeScore ?? 0}
                awayScore={m.awayScore ?? 0}
                minute={liveMatches[m.id] ?? 0}
                venue={m.venue}
                city={m.city}
                roundLabel={m.roundLabel}
                timezone={timezone}
              />
            ))}
          </div>
          {Object.keys(liveMatches).length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Dados reais via ESPN
            </p>
          )}
        </section>
      )}

      {/* NEXT UP — today only */}
      {nextUpList.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Próximos Jogos</h2>
            <span className="text-[10px] text-muted-foreground capitalize">({todayLabel})</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {nextUpList.map(m => (
              <UpcomingMatchCard
                key={m.id}
                homeTeamId={m.homeTeamId}
                awayTeamId={m.awayTeamId}
                homeLabel={m.homeLabel}
                awayLabel={m.awayLabel}
                time={m.time}
                venue={m.venue}
                city={m.city}
                roundLabel={m.roundLabel}
                timezone={timezone}
              />
            ))}
          </div>
        </section>
      )}

      {!hasLive && nextUpList.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">⚽</div>
          <p className="text-lg font-semibold">Nenhum jogo hoje</p>
          <p className="text-sm text-muted-foreground mt-1">
            {recentList.length > 0
              ? 'Não há jogos agendados para hoje. Confira os resultados abaixo.'
              : 'Carregando dados dos jogos...'}
          </p>
        </div>
      )}

      {/* RECENT results */}
      {recentList.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Resultados Recentes</h2>
            {recentList.length > 0 && (
              <button
                onClick={() => {
                  const text = recentList
                    .slice(0, 4)
                    .map(m => `${m.homeLabel} ${m.homeScore}×${m.awayScore} ${m.awayLabel}`)
                    .join('\n');
                  share(`Copa do Mundo 2026 - Resultados:\n${text}\n\nDados: FIFA WC 2026 App`);
                }}
                className="flex items-center gap-1 text-[10px] text-fifa-green hover:text-fifa-gold transition-colors"
              >
                <Share2 className="h-3 w-3" />
                Compartilhar
              </button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentList.map(m => (
              <FinishedMatchCard
                key={m.id}
                homeTeamId={m.homeTeamId}
                awayTeamId={m.awayTeamId}
                homeLabel={m.homeLabel}
                awayLabel={m.awayLabel}
                homeScore={m.homeScore ?? 0}
                awayScore={m.awayScore ?? 0}
                venue={m.venue}
                city={m.city}
                roundLabel={m.roundLabel}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Card Components ────────────────────────────────────────────────

function LiveMatchCard({
  homeTeamId, awayTeamId, homeLabel, awayLabel,
  homeScore, awayScore, minute,
  venue, city, roundLabel, timezone,
}: {
  homeTeamId: string | null; awayTeamId: string | null;
  homeLabel: string; awayLabel: string;
  homeScore: number; awayScore: number; minute: number;
  venue: string; city: string; roundLabel: string; timezone: string;
}) {
  const minuteDisplay = minute > 0 ? `${minute}'` : 'AO VIVO';
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3 sm:p-4 live-glow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
          {roundLabel}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {minuteDisplay}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {homeTeamId && <FlagIcon teamId={homeTeamId} size={28} />}
          <span className="text-sm font-medium truncate">{homeLabel}</span>
        </div>
        <div className="text-xl font-bold text-red-300 tabular-nums shrink-0">
          <AnimatedScore score={homeScore} /> × <AnimatedScore score={awayScore} />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium truncate">{awayLabel}</span>
          {awayTeamId && <FlagIcon teamId={awayTeamId} size={28} />}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {`${venue} · ${city}`}
      </div>
    </div>
  );
}

function UpcomingMatchCard({
  homeTeamId, awayTeamId, homeLabel, awayLabel,
  time, venue, city, roundLabel, timezone,
}: {
  homeTeamId: string | null; awayTeamId: string | null;
  homeLabel: string; awayLabel: string;
  time: string; venue: string; city: string; roundLabel: string; timezone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 hover:border-fifa-green/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {roundLabel}
        </span>
        <span className="text-xs font-medium text-fifa-green flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(time, timezone)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {homeTeamId && <FlagIcon teamId={homeTeamId} size={28} />}
          <span className={cn('text-sm font-medium truncate', !homeTeamId && 'text-muted-foreground italic')}>{homeLabel}</span>
        </div>
        <span className="text-xs font-bold text-muted-foreground/50 shrink-0">vs</span>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className={cn('text-sm font-medium truncate', !awayTeamId && 'text-muted-foreground italic')}>{awayLabel}</span>
          {awayTeamId && <FlagIcon teamId={awayTeamId} size={28} />}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {`${venue} · ${city}`}
      </div>
    </div>
  );
}

function FinishedMatchCard({
  homeTeamId, awayTeamId, homeLabel, awayLabel,
  homeScore, awayScore, venue, city, roundLabel,
}: {
  homeTeamId: string | null; awayTeamId: string | null;
  homeLabel: string; awayLabel: string;
  homeScore: number; awayScore: number;
  venue: string; city: string; roundLabel: string;
}) {
  const isDraw = homeScore === awayScore;
  const homeWon = homeScore > awayScore;

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-3 sm:p-4 opacity-80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {roundLabel}
        </span>
        <span className="text-[10px] text-muted-foreground">Encerrado</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className={cn('flex items-center gap-2 flex-1 min-w-0', homeWon && 'font-semibold')}>
          {homeTeamId && <FlagIcon teamId={homeTeamId} size={28} />}
          <span className="text-sm truncate">{homeLabel}</span>
        </div>
        <span className="text-lg font-bold text-muted-foreground tabular-nums shrink-0">
          {`${homeScore} × ${awayScore}`}
        </span>
        <div className={cn('flex items-center gap-2 flex-1 min-w-0 justify-end', !homeWon && !isDraw && 'font-semibold')}>
          <span className="text-sm truncate">{awayLabel}</span>
          {awayTeamId && <FlagIcon teamId={awayTeamId} size={28} />}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {`${venue} · ${city}`}
      </div>
    </div>
  );
}