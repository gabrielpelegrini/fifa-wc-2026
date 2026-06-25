'use client';

import { useMemo } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';
import { TEAMS, GROUPS } from '@/data/worldcup';
import { getTeamName } from '@/lib/standings';
import { formatTime, formatDate } from '@/lib/dateUtils';
import FlagIcon from './FlagIcon';
import { cn } from '@/lib/utils';
import { Clock, Filter } from 'lucide-react';

export default function Calendar() {
  const {
    matches,
    timezone,
    filterGroup,
    filterTeam,
    filterRound,
    setFilterGroup,
    setFilterTeam,
    setFilterRound,
    liveMatches,
  } = useWorldCupStore();

  const filteredMatches = useMemo(() => {
    let result = matches;

    if (filterGroup) {
      result = result.filter(m => m.group === filterGroup);
    }
    if (filterTeam) {
      result = result.filter(m => m.homeTeam === filterTeam || m.awayTeam === filterTeam);
    }
    if (filterRound) {
      result = result.filter(m => m.round === parseInt(filterRound));
    }

    return result;
  }, [matches, filterGroup, filterTeam, filterRound]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, typeof filteredMatches>();
    for (const m of filteredMatches) {
      const arr = map.get(m.date) || [];
      arr.push(m);
      map.set(m.date, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredMatches]);

  const allTeams = useMemo(() => {
    return Object.entries(TEAMS)
      .filter(([, t]) => !t.isPlaceholder)
      .map(([id, t]) => ({ id, name: t.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-lg bg-card border">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className="bg-background border rounded-md px-2 py-1.5 text-sm"
        >
          <option value="">Todos os grupos</option>
          {GROUPS.map(g => (
            <option key={g.id} value={g.id}>Grupo {g.id}</option>
          ))}
        </select>
        <select
          value={filterTeam}
          onChange={e => setFilterTeam(e.target.value)}
          className="bg-background border rounded-md px-2 py-1.5 text-sm max-w-[180px]"
        >
          <option value="">Todas as seleções</option>
          {allTeams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={filterRound}
          onChange={e => setFilterRound(e.target.value)}
          className="bg-background border rounded-md px-2 py-1.5 text-sm"
        >
          <option value="">Todas as rodadas</option>
          <option value="1">1ª Rodada</option>
          <option value="2">2ª Rodada</option>
          <option value="3">3ª Rodada</option>
        </select>
        {(filterGroup || filterTeam || filterRound) && (
          <button
            onClick={() => { setFilterGroup(''); setFilterTeam(''); setFilterRound(''); }}
            className="text-xs text-destructive hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Match list */}
      <div className="space-y-4">
        {groupedByDate.map(([date, dayMatches]) => (
          <div key={date}>
            <div className="sticky top-[120px] z-10 bg-background/95 backdrop-blur py-1.5 px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {formatDate(date, timezone)}
              </span>
            </div>
            <div className="space-y-1">
              {dayMatches.map(m => (
                <MatchRow
                  key={m.id}
                  group={m.group || ''}
                  homeTeam={m.homeTeam}
                  awayTeam={m.awayTeam}
                  homeScore={m.homeScore ?? null}
                  awayScore={m.awayScore ?? null}
                  status={m.status}
                  liveMinute={liveMatches[m.id]}
                  time={m.time}
                  venue={m.venue}
                  city={m.city}
                  country={m.country}
                  timezone={timezone}
                />
              ))}
            </div>
          </div>
        ))}
        {filteredMatches.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum jogo encontrado.</p>
        )}
      </div>
    </div>
  );
}

function MatchRow({
  group, homeTeam, awayTeam,
  homeScore, awayScore, status, liveMinute, time, venue, city, country,
  timezone,
}: {
  group: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status?: 'upcoming' | 'live' | 'finished';
  liveMinute?: number;
  time: string;
  venue: string;
  city: string;
  country: string;
  timezone: string;
}) {
  const isLive = status === 'live';
  const isFinished = status === 'finished' || (homeScore !== null && awayScore !== null && !isLive);

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-colors',
        isLive
          ? 'bg-red-950/30 border-red-500/50'
          : isFinished
            ? 'bg-card border-border/50'
            : 'bg-card border-border'
      )}
    >
      {/* Group badge */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-xs font-bold text-primary">{group}</span>
      </div>

      {/* Teams and score */}
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2">
        {/* Home */}
        <div className="flex items-center gap-1.5 min-w-0">
          <FlagIcon teamId={homeTeam} size={20} />
          <span className="text-xs sm:text-sm font-medium truncate">{getTeamName(homeTeam)}</span>
        </div>

        {/* Score / Time / Live */}
        <div className="flex flex-col items-center shrink-0">
          {isLive ? (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {liveMinute}&apos;min
              </span>
              <span className="text-sm sm:text-base font-bold text-red-300">
                {homeScore} × {awayScore}
              </span>
            </div>
          ) : isFinished ? (
            <span className="text-sm sm:text-base font-bold">
              {homeScore} × {awayScore}
            </span>
          ) : (
            <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(time, timezone)}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="text-xs sm:text-sm font-medium truncate">{getTeamName(awayTeam)}</span>
          <FlagIcon teamId={awayTeam} size={20} />
        </div>
      </div>

      {/* Venue */}
      <div className="hidden md:flex flex-col items-end shrink-0 text-[10px] text-muted-foreground max-w-[140px]">
        <span className="truncate">{venue}</span>
        <span className="truncate">{city}, {country}</span>
      </div>
    </div>
  );
}