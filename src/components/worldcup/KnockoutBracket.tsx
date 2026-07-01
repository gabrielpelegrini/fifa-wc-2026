'use client';

import { useState } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';
import { getTeamName } from '@/lib/standings';
import { getSlotLabel } from '@/lib/bracketResolver';
import FlagIcon from './FlagIcon';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Radio, Clock, CheckCircle2 } from 'lucide-react';
import CrossoverPredictor from './CrossoverPredictor';

/** Format '2026-06-28' -> '28/06' */
function formatBracketDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return isoDate.slice(5);
}

type BracketMatchInfo = {
  id: string;
  round: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeSlot: string;
  awaySlot: string;
  homeScore: number | null;
  awayScore: number | null;
  penaltyHome?: number | null;
  penaltyAway?: number | null;
  venue: string;
  city: string;
  date: string;
  time?: string;
  liveStatus?: 'upcoming' | 'live' | 'finished';
  liveMinute?: number;
  displayClock?: string;
};

const SUB_TABS = [
  { id: 'bracket', label: 'Chaveamento', icon: null },
  { id: 'crossover', label: 'Cruzamentos', icon: ArrowLeftRight },
] as const;

export default function KnockoutBracket() {
  const { bracket, knockoutResults, knockoutLiveInfo, liveMatches, espnBracketTeams } = useWorldCupStore();
  const [subTab, setSubTab] = useState<string>('bracket');

  // Enrich matches with live info
  const enrichedBracket = bracket ? enrichBracket(bracket, knockoutLiveInfo, liveMatches, espnBracketTeams) : null;
  const hasKnockoutResults = knockoutResults.size > 0;

  if (!bracket) {
    return <p className="text-center text-muted-foreground py-8" role="status">Carregando chaveamento...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      {!hasKnockoutResults && (
        <div className="rounded-lg border border-fifa-gold/30 bg-fifa-gold/5 p-3 text-center" role="note">
          <p className="text-xs text-fifa-gold-dark dark:text-fifa-gold">
            Chaveamento oficial FIFA Copa do Mundo 2026.
            Os confrontos serao confirmados apos o encerramento de todos os grupos.
          </p>
        </div>
      )}

      {/* Sub-tabs: Chaveamento | Cruzamentos */}
      <div className="flex border-b border-border" role="tablist" aria-label="Sub-aba do mata-mata">
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={subTab === tab.id}
              onClick={() => setSubTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-all',
                subTab === tab.id
                  ? 'border-fifa-green text-fifa-green dark:text-fifa-green'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {subTab === 'crossover' ? (
        <CrossoverPredictor />
      ) : (
        <>
          {/* Mobile: list view */}
          <div className="lg:hidden space-y-3" role="region" aria-label="Chaveamento lista">
            <BracketListView bracket={enrichedBracket!} />
          </div>
          {/* Desktop: visual bracket with connectors */}
          <div className="hidden lg:block overflow-x-auto" role="region" aria-label="Chaveamento visual">
            <div className="min-w-[1280px] p-4">
              <div className="relative flex gap-0 items-stretch">
                <BracketRound title="32-avos de Final" matches={enrichedBracket!.r32} />
                <div className="w-6 flex items-center justify-center text-fifa-green/30" aria-hidden="true">{connectorSvg()}</div>
                <BracketRound title="Oitavas de Final" matches={enrichedBracket!.r16} />
                <div className="w-6 flex items-center justify-center text-fifa-green/30" aria-hidden="true">{connectorSvg()}</div>
                <BracketRound title="Quartas de Final" matches={enrichedBracket!.qf} />
                <div className="w-6 flex items-center justify-center text-fifa-green/30" aria-hidden="true">{connectorSvg()}</div>
                <div className="flex flex-col gap-2 flex-shrink-0 w-[220px]">
                  <BracketRound title="Semifinais" matches={enrichedBracket!.sf} />
                  <BracketSingleMatch match={enrichedBracket!.thirdPlace} label="3o Lugar" />
                  <BracketSingleMatch match={enrichedBracket!.final} label="Final" highlight />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Enrich bracket matches with live info from the store */
function enrichBracket(
  bracket: NonNullable<ReturnType<typeof useWorldCupStore.getState>['bracket']>,
  knockoutLiveInfo: Record<string, { status: string; homeScore: number | null; awayScore: number | null; minute?: number; displayClock?: string }>,
  liveMatches: Record<string, number>,
  espnTeams: Record<string, { homeTeam: string; awayTeam: string }>
): { r32: BracketMatchInfo[]; r16: BracketMatchInfo[]; qf: BracketMatchInfo[]; sf: BracketMatchInfo[]; thirdPlace: BracketMatchInfo; final: BracketMatchInfo } {
  function enrich(m: typeof bracket.r32[0]): BracketMatchInfo {
    const live = knockoutLiveInfo[m.id];
    const hasLive = live && (live.status === 'live' || live.status === 'finished');
    const confirmed = espnTeams[m.id];
    // For R32: only show ESPN-confirmed teams, NOT bracket resolver predictions.
    // Predictions can be wrong if group data is incomplete or bracket config differs from FIFA.
    // For R16+: bracket resolver correctly computes from actual match results.
    const isR32 = m.round === 'r32';
    const homeTeam = isR32
      ? (confirmed ? confirmed.homeTeam : null)
      : (confirmed ? confirmed.homeTeam : m.homeTeam);
    const awayTeam = isR32
      ? (confirmed ? confirmed.awayTeam : null)
      : (confirmed ? confirmed.awayTeam : m.awayTeam);
    return {
      id: m.id,
      round: m.round,
      homeTeam,
      awayTeam,
      homeSlot: m.homeSlot,
      awaySlot: m.awaySlot,
      homeScore: hasLive ? (live.homeScore ?? m.homeScore) : m.homeScore,
      awayScore: hasLive ? (live.awayScore ?? m.awayScore) : m.awayScore,
      penaltyHome: m.penaltyHome,
      penaltyAway: m.penaltyAway,
      venue: m.venue,
      city: m.city,
      date: m.date,
      time: m.time,
      liveStatus: live?.status as BracketMatchInfo['liveStatus'],
      liveMinute: liveMatches[m.id],
      displayClock: live?.displayClock,
    };
  }

  return {
    r32: bracket.r32.map(enrich),
    r16: bracket.r16.map(enrich),
    qf: bracket.qf.map(enrich),
    sf: bracket.sf.map(enrich),
    thirdPlace: enrich(bracket.thirdPlace),
    final: enrich(bracket.final),
  };
}

/** SVG connector arrow between rounds */
function connectorSvg() {
  return (
    <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 20 L18 20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
      <path d="M14 14 L20 20 L14 26" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function BracketRound({
  title, matches, className = '',
}: {
  title: string;
  matches: BracketMatchInfo[];
  className?: string;
}) {
  const spacing = matches.length <= 2 ? 'gap-16' : matches.length <= 4 ? 'gap-8' : matches.length <= 8 ? 'gap-4' : 'gap-1';
  return (
    <div className={cn('w-[220px] flex-shrink-0', className)}>
      <h3 className="text-xs font-bold text-fifa-green uppercase tracking-wider mb-2 text-center">{title}</h3>
      <div className={cn('flex flex-col justify-around h-full', spacing)}>
        {matches.map(m => (
          <BracketMatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function BracketSingleMatch({
  match, label, highlight = false,
}: {
  match: BracketMatchInfo;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('rounded-lg border p-2', highlight && 'border-fifa-gold/50 bg-fifa-gold/5')}>
      <div className="text-[11px] font-bold text-center text-muted-foreground mb-1">{label}</div>
      <BracketMatchCard match={match} compact />
    </div>
  );
}

function BracketMatchCard({
  match, compact = false,
}: {
  match: BracketMatchInfo;
  compact?: boolean;
}) {
  const homeLabel = match.homeTeam ? getTeamName(match.homeTeam) : getSlotLabel(match.homeSlot);
  const awayLabel = match.awayTeam ? getTeamName(match.awayTeam) : getSlotLabel(match.awaySlot);
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const hasTeams = match.homeTeam !== null && match.awayTeam !== null;
  const isLive = match.liveStatus === 'live';
  const isFinished = match.liveStatus === 'finished' || (hasScore && !isLive);
  const isPenalty = isFinished && hasScore && match.homeScore === match.awayScore &&
    match.penaltyHome != null && match.penaltyAway != null;

  // Determine winner for visual emphasis
  let homeWinner = false;
  let awayWinner = false;
  if (isFinished && hasScore) {
    if (isPenalty) {
      homeWinner = (match.penaltyHome ?? 0) > (match.penaltyAway ?? 0);
      awayWinner = (match.penaltyAway ?? 0) > (match.penaltyHome ?? 0);
    } else {
      homeWinner = match.homeScore! > match.awayScore!;
      awayWinner = match.awayScore! > match.homeScore!;
    }
  }

  return (
    <div
      className={cn(
        'w-full rounded-md border transition-colors',
        isLive ? 'bg-red-950/20 border-red-500/40 live-glow' :
        hasScore ? 'bg-card border-fifa-green/30' : 'bg-card border-border',
        compact ? 'p-1.5' : 'p-2',
        !hasTeams && 'opacity-50'
      )}
      role="group"
      aria-label={`${homeLabel} vs ${awayLabel}${isLive ? ' - Ao vivo' : isFinished ? ' - Encerrado' : ''}`}
    >
      <div className="flex items-center gap-1">
        {match.homeTeam && <FlagIcon teamId={match.homeTeam} size={16} aria-hidden="true" />}
        <span className={cn(
          'flex-1 truncate',
          compact ? 'text-[11px]' : 'text-xs',
          match.homeTeam && 'font-medium',
          isFinished && homeWinner && 'text-fifa-green font-bold',
        )}>
          {homeLabel}
        </span>
        {hasScore && (
          <span className={cn(
            'font-bold tabular-nums',
            compact ? 'text-[11px]' : 'text-xs',
            isFinished && homeWinner && 'text-fifa-green',
          )}>
            {match.homeScore}
            {isPenalty && homeWinner && <span className="text-fifa-gold ml-0.5" aria-label="vencedor nos penaltis">*</span>}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        {match.awayTeam && <FlagIcon teamId={match.awayTeam} size={16} aria-hidden="true" />}
        <span className={cn(
          'flex-1 truncate',
          compact ? 'text-[11px]' : 'text-xs',
          match.awayTeam && 'font-medium',
          isFinished && awayWinner && 'text-fifa-green font-bold',
        )}>
          {awayLabel}
        </span>
        {hasScore && (
          <span className={cn(
            'font-bold tabular-nums',
            compact ? 'text-[11px]' : 'text-xs',
            isFinished && awayWinner && 'text-fifa-green',
          )}>
            {match.awayScore}
            {isPenalty && awayWinner && <span className="text-fifa-gold ml-0.5" aria-label="vencedor nos penaltis">*</span>}
          </span>
        )}
      </div>

      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center gap-1 mt-1" role="status" aria-label={`Ao vivo, minuto ${match.liveMinute ?? 0}`}>
          <Radio className="h-2.5 w-2.5 text-red-400 animate-pulse" />
          <span className="text-[11px] font-bold text-red-400">
            {match.liveMinute && match.liveMinute > 0 ? `${match.liveMinute}'` : 'AO VIVO'}
            {match.displayClock && <span className="ml-1 text-red-400/60">{match.displayClock}</span>}
          </span>
        </div>
      )}

      {/* Penalty score display */}
      {isPenalty && (
        <div className="text-[11px] text-fifa-gold mt-0.5 font-medium" aria-label={`Penaltis: ${match.penaltyHome} x ${match.penaltyAway}`}>
          Penaltis: {match.penaltyHome} x {match.penaltyAway}
        </div>
      )}

      {/* Finished indicator */}
      {isFinished && !isLive && !compact && (
        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
          <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
          <span className="text-[11px]">Encerrado</span>
        </div>
      )}

      {/* Venue + date */}
      {!compact && (
        <div className="text-[11px] text-muted-foreground mt-1 truncate">
          {match.venue} · {formatBracketDate(match.date)}
        </div>
      )}
    </div>
  );
}

function BracketListView({
  bracket,
}: {
  bracket: {
    r32: BracketMatchInfo[];
    r16: BracketMatchInfo[];
    qf: BracketMatchInfo[];
    sf: BracketMatchInfo[];
    thirdPlace: BracketMatchInfo;
    final: BracketMatchInfo;
  };
}) {
  if (!bracket) return null;

  const rounds = [
    { title: '32-avos de Final', matches: bracket.r32 },
    { title: 'Oitavas de Final', matches: bracket.r16 },
    { title: 'Quartas de Final', matches: bracket.qf },
    { title: 'Semifinais', matches: bracket.sf },
  ];

  return (
    <div className="space-y-4">
      {rounds.map(round => (
        <div key={round.title} className="rounded-lg border bg-card overflow-hidden">
          <div className="bg-fifa-green/10 px-3 py-1.5">
            <span className="font-bold text-xs">{round.title}</span>
            <span className="text-xs text-muted-foreground ml-2">({round.matches.length} jogos)</span>
          </div>
          <div className="divide-y">
            {round.matches.map(m => (
              <MobileMatchRow key={m.id} match={m} />
            ))}
          </div>
        </div>
      ))}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-fifa-gold/10 px-3 py-1.5">
          <span className="font-bold text-xs">Decisões</span>
        </div>
        <div className="divide-y">
          <MobileMatchRow match={bracket.thirdPlace} />
          <MobileMatchRow match={bracket.final} highlight />
        </div>
      </div>
    </div>
  );
}

function MobileMatchRow({
  match, highlight = false,
}: {
  match: BracketMatchInfo;
  highlight?: boolean;
}) {
  const homeLabel = match.homeTeam ? getTeamName(match.homeTeam) : getSlotLabel(match.homeSlot);
  const awayLabel = match.awayTeam ? getTeamName(match.awayTeam) : getSlotLabel(match.awaySlot);
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const isLive = match.liveStatus === 'live';
  const isFinished = match.liveStatus === 'finished' || (hasScore && !isLive);
  const isPenalty = isFinished && hasScore && match.homeScore === match.awayScore &&
    match.penaltyHome != null && match.penaltyAway != null;

  let homeWinner = false;
  let awayWinner = false;
  if (isFinished && hasScore) {
    if (isPenalty) {
      homeWinner = (match.penaltyHome ?? 0) > (match.penaltyAway ?? 0);
      awayWinner = (match.penaltyAway ?? 0) > (match.penaltyHome ?? 0);
    } else {
      homeWinner = match.homeScore! > match.awayScore!;
      awayWinner = match.awayScore! > match.homeScore!;
    }
  }

  return (
    <div
      className={cn('w-full flex items-center gap-2 p-3', highlight && 'bg-fifa-gold/5')}
      role="group"
      aria-label={`${homeLabel} vs ${awayLabel}${isLive ? ' - Ao vivo' : ''}`}
    >
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.homeTeam && <FlagIcon teamId={match.homeTeam} size={20} aria-hidden="true" />}
          <span className={cn('text-sm font-medium truncate', isFinished && homeWinner && 'text-fifa-green font-bold')}>{homeLabel}</span>
        </div>
        <div className="text-center shrink-0">
          {hasScore ? (
            <div className="flex flex-col items-center">
              <span className={cn('text-sm font-bold tabular-nums', homeWinner && 'text-fifa-green')}>{match.homeScore}</span>
              {isPenalty && (
                <span className="text-[11px] text-fifa-gold font-medium" aria-label={`Penaltis ${match.penaltyHome} x ${match.penaltyAway}`}>
                  ({match.penaltyHome}-{match.penaltyAway})
                </span>
              )}
              {!isPenalty && <span className="text-[11px] text-muted-foreground">x</span>}
              {isPenalty && <span className="text-[11px] text-muted-foreground"> </span>}
              <span className={cn('text-sm font-bold tabular-nums', awayWinner && 'text-fifa-green')}>{match.awayScore}</span>
            </div>
          ) : isLive ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Radio className="h-3 w-3 text-red-400 animate-pulse" aria-hidden="true" />
                <span className="text-xs font-bold text-red-400">
                  {match.liveMinute && match.liveMinute > 0 ? `${match.liveMinute}'` : 'AO VIVO'}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{formatBracketDate(match.date)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className={cn('text-sm font-medium truncate', isFinished && awayWinner && 'text-fifa-green font-bold')}>{awayLabel}</span>
          {match.awayTeam && <FlagIcon teamId={match.awayTeam} size={20} aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}