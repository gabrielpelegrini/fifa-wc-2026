'use client';

import { useMemo } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';
import { TEAMS, GROUPS } from '@/data/worldcup';
import { getTeamName } from '@/lib/standings';
import FlagIcon from './FlagIcon';
import { cn } from '@/lib/utils';
import { Clock, Filter } from 'lucide-react';

function formatTime(utcTime: string, timezone: string): string {
  try {
    const [h, m] = utcTime.split(':').map(Number);
    const date = new Date(Date.UTC(2026, 0, 1, h, m));
    return date.toLocaleTimeString('pt-BR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return utcTime;
  }
}

function formatDate(isoDate: string, timezone: string): string {
  try {
    const date = new Date(isoDate + 'T12:00:00Z');
    return date.toLocaleDateString('pt-BR', {
      timeZone: timezone,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return isoDate;
  }
}

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
    setEditingMatch,
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
                  matchId={m.id}
                  group={m.group || ''}
                  round={m.round}
                  homeTeam={m.homeTeam}
                  awayTeam={m.awayTeam}
                  homeScore={m.homeScore}
                  awayScore={m.awayScore}
                  time={m.time}
                  venue={m.venue}
                  city={m.city}
                  country={m.country}
                  timezone={timezone}
                  onClick={() => setEditingMatch(m.id)}
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
  matchId, group, round, homeTeam, awayTeam,
  homeScore, awayScore, time, venue, city, country,
  timezone, onClick
}: {
  matchId: string;
  group: string;
  round: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  time: string;
  venue: string;
  city: string;
  country: string;
  timezone: string;
  onClick: () => void;
}) {
  const isFinished = homeScore !== null && awayScore !== null;
  const isPlaceholderMatch = TEAMS[homeTeam]?.isPlaceholder || TEAMS[awayTeam]?.isPlaceholder;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border text-left transition-colors',
        isFinished
          ? 'bg-card hover:bg-accent/50 border-border/50'
          : 'bg-card hover:bg-accent border-border',
        isPlaceholderMatch && 'opacity-70'
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

        {/* Score / Time */}
        <div className="flex flex-col items-center shrink-0">
          {isFinished ? (
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
    </button>
  );
}