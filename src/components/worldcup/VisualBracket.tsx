'use client';

import { useMemo } from 'react';
import {
  useWorldCupStore,
  type KnockoutLiveEntry,
} from '@/store/worldCupStore';
import { cn } from '@/lib/utils';
import { getTeamName } from '@/lib/standings';
import FlagIcon from './FlagIcon';
import { Trophy, Radio, Star, CheckCircle2, MapPin } from 'lucide-react';
import type { KnockoutMatch } from '@/data/types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const RH = 54; // row height in px (16 rows for R32 base)
const ROWS = 16;
const TOTAL_H = ROWS * RH; // 864px
const COL_W = 216; // wider columns for better readability
const CONN_W = 40;
const CARD_H = 58; // match card height (increased for readability)

const GOLD = '#D4AF37';
const GOLD_MID = 'rgba(212,175,55,0.50)';
const GOLD_DIM = 'rgba(212,175,55,0.25)';
// Theme-aware background (respects light/dark mode)

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
interface MatchDisplay {
  id: string;
  round: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeLabel: string;
  awayLabel: string;
  homeSlot: string;
  awaySlot: string;
  homeScore: number | null;
  awayScore: number | null;
  penaltyHome?: number | null;
  penaltyAway?: number | null;
  status: 'upcoming' | 'live' | 'finished';
  liveMinute?: number;
  displayClock?: string;
  date: string;
  venue: string;
  city: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Calculate the vertical center Y for match at `index` in a round with `total` matches. */
function centerY(index: number, total: number): number {
  return (index + 0.5) * (ROWS / total) * RH;
}

/** Format a bracket slot string for display: "1A" → "1° A", "3_ABCDF" → "3° ABCDF" */
function formatSlot(slot: string): string {
  const m1 = slot.match(/^1([A-L])$/);
  if (m1) return `1\u00B0 ${m1[1]}`;
  const m2 = slot.match(/^2([A-L])$/);
  if (m2) return `2\u00B0 ${m2[1]}`;
  const m3 = slot.match(/^3_([A-L]+)$/);
  if (m3) return `3\u00B0 ${m3[1]}`;
  if (slot.startsWith('V(')) return slot.replace('V(', 'Vencedor ').replace(')', '');
  if (slot.startsWith('P(')) return slot.replace('P(', 'Perdedor ').replace(')', '');
  return slot;
}

/** Determine winner side from scores + penalties. */
function getWinners(match: MatchDisplay): { homeWinner: boolean; awayWinner: boolean } {
  let homeWinner = false;
  let awayWinner = false;
  const { homeScore, awayScore, penaltyHome, penaltyAway, status } = match;
  if (status === 'finished' && homeScore !== null && awayScore !== null) {
    if (homeScore !== awayScore) {
      homeWinner = homeScore > awayScore;
      awayWinner = awayScore > homeScore;
    } else if (penaltyHome != null && penaltyAway != null) {
      homeWinner = penaltyHome > penaltyAway;
      awayWinner = penaltyAway > penaltyHome;
    }
  }
  return { homeWinner, awayWinner };
}

/** Format ISO date as DD/MM */
function fmtDate(iso: string): string {
  const p = iso.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}` : iso.slice(5);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRACKET ENRICHMENT
// ═══════════════════════════════════════════════════════════════════════════════

function enrichMatch(
  m: KnockoutMatch,
  liveInfo: Record<string, KnockoutLiveEntry>,
  liveMatches: Record<string, number>,
  espnTeams: Record<string, { homeTeam: string; awayTeam: string }>,
): MatchDisplay {
  const live = liveInfo[m.id];
  const hasLive = live && (live.status === 'live' || live.status === 'finished');

  let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
  if (live) {
    status = live.status;
  } else if (m.homeScore !== null && m.awayScore !== null) {
    status = 'finished';
  }

  // For R32: only use ESPN-confirmed teams, NOT bracket resolver predictions.
  // For R16+: bracket resolver correctly computes from actual match results.
  const confirmed = espnTeams[m.id];
  const isR32 = m.round === 'r32';
  const homeTeamId = isR32
    ? (confirmed ? confirmed.homeTeam : null)
    : (confirmed ? confirmed.homeTeam : m.homeTeam);
  const awayTeamId = isR32
    ? (confirmed ? confirmed.awayTeam : null)
    : (confirmed ? confirmed.awayTeam : m.awayTeam);

  return {
    id: m.id,
    round: m.round,
    homeTeamId,
    awayTeamId,
    homeLabel: homeTeamId ? getTeamName(homeTeamId) : formatSlot(m.homeSlot),
    awayLabel: awayTeamId ? getTeamName(awayTeamId) : formatSlot(m.awaySlot),
    homeSlot: m.homeSlot,
    awaySlot: m.awaySlot,
    homeScore: hasLive ? (live.homeScore ?? m.homeScore) : m.homeScore,
    awayScore: hasLive ? (live.awayScore ?? m.awayScore) : m.awayScore,
    penaltyHome: m.penaltyHome,
    penaltyAway: m.penaltyAway,
    status,
    liveMinute: liveMatches[m.id],
    displayClock: live?.displayClock,
    date: m.date,
    venue: m.venue,
    city: m.city,
  };
}

/** Build enriched bracket from store data. */
function buildEnrichedBracket(
  bracket: NonNullable<ReturnType<typeof useWorldCupStore.getState>['bracket']>,
  liveInfo: Record<string, KnockoutLiveEntry>,
  liveMatches: Record<string, number>,
  espnTeams: Record<string, { homeTeam: string; awayTeam: string }>,
) {
  // Build enriched matches (single pass — no loose raw event resolution)
  const allFlat: MatchDisplay[] = [
    ...bracket.r32.map((m) => enrichMatch(m, liveInfo, liveMatches, espnTeams)),
    ...bracket.r16.map((m) => enrichMatch(m, liveInfo, liveMatches, espnTeams)),
    ...bracket.qf.map((m) => enrichMatch(m, liveInfo, liveMatches, espnTeams)),
    ...bracket.sf.map((m) => enrichMatch(m, liveInfo, liveMatches, espnTeams)),
    enrichMatch(bracket.thirdPlace, liveInfo, liveMatches, espnTeams),
    enrichMatch(bracket.final, liveInfo, liveMatches, espnTeams),
  ];

  // Partition by round field
  const byRound = new Map<string, MatchDisplay[]>();
  for (const m of allFlat) {
    const arr = byRound.get(m.round) || [];
    arr.push(m);
    byRound.set(m.round, arr);
  }
  const get = (round: string) => (byRound.get(round) || []) as MatchDisplay[];
  const getOne = (round: string) => {
    const arr = byRound.get(round);
    return (arr && arr[0]) as MatchDisplay;
  };

  return {
    r32: get('r32'),
    r16: get('r16'),
    qf: get('qf'),
    sf: get('sf'),
    thirdPlace: getOne('third_place'),
    final: getOne('final'),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECTOR SVG
// ═══════════════════════════════════════════════════════════════════════════════

function ConnectorLines({
  fromCount,
  toCount,
}: {
  fromCount: number;
  toCount: number;
}) {
  const paths: React.ReactNode[] = [];
  const mx = CONN_W / 2;

  for (let j = 0; j < toCount; j++) {
    const y1 = centerY(j * 2, fromCount);
    const y2 = centerY(j * 2 + 1, fromCount);
    const ymid = centerY(j, toCount);

    paths.push(
      <g key={j} opacity={0.7}>
        {/* Left horizontal lines from each feeder */}
        <line x1={0} y1={y1} x2={mx} y2={y1} stroke={GOLD_MID} strokeWidth={1.5} strokeDasharray="6 3" />
        <line x1={0} y1={y2} x2={mx} y2={y2} stroke={GOLD_MID} strokeWidth={1.5} strokeDasharray="6 3" />
        {/* Vertical connector between feeders */}
        <line x1={mx} y1={y1} x2={mx} y2={y2} stroke={GOLD_MID} strokeWidth={1.5} strokeDasharray="6 3" />
        {/* Right horizontal line to target match */}
        <line x1={mx} y1={ymid} x2={CONN_W} y2={ymid} stroke={GOLD_MID} strokeWidth={1.5} strokeDasharray="6 3" />
        {/* Junction dot */}
        <circle cx={mx} cy={ymid} r={2.5} fill={GOLD} opacity={0.8} />
      </g>,
    );
  }

  return (
    <svg width={CONN_W} height={TOTAL_H} className="flex-shrink-0" aria-hidden="true">
      {paths}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCH CARD (DESKTOP)
// ═══════════════════════════════════════════════════════════════════════════════

function MatchCard({ match, isFinal = false }: { match: MatchDisplay; isFinal?: boolean }) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isPenalty =
    isFinished &&
    hasScore &&
    match.homeScore === match.awayScore &&
    match.penaltyHome != null &&
    match.penaltyAway != null;
  const { homeWinner, awayWinner } = getWinners(match);
  const hasTeams = match.homeTeamId !== null && match.awayTeamId !== null;

  return (
    <div
      className={cn(
        'rounded-lg border transition-all overflow-hidden',
        isFinal ? 'p-2.5' : 'p-2',
        isLive && 'bg-red-950/30 border-red-500/50 live-glow',
        isFinished && hasScore && !isLive && 'bg-card border-fifa-gold/40',
        !isLive && !isFinished && 'bg-card/80 border-border/60',
        !hasTeams && 'opacity-40',
        isFinal && isFinished && hasScore && 'ring-1 ring-fifa-gold/30',
      )}
    >
      {/* Home team row */}
      <div className="flex items-center gap-1.5" style={{ height: isFinal ? 24 : 20 }}>
        {match.homeTeamId ? (
          <FlagIcon teamId={match.homeTeamId} size={isFinal ? 24 : 18} />
        ) : (
          <div className="w-[18px] h-[18px] flex-shrink-0 rounded bg-muted flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground font-bold">?</span>
          </div>
        )}
        <span
          className={cn(
            'flex-1 truncate leading-tight',
            isFinal ? 'text-sm' : 'text-xs',
            isFinished && homeWinner && 'text-fifa-green font-bold',
            !isFinished && match.homeTeamId && 'text-foreground font-medium',
            !match.homeTeamId && 'text-muted-foreground italic text-[11px]',
            isLive && match.homeTeamId && 'text-white',
          )}
        >
          {match.homeLabel}
        </span>
        {hasScore && (
          <span
            className={cn(
              'font-bold tabular-nums min-w-[16px] text-right',
              isFinal ? 'text-base' : 'text-xs',
              isFinished && homeWinner && 'text-fifa-green',
              isLive && 'text-white',
            )}
          >
            {match.homeScore}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border/30 my-0.5" />

      {/* Away team row */}
      <div className="flex items-center gap-1.5" style={{ height: isFinal ? 24 : 20 }}>
        {match.awayTeamId ? (
          <FlagIcon teamId={match.awayTeamId} size={isFinal ? 24 : 18} />
        ) : (
          <div className="w-[18px] h-[18px] flex-shrink-0 rounded bg-muted flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground font-bold">?</span>
          </div>
        )}
        <span
          className={cn(
            'flex-1 truncate leading-tight',
            isFinal ? 'text-sm' : 'text-xs',
            isFinished && awayWinner && 'text-fifa-green font-bold',
            !isFinished && match.awayTeamId && 'text-foreground font-medium',
            !match.awayTeamId && 'text-muted-foreground italic text-[11px]',
            isLive && match.awayTeamId && 'text-white',
          )}
        >
          {match.awayLabel}
        </span>
        {hasScore && (
          <span
            className={cn(
              'font-bold tabular-nums min-w-[16px] text-right',
              isFinal ? 'text-base' : 'text-xs',
              isFinished && awayWinner && 'text-fifa-green',
              isLive && 'text-white',
            )}
          >
            {match.awayScore}
          </span>
        )}
      </div>

      {/* Status indicators */}
      {isLive && (
        <div className="flex items-center gap-1 mt-1" role="status" aria-label={`Ao vivo, minuto ${match.liveMinute ?? 0}`}>
          <Radio className="w-3 h-3 text-red-400 animate-pulse" />
          <span className="text-[11px] font-bold text-red-400 tracking-wide">
            {match.liveMinute && match.liveMinute > 0 ? `${match.liveMinute}'` : 'AO VIVO'}
            {match.displayClock && (
              <span className="ml-1 text-red-400/60">{match.displayClock}</span>
            )}
          </span>
        </div>
      )}

      {isPenalty && (
        <div className="text-[11px] text-fifa-gold mt-0.5 font-semibold text-center tracking-wide">
          PEN {match.penaltyHome}&ndash;{match.penaltyAway}
        </div>
      )}

      {isFinished && !isLive && !isFinal && (
        <div className="flex items-center gap-1 mt-0.5 text-muted-foreground/60">
          <CheckCircle2 className="w-3 h-3" />
          <span className="text-[11px]">Encerrado</span>
        </div>
      )}

      {/* Date + venue for all cards */}
      {!isFinal && match.date && (
        <div className="flex items-center gap-1 mt-1 text-muted-foreground/70">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="text-[10px] truncate">{fmtDate(match.date)} &middot; {match.city}</span>
        </div>
      )}

      {/* Final venue (larger) */}
      {isFinal && (
        <div className="text-[11px] text-muted-foreground mt-1 text-center truncate">
          {match.venue} &middot; {match.city}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TROPHY SECTION (between semifinals)
// ═══════════════════════════════════════════════════════════════════════════════

function TrophySection() {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-1"
      style={{ top: TOTAL_H / 2 - 44 }}
      aria-hidden="true"
    >
      <Star className="w-4 h-4 text-fifa-gold opacity-60" />
      <div className="relative">
        <div className="absolute inset-0 blur-md bg-fifa-gold/20 rounded-full" />
        <Trophy className="w-14 h-14 text-fifa-gold relative" strokeWidth={1.5} />
      </div>
      <Star className="w-4 h-4 text-fifa-gold opacity-60" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP BRACKET
// ═══════════════════════════════════════════════════════════════════════════════

function RoundColumn({
  title,
  matches,
  totalInRound,
}: {
  title: string;
  matches: MatchDisplay[];
  totalInRound: number;
}) {
  return (
    <div className="flex-shrink-0 flex flex-col items-center" style={{ width: COL_W }}>
      {/* Round label */}
      <div className="h-8 flex items-center justify-center mb-1">
        <span className="text-xs font-bold tracking-[0.2em] text-fifa-gold uppercase">
          {title}
        </span>
      </div>
      {/* Match column */}
      <div className="relative" style={{ height: TOTAL_H }}>
        {matches.map((m, i) => {
          const cy = centerY(i, totalInRound);
          return (
            <div
              key={m.id}
              className="absolute w-full"
              style={{ top: cy - CARD_H / 2 }}
            >
              <MatchCard match={m} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SingleMatchColumn({
  match,
  label,
  totalSlots,
  matchIndex,
  isFinal = false,
}: {
  match: MatchDisplay;
  label: string;
  totalSlots: number;
  matchIndex: number;
  isFinal?: boolean;
}) {
  const cy = centerY(matchIndex, totalSlots);
  return (
    <div className="flex-shrink-0 flex flex-col items-center" style={{ width: COL_W }}>
      <div className="h-8 flex items-center justify-center mb-1">
        <span className="text-xs font-bold tracking-[0.2em] text-fifa-gold uppercase">
          {label}
        </span>
      </div>
      <div className="relative" style={{ height: TOTAL_H }}>
        <div className="absolute w-full" style={{ top: cy - CARD_H / 2 - 4 }}>
          <MatchCard match={match} isFinal={isFinal} />
        </div>
      </div>
    </div>
  );
}

function DesktopBracket(data: {
  r32: MatchDisplay[];
  r16: MatchDisplay[];
  qf: MatchDisplay[];
  sf: MatchDisplay[];
  thirdPlace: MatchDisplay;
  final: MatchDisplay;
}) {
  const { r32, r16, qf, sf, thirdPlace, final } = data;

  return (
    <div
      className="min-w-[1420px] overflow-x-auto"
      role="region"
      aria-label="Chaveamento visual mata-mata"
    >
      <div className="flex items-start justify-center py-2 px-4">
        {/* R32 */}
        <RoundColumn title="32 AVOS" matches={r32} totalInRound={16} />

        {/* Connector R32 → R16 */}
        <div className="flex-shrink-0 flex items-center" style={{ height: 8 + TOTAL_H }}>
          <ConnectorLines fromCount={16} toCount={8} />
        </div>

        {/* R16 */}
        <RoundColumn title="OITAVAS" matches={r16} totalInRound={8} />

        {/* Connector R16 → QF */}
        <div className="flex-shrink-0 flex items-center" style={{ height: 8 + TOTAL_H }}>
          <ConnectorLines fromCount={8} toCount={4} />
        </div>

        {/* QF */}
        <RoundColumn title="QUARTAS" matches={qf} totalInRound={4} />

        {/* Connector QF → SF */}
        <div className="flex-shrink-0 flex items-center" style={{ height: 8 + TOTAL_H }}>
          <ConnectorLines fromCount={4} toCount={2} />
        </div>

        {/* SF + Trophy + 3rd Place */}
        <div className="flex-shrink-0 flex flex-col items-center" style={{ width: COL_W + 10 }}>
          <div className="h-8 flex items-center justify-center mb-1">
            <span className="text-xs font-bold tracking-[0.2em] text-fifa-gold uppercase">
              SEMIFINAIS
            </span>
          </div>
          <div className="relative" style={{ height: TOTAL_H }}>
            {/* SF-01 */}
            <div
              className="absolute w-full"
              style={{ top: centerY(0, 2) - CARD_H / 2 }}
            >
              <MatchCard match={sf[0]} />
            </div>

            {/* Trophy between semis */}
            <TrophySection />

            {/* SF-02 */}
            <div
              className="absolute w-full"
              style={{ top: centerY(1, 2) - CARD_H / 2 }}
            >
              <MatchCard match={sf[1]} />
            </div>

            {/* 3rd Place — positioned below SF-02 */}
            <div
              className="absolute w-full"
              style={{ top: TOTAL_H - CARD_H - 12 }}
            >
              <div className="text-xs font-bold text-fifa-gold/60 text-center mb-1 tracking-wider uppercase">
                3\u00B0 Lugar
              </div>
              <MatchCard match={thirdPlace} />
            </div>
          </div>
        </div>

        {/* Connector SF → Final */}
        <div className="flex-shrink-0 flex items-center" style={{ height: 8 + TOTAL_H }}>
          <ConnectorLines fromCount={2} toCount={1} />
        </div>

        {/* Final */}
        <div className="flex-shrink-0 flex flex-col items-center" style={{ width: COL_W }}>
          <div className="h-8 flex items-center justify-center mb-1">
            <span className="text-xs font-bold tracking-[0.2em] text-fifa-gold uppercase">
              FINAL
            </span>
          </div>
          <div className="relative flex items-center" style={{ height: TOTAL_H, width: COL_W }}>
            <div
              className="absolute w-full"
              style={{ top: centerY(0, 1) - CARD_H / 2 - 10 }}
            >
              <MatchCard match={final} isFinal />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE BRACKET
// ═══════════════════════════════════════════════════════════════════════════════

function MobileMatchRow({ match, highlight = false }: { match: MatchDisplay; highlight?: boolean }) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isPenalty =
    isFinished &&
    hasScore &&
    match.homeScore === match.awayScore &&
    match.penaltyHome != null &&
    match.penaltyAway != null;
  const { homeWinner, awayWinner } = getWinners(match);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 border-b border-border/40 last:border-b-0',
        highlight && 'bg-fifa-gold/5',
      )}
      role="group"
      aria-label={`${match.homeLabel} vs ${match.awayLabel}${isLive ? ' - Ao vivo' : ''}`}
    >
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Home */}
        <div className="flex items-center gap-1.5 min-w-0">
          {match.homeTeamId ? (
            <FlagIcon teamId={match.homeTeamId} size={20} />
          ) : (
            <div className="w-5 h-5 flex-shrink-0 rounded bg-muted flex items-center justify-center">
              <span className="text-[11px] text-muted-foreground font-bold">?</span>
            </div>
          )}
          <span
            className={cn(
              'text-[13px] font-medium truncate',
              isFinished && homeWinner && 'text-fifa-green font-bold',
              !match.homeTeamId && 'text-muted-foreground italic text-[11px]',
            )}
          >
            {match.homeLabel}
          </span>
        </div>

        {/* Score / Status */}
        <div className="text-center shrink-0 min-w-[40px]">
          {hasScore ? (
            <div className="flex flex-col items-center leading-tight">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    homeWinner && 'text-fifa-green',
                    isLive && 'text-white',
                  )}
                >
                  {match.homeScore}
                </span>
                <span className="text-[11px] text-muted-foreground">&times;</span>
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    awayWinner && 'text-fifa-green',
                    isLive && 'text-white',
                  )}
                >
                  {match.awayScore}
                </span>
              </div>
              {isPenalty && (
                <span className="text-[11px] text-fifa-gold font-semibold">
                  PEN {match.penaltyHome}&ndash;{match.penaltyAway}
                </span>
              )}
            </div>
          ) : isLive ? (
            <div className="flex items-center gap-1 justify-center">
              <Radio className="w-3 h-3 text-red-400 animate-pulse" />
              <span className="text-[11px] font-bold text-red-400">
                {match.liveMinute && match.liveMinute > 0 ? `${match.liveMinute}'` : 'AO VIVO'}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">{fmtDate(match.date)}</span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span
            className={cn(
              'text-[13px] font-medium truncate text-right',
              isFinished && awayWinner && 'text-fifa-green font-bold',
              !match.awayTeamId && 'text-muted-foreground italic text-[11px]',
            )}
          >
            {match.awayLabel}
          </span>
          {match.awayTeamId ? (
            <FlagIcon teamId={match.awayTeamId} size={20} />
          ) : (
            <div className="w-5 h-5 flex-shrink-0 rounded bg-muted flex items-center justify-center">
              <span className="text-[11px] text-muted-foreground font-bold">?</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileRoundSection({
  title,
  matches,
}: {
  title: string;
  matches: MatchDisplay[];
}) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="bg-fifa-gold/10 px-4 py-2.5 border-b border-border/40">
        <span className="text-xs font-bold tracking-[0.15em] text-fifa-gold uppercase">
          {title}
        </span>
        <span className="text-[11px] text-muted-foreground ml-2">({matches.length} jogos)</span>
      </div>
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {matches.map((m) => (
          <MobileMatchRow key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function MobileBracket(data: {
  r32: MatchDisplay[];
  r16: MatchDisplay[];
  qf: MatchDisplay[];
  sf: MatchDisplay[];
  thirdPlace: MatchDisplay;
  final: MatchDisplay;
}) {
  const { r32, r16, qf, sf, thirdPlace, final } = data;

  const rounds = [
    { title: '32 Avos de Final', matches: r32 },
    { title: 'Oitavas de Final', matches: r16 },
    { title: 'Quartas de Final', matches: qf },
    { title: 'Semifinais', matches: sf },
  ];

  return (
    <div className="space-y-4">
      {rounds.map((r) => (
        <MobileRoundSection key={r.title} title={r.title} matches={r.matches} />
      ))}

      {/* Decisoes: 3rd place + Final */}
      <div className="rounded-xl border border-fifa-gold/20 overflow-hidden">
        <div className="bg-fifa-gold/15 px-4 py-2.5 border-b border-border/40">
          <span className="text-xs font-bold tracking-[0.15em] text-fifa-gold uppercase">
            Decis\u00F5es
          </span>
        </div>
        <div>
          <MobileMatchRow match={thirdPlace} />
          <MobileMatchRow match={final} highlight />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function VisualBracket() {
  const { bracket, knockoutLiveInfo, liveMatches, espnBracketTeams } = useWorldCupStore();

  const data = useMemo(() => {
    if (!bracket) return null;
    return buildEnrichedBracket(bracket, knockoutLiveInfo, liveMatches, espnBracketTeams);
  }, [bracket, knockoutLiveInfo, liveMatches, espnBracketTeams]);

  if (!bracket || !data) {
    return (
      <div className={cn('bg-card rounded-2xl p-8 text-center border border-border')}>
        <p className="text-muted-foreground text-sm">Carregando chaveamento...</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-card rounded-2xl overflow-hidden border border-border')}>
      {/* ── Title ── */}
      <div className="relative px-6 pt-6 pb-4 text-center">
        {/* Decorative top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-fifa-gold to-transparent" />
        <div className="flex items-center justify-center gap-3">
          <Star className="w-4 h-4 text-fifa-gold opacity-70" />
          <Trophy className="w-5 h-5 text-fifa-gold" />
          <h2 className="text-xl font-extrabold tracking-[0.25em] text-fifa-gold uppercase">
            Mata-Mata
          </h2>
          <Trophy className="w-5 h-5 text-fifa-gold" />
          <Star className="w-4 h-4 text-fifa-gold opacity-70" />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 tracking-wide">
          FIFA World Cup 2026 &mdash; Chaveamento Eliminat&oacute;rio
        </p>
      </div>

      {/* ── Desktop: Horizontal Tree ── */}
      <div className="hidden lg:block">
        <DesktopBracket {...data} />
      </div>

      {/* ── Mobile: Vertical List ── */}
      <div className="lg:hidden px-3 pb-6">
        <MobileBracket {...data} />
      </div>
    </div>
  );
}