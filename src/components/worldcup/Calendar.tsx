'use client';

import { useMemo, useState, useCallback } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';
import { TEAMS, GROUPS, BRACKET_CONFIG } from '@/data/worldcup';
import { getTeamName } from '@/lib/standings';
import { formatTime, formatDate, getLocalDate } from '@/lib/dateUtils';
import { ESPN_TO_TEAM } from '@/lib/espnMapping';
import FlagIcon from './FlagIcon';
import { cn } from '@/lib/utils';
import { Clock, Filter, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

// Round label map
const ROUND_LABELS: Record<string, string> = {
  r32: '32 Avos', r16: 'Oitavas', qf: 'Quartas', sf: 'Semifinal',
  third_place: '3° Lugar', final: 'Final',
};

interface CalendarMatch {
  id: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeLabel: string;
  awayLabel: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  country: string;
  group: string;
  round: number;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  liveMinute?: number;
  roundLabel: string;
}

export default function Calendar() {
  const {
    matches, timezone,
    filterGroup, filterTeam, filterRound,
    setFilterGroup, setFilterTeam, setFilterRound,
    liveMatches, rawKnockoutEvents, bracket, knockoutLiveInfo, espnBracketTeams,
  } = useWorldCupStore();

  // Build unified match list: group + knockout
  const allMatches = useMemo((): CalendarMatch[] => {
    const list: CalendarMatch[] = [];

    // 1) Group stage
    for (const m of matches) {
      list.push({
        id: m.id, homeTeam: m.homeTeam, awayTeam: m.awayTeam,
        homeLabel: getTeamName(m.homeTeam), awayLabel: getTeamName(m.awayTeam),
        date: m.date, time: m.time, venue: m.venue, city: m.city, country: m.country,
        group: m.group || '', round: m.round ?? 0,
        homeScore: m.homeScore ?? null, awayScore: m.awayScore ?? null,
        status: m.status || 'upcoming', liveMinute: liveMatches[m.id],
        roundLabel: `Grupo ${m.group || ''}`,
      });
    }

    // 2) Raw ESPN knockout events (PRIMARY source — real confirmed matchups)
    const espnKOPairs = new Set<string>();
    for (const evt of rawKnockoutEvents) {
      const homeId = ESPN_TO_TEAM[evt.homeAbbr];
      const awayId = ESPN_TO_TEAM[evt.awayAbbr];
      // Skip future rounds with placeholder names like "Round of 32 5 Winner"
      if (evt.homeName.includes('Winner') || evt.awayName.includes('Winner')) continue;
      const status = evt.statusName === 'STATUS_FULL_TIME' ? 'finished'
        : evt.statusName === 'STATUS_FINAL_PEN' ? 'finished'
        : ['STATUS_IN_PROGRESS','STATUS_HALFTIME','STATUS_1ST_PERIOD','STATUS_2ND_PERIOD','STATUS_EXTRA_TIME','STATUS_PENALTY_SHOOTOUT'].includes(evt.statusName)
          ? 'live' as const : 'upcoming' as const;
      const hasScore = status !== 'upcoming';
      const evtTime = evt.time || '12:00';
      // Determine round label from ESPN altGameNote
      const note = evt.altGameNote || '';
      let roundLabel = 'Mata-mata';
      if (note.includes('Round of 32')) roundLabel = '32 Avos';
      else if (note.includes('Round of 16')) roundLabel = 'Oitavas';
      else if (note.includes('Quarterfinal')) roundLabel = 'Quartas';
      else if (note.includes('Semifinal')) roundLabel = 'Semifinal';
      else if (note.includes('Third Place') || note.includes('3rd')) roundLabel = '3\u00B0 Lugar';
      else if (note.includes('Final')) roundLabel = 'Final';

      list.push({
        id: `espn-ko-${evt.homeAbbr}-${evt.awayAbbr}`,
        homeTeam: homeId ?? null, awayTeam: awayId ?? null,
        homeLabel: evt.homeName, awayLabel: evt.awayName,
        date: evt.date || '', time: evtTime,
        venue: evt.venue || '', city: evt.city || '', country: '',
        group: '', round: 4,
        homeScore: hasScore ? (parseInt(evt.homeScore, 10) || 0) : null,
        awayScore: hasScore ? (parseInt(evt.awayScore, 10) || 0) : null,
        status,
        liveMinute: status === 'live' && evt.clock ? Math.floor(evt.clock / 60) : undefined,
        roundLabel,
      });

      // Track pairs to avoid duplicate bracket entries
      if (homeId && awayId) {
        espnKOPairs.add([homeId, awayId].sort().join(':'));
      }
    }

    // 3) Bracket knockout matches (SUPPLEMENT — only for slots not covered by ESPN)
    //    For R32: only include matches that have ESPN-confirmed teams (no predictions)
    //    For R16+: include all (bracket resolver correctly computes from match results)
    if (bracket) {

      const koMatches = [...bracket.r32, ...bracket.r16, ...bracket.qf, ...bracket.sf, bracket.thirdPlace, bracket.final];
      for (const m of koMatches) {
        // For R32: skip if no ESPN-confirmed teams (would show wrong predictions)
        if (m.round === 'r32' && !espnBracketTeams[m.id]) continue;
        
        // Skip if ESPN already has this team pair
        if (m.homeTeam && m.awayTeam) {
          const key = [m.homeTeam, m.awayTeam].sort().join(':');
          if (espnKOPairs.has(key)) continue;
        }
        const koInfo = knockoutLiveInfo[m.id];
        const hasResult = m.homeScore !== null && m.awayScore !== null;
        const status = koInfo?.status ?? (hasResult ? 'finished' : 'upcoming');
        const ht = m.homeTeam;
        const at = m.awayTeam;
        list.push({
          id: m.id, homeTeam: ht, awayTeam: at,
          homeLabel: ht ? getTeamName(ht) : m.homeSlot,
          awayLabel: at ? getTeamName(at) : m.awaySlot,
          date: m.date, time: m.time, venue: m.venue, city: m.city, country: '',
          group: '', round: 4,
          homeScore: koInfo?.homeScore ?? m.homeScore,
          awayScore: koInfo?.awayScore ?? m.awayScore,
          status, liveMinute: liveMatches[m.id],
          roundLabel: ROUND_LABELS[m.round] || m.round,
        });
      }
    }

    return list;
  }, [matches, bracket, knockoutLiveInfo, rawKnockoutEvents, liveMatches, espnBracketTeams]);

  // Compute the user-local date for each match (converts UTC date+time → user timezone)
  const matchLocalDates = useMemo(() => {
    const map = new Map<string, string>(); // matchId → localDate
    for (const m of allMatches) {
      if (!m.date) continue;
      // Use time if available, fallback to '12:00' for date-only matches
      const time = m.time || '12:00';
      map.set(m.id, getLocalDate(m.date, time, timezone));
    }
    return map;
  }, [allMatches, timezone]);

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
    let result = allMatches.filter(m => matchLocalDates.get(m.id) === selectedDate);

    if (filterGroup) {
      result = result.filter(m => m.group === filterGroup);
    }
    if (filterTeam) {
      result = result.filter(m => m.homeTeam === filterTeam || m.awayTeam === filterTeam ||
        m.homeLabel === filterTeam || m.awayLabel === filterTeam);
    }
    if (filterRound) {
      if (filterRound === '4') {
        result = result.filter(m => m.round === 4);
      } else {
        result = result.filter(m => m.round === parseInt(filterRound));
      }
    }

    return result;
  }, [allMatches, selectedDate, filterGroup, filterTeam, filterRound, matchLocalDates]);

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
          <span className="text-[11px] text-muted-foreground">
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
          const hasFinished = allMatches.some(m => matchLocalDates.get(m.id) === d && m.status === 'finished');
          const hasLive = allMatches.some(m => matchLocalDates.get(m.id) === d && m.status === 'live');
          const isCurrent = i === dateIndex;
          const isTodayDate = i === defaultIndex;

          return (
            <button
              key={d}
              onClick={() => setDateIndex(i)}
              title={formatDate(d, timezone)}
              className={cn(
                'w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-all',
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
          <option value="4">Mata-mata</option>
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
              <span className="text-[11px] text-muted-foreground/60">
                {timeMatches.length} {timeMatches.length === 1 ? 'jogo' : 'jogos'}
              </span>
            </div>
            <div className="space-y-1">
              {timeMatches.map(m => (
                <MatchRow
                  key={m.id}
                  group={m.group || m.roundLabel}
                  homeTeam={m.homeTeam}
                  awayTeam={m.awayTeam}
                  homeLabel={m.homeLabel}
                  awayLabel={m.awayLabel}
                  homeScore={m.homeScore ?? null}
                  awayScore={m.awayScore ?? null}
                  status={m.status}
                  liveMinute={m.liveMinute}
                  time={m.time}
                  venue={m.venue}
                  city={m.city}
                  country={m.country}
                  timezone={timezone}
                  isKnockout={m.round === 4}
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
  group, homeTeam, awayTeam, homeLabel, awayLabel,
  homeScore, awayScore, status, liveMinute, time, venue, city, country,
  timezone, isKnockout,
}: {
  group: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeLabel?: string;
  awayLabel?: string;
  homeScore: number | null;
  awayScore: number | null;
  status?: 'upcoming' | 'live' | 'finished';
  liveMinute?: number;
  time: string;
  venue: string;
  city: string;
  country: string;
  timezone: string;
  isKnockout?: boolean;
}) {
  const isLive = status === 'live';
  const isFinished = status === 'finished' || (homeScore !== null && awayScore !== null && !isLive);
  const hName = homeLabel || (homeTeam ? getTeamName(homeTeam) : '');
  const aName = awayLabel || (awayTeam ? getTeamName(awayTeam) : '');

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-colors',
        isLive
          ? 'bg-red-950/30 border-red-500/50'
          : isFinished
            ? 'bg-card border-border/50'
            : isKnockout
              ? 'bg-fifa-gold/5 border-fifa-gold/20'
              : 'bg-card border-border'
      )}
    >
      {/* Group/Round badge */}
      <div className={cn(
        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold',
        isKnockout ? 'bg-fifa-gold/15 text-fifa-gold' : 'bg-primary/10 text-primary'
      )}>
        <span className="truncate px-0.5">{group}</span>
      </div>

      {/* Teams and score */}
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2">
        {/* Home */}
        <div className="flex items-center gap-1.5 min-w-0">
          {homeTeam && <FlagIcon teamId={homeTeam} size={20} />}
          <span className="text-xs sm:text-sm font-medium truncate">{hName}</span>
        </div>

        {/* Score / Time / Live */}
        <div className="flex flex-col items-center shrink-0">
          {isLive && liveMinute ? (
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
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
              {time ? formatTime(time, timezone) : '--:--'}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="text-xs sm:text-sm font-medium truncate">{aName}</span>
          {awayTeam && <FlagIcon teamId={awayTeam} size={20} />}
        </div>
      </div>

      {/* Venue */}
      {venue && (
        <div className="hidden md:flex flex-col items-end shrink-0 text-[11px] text-muted-foreground max-w-[140px]">
          <span className="truncate">{venue}</span>
          {city && <span className="truncate">{city}{country ? `, ${country}` : ''}</span>}
        </div>
      )}
    </div>
  );
}