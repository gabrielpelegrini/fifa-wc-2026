'use client';

import { useMemo } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';
import { TEAMS } from '@/data/worldcup';
import { getTeamName } from '@/lib/standings';
import { formatTime, formatFullDateTime } from '@/lib/dateUtils';
import FlagIcon from './FlagIcon';
import { cn } from '@/lib/utils';
import { Clock, MapPin } from 'lucide-react';

export default function LiveTab() {
  const { matches, timezone, liveMatches } = useWorldCupStore();

  const { liveList, nextUpList, recentList } = useMemo(() => {
    const now = new Date();
    const live: typeof matches = [];
    const nextUp: typeof matches = [];
    const recent: typeof matches = [];

    // Sort all upcoming/finished matches by date+time
    const sorted = [...matches].sort((a, b) => {
      const da = `${a.date}T${a.time}`;
      const db = `${b.date}T${b.time}`;
      return da.localeCompare(db);
    });

    for (const m of sorted) {
      const kickoff = new Date(`${m.date}T${m.time}:00Z`);
      const elapsedMin = (now.getTime() - kickoff.getTime()) / (1000 * 60);

      if (m.status === 'live' || (elapsedMin >= 0 && elapsedMin < 105 && m.status !== 'finished')) {
        live.push(m);
      } else if (m.status === 'finished') {
        // Show last 8 finished
        if (recent.length < 8) recent.push(m);
      } else if (elapsedMin < 0) {
        // Upcoming — find the next time slot
        if (nextUp.length === 0 || nextUp[0].time === m.time && nextUp[0].date === m.date) {
          nextUp.push(m);
        } else if (nextUp[0].date !== m.date || nextUp[0].time !== m.time) {
          // Already have the next slot, stop
          break;
        }
      }
    }

    return { liveList: live, nextUpList: nextUp, recentList: recent };
  }, [matches]);

  const hasLive = liveList.length > 0;

  return (
    <div className="space-y-6">
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
        </section>
      )}

      {/* NEXT UP — if no live matches */}
      {!hasLive && nextUpList.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Próximos Jogos</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {formatFullDateTime(nextUpList[0].date, nextUpList[0].time, timezone)}
          </p>
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
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-lg font-semibold">Fase de grupos encerrada</p>
          <p className="text-sm text-muted-foreground mt-1">Todos os jogos desta fase foram concluídos.</p>
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
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
          Grupo {group}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {minute}&apos; min
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