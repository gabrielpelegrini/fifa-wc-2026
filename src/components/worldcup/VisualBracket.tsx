'use client';

import { useMemo } from 'react';
import {
  useWorldCupStore,
  type RawKnockoutEvent,
  type KnockoutLiveEntry,
} from '@/store/worldCupStore';
import { cn } from '@/lib/utils';
import { getTeamName } from '@/lib/standings';
import { ESPN_TO_TEAM } from '@/lib/espnMapping';
import FlagIcon from './FlagIcon';
import { Trophy, Radio, Star, CheckCircle2 } from 'lucide-react';
import { GROUP_MAP } from '@/data/worldcup';
import type { KnockoutMatch } from '@/data/types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const RH = 54; // row height in px (16 rows for R32 base)
const ROWS = 16;
const TOTAL_H = ROWS * RH; // 864px
const COL_W = 178;
const CONN_W = 40;
const CARD_H = 42; // match card height

const GOLD = '#D4AF37';
const GOLD_MID = 'rgba(212,175,55,0.50)';
const GOLD_DIM = 'rgba(212,175,55,0.25)';
const DARK_BG = 'bg-gray-950';

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

/** Get all possible team IDs that could fill a given slot. */
function getSlotTeams(slot: string, allMatches: MatchDisplay[]): Set<string> {
  // Group winner: "1A"
  const m1 = slot.match(/^1([A-L])$/);
  if (m1) {
    const g = GROUP_MAP[m1[1]];
    return g ? new Set(g.teams) : new Set();
  }
  // Group runner-up: "2B"
  const m2 = slot.match(/^2([A-L])$/);
  if (m2) {
    const g = GROUP_MAP[m2[1]];
    return g ? new Set(g.teams) : new Set();
  }
  // Third place pool: "3_ABCDF"
  const m3 = slot.match(/^3_([A-L]+)$/);
  if (m3) {
    const teams = new Set<string>();
    for (const ch of m3[1]) {
      const g = GROUP_MAP[ch];
      if (g) g.teams.forEach((t) => teams.add(t));
    }
    return teams;
  }
  // Feeder match: "V(R32-01)" or "P(SF-01)"
  const mV = slot.match(/^[VP]\((.+?)\)$/);
  if (mV) {
    const feeder = allMatches.find((m) => m.id === mV[1]);
    const teams = new Set<string>();
    if (feeder) {
      if (feeder.homeTeamId) teams.add(feeder.homeTeamId);
      if (feeder.awayTeamId) teams.add(feeder.awayTeamId);
    }
    return teams;
  }
  return new Set();
}

/** Try to resolve an unresolved match's teams from raw ESPN knockout events. */
function tryResolveFromRaw(
  match: {
    homeTeam: string | null;
    awayTeam: string | null;
    homeSlot: string;
    awaySlot: string;
  },
  rawEvents: RawKnockoutEvent[],
  allMatches: MatchDisplay[],
): { homeTeamId: string | null; awayTeamId: string | null } {
  if (match.homeTeam && match.awayTeam) {
    return { homeTeamId: match.homeTeam, awayTeamId: match.awayTeam };
  }

  const homePossible = getSlotTeams(match.homeSlot, allMatches);
  const awayPossible = getSlotTeams(match.awaySlot, allMatches);

  for (const evt of rawEvents) {
    const hId = ESPN_TO_TEAM[evt.homeAbbr];
    const aId = ESPN_TO_TEAM[evt.awayAbbr];
    if (!hId || !aId) continue;

    // Direct match
    if (homePossible.has(hId) && awayPossible.has(aId)) {
      return { homeTeamId: hId, awayTeamId: aId };
    }
    // Reversed
    if (homePossible.has(aId) && awayPossible.has(hId)) {
      return { homeTeamId: aId, awayTeamId: hId };
    }
  }

  return { homeTeamId: match.homeTeam, awayTeamId: match.awayTeam };
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
): MatchDisplay {
  const live = liveInfo[m.id];
  const hasLive = live && (live.status === 'live' || live.status === 'finished');

  let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
  if (live) {
    status = live.status;
  } else if (m.homeScore !== null && m.awayScore !== null) {
    status = 'finished';
  }

  return {
    id: m.id,
    round: m.round,
    homeTeamId: m.homeTeam,
    awayTeamId: m.awayTeam,
    homeLabel: m.homeTeam ? getTeamName(m.homeTeam) : formatSlot(m.homeSlot),
    awayLabel: m.awayTeam ? getTeamName(m.awayTeam) : formatSlot(m.awaySlot),
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

/** Two-pass enrichment: first build base, then resolve unresolved teams from raw events. */
function buildEnrichedBracket(
  bracket: NonNullable<ReturnType<typeof useWorldCupStore.getState>['bracket']>,
  liveInfo: Record<string, KnockoutLiveEntry>,
  liveMatches: Record<string, number>,
  rawEvents: RawKnockoutEvent[],
) {
  // Pass 1: base enrichment from bracket + live data
  const allFlat: MatchDisplay[] = [
    ...bracket.r32.map((m) => enrichMatch(m, liveInfo, liveMatches)),
    ...bracket.r16.map((m) => enrichMatch(m, liveInfo, liveMatches)),
    ...bracket.qf.map((m) => enrichMatch(m, liveInfo, liveMatches)),
    ...bracket.sf.map((m) => enrichMatch(m, liveInfo, liveMatches)),
    enrichMatch(bracket.thirdPlace, liveInfo, liveMatches),
    enrichMatch(bracket.final, liveInfo, liveMatches),
  ];

  // Pass 2: resolve unresolved teams from raw ESPN events
  const resolved = allFlat.map((m) => {
    if (m.homeTeamId && m.awayTeamId) return m;
    const { homeTeamId, awayTeamId } = tryResolveFromRaw(
      { homeTeam: m.homeTeamId, awayTeam: m.awayTeamId, homeSlot: m.homeSlot, awaySlot: m.awaySlot },
      rawEvents,
      allFlat,
    );
    const finalHome = homeTeamId || m.homeTeamId;
    const finalAway = awayTeamId || m.awayTeamId;
    return {
      ...m,
      homeTeamId: finalHome,
      awayTeamId: finalAway,
      homeLabel: finalHome ? getTeamName(finalHome) : formatSlot(m.homeSlot),
      awayLabel: finalAway ? getTeamName(finalAway) : formatSlot(m.awaySlot),
    };
  });

  // Partition by round field (no fragile hardcoded slice indices)
  const byRound = new Map<string, MatchDisplay[]>();
  for (const m of resolved) {
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
        isFinal ? 'p-2' : 'p-1.5',
        isLive && 'bg-red-950/30 border-red-500/50 live-glow',
        isFinished && hasScore && !isLive && 'bg-gray-900 border-[#D4AF37]/40',
        !isLive && !isFinished && 'bg-gray-900/80 border-gray-800/50',
        !hasTeams && 'opacity-35',
        isFinal && isFinished && hasScore && 'ring-1 ring-[#D4AF37]/30',
      )}
    >
      {/* Home team row */}
      <div className="flex items-center gap-1.5" style={{ height: isFinal ? 22 : 18 }}>
        {match.homeTeamId ? (
          <FlagIcon teamId={match.homeTeamId} size={isFinal ? 22 : 16} />
        ) : (
          <div className="w-4 h-4 flex-shrink-0" />
        )}
        <span
          className={cn(
            'flex-1 truncate leading-tight',
            isFinal ? 'text-xs' : 'text-[11px]',
            isFinished && homeWinner && 'text-fifa-green font-bold',
            !isFinished && match.homeTeamId && 'text-gray-200 font-medium',
            !match.homeTeamId && 'text-gray-500 italic',
            isLive && match.homeTeamId && 'text-white',
          )}
        >
          {match.homeLabel}
        </span>
        {hasScore && (
          <span
            className={cn(
              'font-bold tabular-nums min-w-[14px] text-right',
              isFinal ? 'text-sm' : 'text-[11px]',
              isFinished && homeWinner && 'text-fifa-green',
              isLive && 'text-white',
            )}
          >
            {match.homeScore}
          </span>
        )}
      </div>

      {/* Away team row */}
      <div className="flex items-center gap-1.5 mt-0.5" style={{ height: isFinal ? 22 : 18 }}>
        {match.awayTeamId ? (
          <FlagIcon teamId={match.awayTeamId} size={isFinal ? 22 : 16} />
        ) : (
          <div className="w-4 h-4 flex-shrink-0" />
        )}
        <span
          className={cn(
            'flex-1 truncate leading-tight',
            isFinal ? 'text-xs' : 'text-[11px]',
            isFinished && awayWinner && 'text-fifa-green font-bold',
            !isFinished && match.awayTeamId && 'text-gray-200 font-medium',
            !match.awayTeamId && 'text-gray-500 italic',
            isLive && match.awayTeamId && 'text-white',
          )}
        >
          {match.awayLabel}
        </span>
        {hasScore && (
          <span
            className={cn(
              'font-bold tabular-nums min-w-[14px] text-right',
              isFinal ? 'text-sm' : 'text-[11px]',
              isFinished && awayWinner && 'text-fifa-green',
              isLive && 'text-white',
            )}
          >
            {match.awayScore}
          </span>
        )}
      </div>

      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center gap-1 mt-1" role="status" aria-label={`Ao vivo, minuto ${match.liveMinute ?? 0}`}>
          <Radio className="w-2.5 h-2.5 text-red-400 animate-pulse" />
          <span className="text-[11px] font-bold text-red-400 tracking-wide">
            {match.liveMinute && match.liveMinute > 0 ? `${match.liveMinute}'` : 'AO VIVO'}
            {match.displayClock && (
              <span className="ml-1 text-red-400/60">{match.displayClock}</span>
            )}
          </span>
        </div>
      )}

      {/* Penalty info */}
      {isPenalty && (
        <div className="text-[11px] text-[#D4AF37] mt-0.5 font-semibold text-center tracking-wide">
          PEN {match.penaltyHome}\u2013{match.penaltyAway}
        </div>
      )}

      {/* Finished check */}
      {isFinished && !isLive && !isFinal && (
        <div className="flex items-center gap-1 mt-0.5 text-gray-600">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span className="text-[11px]">Encerrado</span>
        </div>
      )}

      {/* Final venue */}
      {isFinal && (
        <div className="text-[11px] text-gray-500 mt-1 text-center truncate">
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
      <Star className="w-4 h-4 text-[#D4AF37] opacity-60" />
      <div className="relative">
        <div className="absolute inset-0 blur-md bg-[#D4AF37]/20 rounded-full" />
        <Trophy className="w-14 h-14 text-[#D4AF37] relative" strokeWidth={1.5} />
      </div>
      <Star className="w-4 h-4 text-[#D4AF37] opacity-60" />
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
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
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
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
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
      className="min-w-[1200px] overflow-x-auto"
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
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
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
              <div className="text-[11px] font-bold text-[#D4AF37]/60 text-center mb-1 tracking-wider uppercase">
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
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
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
        'flex items-center gap-2 px-3 py-2.5 border-b border-gray-800/40 last:border-b-0',
        highlight && 'bg-[#D4AF37]/5',
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
            <div className="w-5 h-5 flex-shrink-0 rounded bg-gray-800 flex items-center justify-center">
              <span className="text-[11px] text-gray-600 font-bold">?</span>
            </div>
          )}
          <span
            className={cn(
              'text-[13px] font-medium truncate',
              isFinished && homeWinner && 'text-fifa-green font-bold',
              !match.homeTeamId && 'text-gray-600 italic text-[11px]',
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
                <span className="text-[11px] text-gray-600">&times;</span>
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
                <span className="text-[11px] text-[#D4AF37] font-semibold">
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
            <span className="text-[11px] text-gray-600">{fmtDate(match.date)}</span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span
            className={cn(
              'text-[13px] font-medium truncate text-right',
              isFinished && awayWinner && 'text-fifa-green font-bold',
              !match.awayTeamId && 'text-gray-600 italic text-[11px]',
            )}
          >
            {match.awayLabel}
          </span>
          {match.awayTeamId ? (
            <FlagIcon teamId={match.awayTeamId} size={20} />
          ) : (
            <div className="w-5 h-5 flex-shrink-0 rounded bg-gray-800 flex items-center justify-center">
              <span className="text-[11px] text-gray-600 font-bold">?</span>
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
    <div className="rounded-xl border border-gray-800/50 overflow-hidden">
      <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent px-4 py-2.5 border-b border-gray-800/40">
        <span className="text-xs font-bold tracking-[0.15em] text-[#D4AF37] uppercase">
          {title}
        </span>
        <span className="text-[11px] text-gray-600 ml-2">({matches.length} jogos)</span>
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
      <div className="rounded-xl border border-[#D4AF37]/20 overflow-hidden">
        <div className="bg-gradient-to-r from-[#D4AF37]/15 to-transparent px-4 py-2.5 border-b border-gray-800/40">
          <span className="text-xs font-bold tracking-[0.15em] text-[#D4AF37] uppercase">
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
  const { bracket, knockoutLiveInfo, rawKnockoutEvents, liveMatches } = useWorldCupStore();

  const data = useMemo(() => {
    if (!bracket) return null;
    return buildEnrichedBracket(bracket, knockoutLiveInfo, liveMatches, rawKnockoutEvents);
  }, [bracket, knockoutLiveInfo, liveMatches, rawKnockoutEvents]);

  if (!bracket || !data) {
    return (
      <div className={cn(DARK_BG, 'rounded-2xl p-8 text-center')}>
        <p className="text-gray-500 text-sm">Carregando chaveamento...</p>
      </div>
    );
  }

  return (
    <div className={cn(DARK_BG, 'rounded-2xl overflow-hidden')}>
      {/* ── Title ── */}
      <div className="relative px-6 pt-6 pb-4 text-center">
        {/* Decorative top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        <div className="flex items-center justify-center gap-3">
          <Star className="w-4 h-4 text-[#D4AF37] opacity-70" />
          <Trophy className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-xl font-extrabold tracking-[0.25em] text-[#D4AF37] uppercase">
            Mata-Mata
          </h2>
          <Trophy className="w-5 h-5 text-[#D4AF37]" />
          <Star className="w-4 h-4 text-[#D4AF37] opacity-70" />
        </div>
        <p className="text-[11px] text-gray-500 mt-1 tracking-wide">
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