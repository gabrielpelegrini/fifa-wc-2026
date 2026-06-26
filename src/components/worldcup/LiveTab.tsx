'use client';

import { useMemo } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';
import { useLiveScores } from '@/hooks/useLiveScores';
import { getTeamName } from '@/lib/standings';
import { formatTime, formatFullDateTime, getLocalDate } from '@/lib/dateUtils';
import FlagIcon from './FlagIcon';
import { cn } from '@/lib/utils';
import { Clock, MapPin, Zap, RefreshCw, Loader2 } from 'lucide-react';

export default function LiveTab() {
  const { matches, timezone, liveMatches, refreshNow } = useWorldCupStore();
  const { poll, lastPollTime, fastMode, toggleFastMode, isRefreshing } = useLiveScores();

  const { liveList, nextUpList, recentList } = useMemo(() => {
    const live: typeof matches = [];
    const upcoming: typeof matches = [];
    const finished: typeof matches = [];

    // Classify all matches by their STATUS (not by elapsed time)
    for (const m of matches) {
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

    // Next time slot from upcoming matches
    // Only show matches from TODAY (user timezone) or later
    // This avoids showing old matches that ESPN hasn't updated
    const todayLocal = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    // Show ALL upcoming matches from TODAY onwards (user timezone).
    // Finished/live games are already in their own sections.
    // Uses >= so if today's games are all finished, tomorrow's games still show.
    const todayLocal = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    const upcomingSorted = upcoming
      .filter(m => {
        const localDate = getLocalDate(m.date, m.time, timezone);
        return localDate >= todayLocal;
      })
      .sort((a, b) => {
        const da = `${a.date}T${a.time}`;
        const db = `${b.date}T${b.time}`;
        return da.localeCompare(db);
      });

    return { liveList: live, nextUpList: upcomingSorted, recentList: recent };
  }, [matches, timezone]);

  const hasLive = liveList.length > 0;

  // Format last poll time for display
  const lastPollDisplay = useMemo(() => {
    if (!lastPollTime) return null;
    const d = new Date(lastPollTime);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [lastPollTime]);

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
                : 'hover:bg-accent border-border'
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
                ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                : 'hover:bg-accent border-border'
            )}
          >
            <Zap className={cn('h-3.5 w-3.5', fastMode && 'text-orange-400')} />
            {fastMode ? 'Modo Rápido ON' : 'Modo Rápido'}
          </button>
        </div>

        {lastPollDisplay && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            Última atualização: {lastPollDisplay}
            {fastMode && <span className="text-orange-400 ml-1">· 30s</span>}
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
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                homeScore={m.homeScore ?? 0}
                awayScore={m.awayScore ?? 0}
                minute={liveMatches[m.id] ?? 0}
                venue={m.venue}
                city={m.city}
                group={m.group || ''}
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

      {/* NEXT UP — show ALL today's upcoming games */}
      {nextUpList.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Próximos Jogos</h2>
            <span className="text-[10px] text-muted-foreground">({nextUpList.length})</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {nextUpList.map(m => (
              <UpcomingMatchCard
                key={m.id}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                time={m.time}
                venue={m.venue}
                city={m.city}
                group={m.group || ''}
                timezone={timezone}
              />
            ))}
          </div>
        </section>
      )}

      {!hasLive && nextUpList.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">⚽</p>
          <p className="text-lg font-semibold">Nenhum jogo próximo</p>
          <p className="text-sm text-muted-foreground mt-1">
            {recentList.length > 0
              ? 'Todos os próximos jogos ainda não começaram. Confira os resultados abaixo.'
              : 'Carregando dados dos jogos...'}
          </p>
        </div>
      )}

      {/* RECENT results */}
      {recentList.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Resultados Recentes</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentList.map(m => (
              <FinishedMatchCard
                key={m.id}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                homeScore={m.homeScore ?? 0}
                awayScore={m.awayScore ?? 0}
                venue={m.venue}
                city={m.city}
                group={m.group || ''}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LiveMatchCard({
  homeTeam, awayTeam, homeScore, awayScore, minute,
  venue, city, group, timezone,
}: {
  homeTeam: string; awayTeam: string;
  homeScore: number; awayScore: number; minute: number;
  venue: string; city: string; group: string; timezone: string;
}) {
  const minuteDisplay = minute > 0 ? `${minute}'` : 'AO VIVO';
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
          Grupo {group}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {minuteDisplay}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FlagIcon teamId={homeTeam} size={28} />
          <span className="text-sm font-medium truncate">{getTeamName(homeTeam)}</span>
        </div>
        <div className="text-xl font-bold text-red-300 tabular-nums shrink-0">
          {homeScore} × {awayScore}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium truncate">{getTeamName(awayTeam)}</span>
          <FlagIcon teamId={awayTeam} size={28} />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {venue} · {city}
      </div>
    </div>
  );
}

function UpcomingMatchCard({
  homeTeam, awayTeam, time, venue, city, group, timezone,
}: {
  homeTeam: string; awayTeam: string;
  time: string; venue: string; city: string; group: string; timezone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Grupo {group}
        </span>
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(time, timezone)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FlagIcon teamId={homeTeam} size={28} />
          <span className="text-sm font-medium truncate">{getTeamName(homeTeam)}</span>
        </div>
        <span className="text-xs font-bold text-muted-foreground shrink-0">vs</span>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium truncate">{getTeamName(awayTeam)}</span>
          <FlagIcon teamId={awayTeam} size={28} />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {venue} · {city}
      </div>
    </div>
  );
}

function FinishedMatchCard({
  homeTeam, awayTeam, homeScore, awayScore, venue, city, group,
}: {
  homeTeam: string; awayTeam: string;
  homeScore: number; awayScore: number;
  venue: string; city: string; group: string;
}) {
  const isDraw = homeScore === awayScore;
  const homeWon = homeScore > awayScore;

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-3 sm:p-4 opacity-80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Grupo {group}
        </span>
        <span className="text-[10px] text-muted-foreground">Encerrado</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className={cn('flex items-center gap-2 flex-1 min-w-0', homeWon && 'font-semibold')}>
          <FlagIcon teamId={homeTeam} size={28} />
          <span className="text-sm truncate">{getTeamName(homeTeam)}</span>
        </div>
        <span className="text-lg font-bold text-muted-foreground tabular-nums shrink-0">
          {homeScore} × {awayScore}
        </span>
        <div className={cn('flex items-center gap-2 flex-1 min-w-0 justify-end', !homeWon && !isDraw && 'font-semibold')}>
          <span className="text-sm truncate">{getTeamName(awayTeam)}</span>
          <FlagIcon teamId={awayTeam} size={28} />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {venue} · {city}
      </div>
    </div>
  );
}