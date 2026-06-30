'use client';

import { useMemo, useState, useCallback } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';
import { TEAMS, GROUPS } from '@/data/worldcup';
import { getTeamName } from '@/lib/standings';
import { formatTime, formatDate, getLocalDate } from '@/lib/dateUtils';
import FlagIcon from './FlagIcon';
import { cn } from '@/lib/utils';
import { Clock, Filter, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

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

  // Compute the user-local date for each match (converts UTC date+time → user timezone)
  const matchLocalDates = useMemo(() => {
    const map = new Map<string, string>(); // matchId → localDate
    for (const m of matches) {
      map.set(m.id, getLocalDate(m.date, m.time, timezone));
    }
    return map;
  }, [matches, timezone]);

  // All unique LOCAL dates from matches, sorted
  const allDates = useMemo(() => {
    const dates = new Set(matchLocalDates.values());
    return Array.from(dates).sort();
  }, [matchLocalDates]);

  // Find default index: today or next date with matches
  const defaultIndex = useMemo(() => {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now);
    const idx = allDates.findIndex(d => d >= todayStr);
    return idx >= 0 ? idx : allDates.length - 1;
  }, [allDates, timezone]);

  const [dateIndex, setDateIndex] = useState(defaultIndex);

  const selectedDate = allDates[dateIndex] ?? '';
  const canGoPrev = dateIndex > 0;
  const canGoNext = dateIndex < allDates.length - 1;

  const goPrev = useCallback(() => setDateIndex(i => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setDateIndex(i => Math.min(allDates.length - 1, i + 1)), [allDates.length]);
  const goToday = useCallback(() => setDateIndex(defaultIndex), [defaultIndex]);

  // Apply filters then slice to selected LOCAL date
  const dayMatches = useMemo(() => {
    let result = matches.filter(m => matchLocalDates.get(m.id) === selectedDate);

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
  }, [matches, selectedDate, filterGroup, filterTeam, filterRound, matchLocalDates]);

  // Group matches by time slot within the day
  const groupedByTime = useMemo(() => {
    const map = new Map<string, typeof dayMatches>();
    for (const m of dayMatches) {
      const arr = map.get(m.time) || [];
      arr.push(m);
      map.set(m.time, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [dayMatches]);

  const allTeams = useMemo(() => {
    return Object.entries(TEAMS)
      .filter(([, t]) => !t.isPlaceholder)
      .map(([id, t]) => ({ id, name: t.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const dayNumber = dateIndex + 1;
  const totalDays = allDates.length;
  const isToday = allDates[defaultIndex] === selectedDate;

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
        <button
          onClick={goPrev}
          disabled={!canGoPrev}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
            hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <button
          onClick={goToday}
          className={cn(
            'flex flex-col items-center px-4 py-1.5 rounded-lg transition-colors',
            isToday
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-accent'
          )}
        >
          <span className="text-base sm:text-lg font-bold leading-tight">
            {formatDate(selectedDate, timezone)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Dia {dayNumber} de {totalDays}
          </span>
        </button>

        <button
          onClick={goNext}
          disabled={!canGoNext}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
            hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <span className="hidden sm:inline">Próximo</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Quick date dots */}
      <div className="flex justify-center gap-1 flex-wrap">
        {allDates.map((d, i) => {
          const hasFinished = matches.some(m => matchLocalDates.get(m.id) === d && m.status === 'finished');
          const hasLive = matches.some(m => matchLocalDates.get(m.id) === d && m.status === 'live');
          const isCurrent = i === dateIndex;
          const isTodayDate = i === defaultIndex;

          return (
            <button
              key={d}
              onClick={() => setDateIndex(i)}
              title={formatDate(d, timezone)}
              className={cn(
                'w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all',
                isCurrent
                  ? 'bg-primary text-primary-foreground scale-125 ring-2 ring-primary/30'
                  : isTodayDate
                    ? 'bg-primary/20 text-primary hover:bg-primary/30'
                    : hasLive
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : hasFinished
                        ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                        : 'bg-muted/50 text-muted-foreground/60 hover:bg-muted/80'
              )}
            >
              {d.slice(8)} {/* just the day number */}
            </button>
          );
        })}
        <CalendarDays className="h-4 w-4 text-muted-foreground ml-1 self-center" />
      </div>

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

      {/* Match list for selected date */}
      <div className="space-y-3">
        {groupedByTime.map(([time, timeMatches]) => (
          <div key={`${selectedDate}-${time}`}>
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {formatTime(time, timezone)}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {timeMatches.length} {timeMatches.length === 1 ? 'jogo' : 'jogos'}
              </span>
            </div>
            <div className="space-y-1">
              {timeMatches.map(m => (
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
        {dayMatches.length === 0 && (
          <div className="text-center py-12">
            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground">Nenhum jogo neste dia com os filtros selecionados.</p>
          </div>
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