'use client';

import { useWorldCupStore } from '@/store/worldCupStore';
import { getTeamName } from '@/lib/standings';
import { getSlotLabel } from '@/lib/bracketResolver';
import FlagIcon from './FlagIcon';
import { cn } from '@/lib/utils';

const ROUND_LABELS: Record<string, string> = {
  r32: '32-avos',
  r16: 'Oitavas',
  qf: 'Quartas',
  sf: 'Semifinais',
  third_place: '3° Lugar',
  final: 'Final',
};

export default function KnockoutBracket() {
  const { bracket, setEditingMatch } = useWorldCupStore();
  if (!bracket) return <p className="text-center text-muted-foreground py-8">Carregando chaveamento...</p>;

  return (
    <div className="space-y-6">
      {/* Mobile: linear list view */}
      <div className="lg:hidden space-y-3">
        <BracketListView bracket={bracket} onEdit={setEditingMatch} />
      </div>

      {/* Desktop: visual bracket */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="min-w-[1100px] p-4">
          <div className="flex gap-2 items-stretch">
            {/* R32 */}
            <BracketRound
              title="32-avos de final"
              matches={bracket.r32}
              onEdit={setEditingMatch}
              className="flex-shrink-0"
            />
            {/* R16 */}
            <BracketRound
              title="Oitavas"
              matches={bracket.r16}
              onEdit={setEditingMatch}
              className="flex-shrink-0"
            />
            {/* QF */}
            <BracketRound
              title="Quartas"
              matches={bracket.qf}
              onEdit={setEditingMatch}
              className="flex-shrink-0"
            />
            {/* SF + Final */}
            <div className="flex flex-col gap-2 flex-shrink-0 w-[220px]">
              <BracketRound
                title="Semifinais"
                matches={bracket.sf}
                onEdit={setEditingMatch}
              />
              <BracketSingleMatch
                match={bracket.thirdPlace}
                onEdit={setEditingMatch}
                label="3° Lugar"
              />
              <BracketSingleMatch
                match={bracket.final}
                onEdit={setEditingMatch}
                label="Final"
                highlight
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BracketRound({
  title, matches, onEdit, className = ''
}: {
  title: string;
  matches: { id: string; round: string; homeTeam: string | null; awayTeam: string | null; homeSlot: string; awaySlot: string; homeScore: number | null; awayScore: number | null; venue: string; city: string; date: string }[];
  onEdit: (id: string) => void;
  className?: string;
}) {
  const spacing = matches.length <= 2 ? 'gap-16' : matches.length <= 4 ? 'gap-8' : matches.length <= 8 ? 'gap-4' : 'gap-2';
  return (
    <div className={cn('w-[220px]', className)}>
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center">{title}</h3>
      <div className={cn('flex flex-col justify-around h-full', spacing)}>
        {matches.map(m => (
          <BracketMatchCard key={m.id} match={m} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

function BracketSingleMatch({
  match, onEdit, label, highlight = false
}: {
  match: { id: string; homeTeam: string | null; awayTeam: string | null; homeSlot: string; awaySlot: string; homeScore: number | null; awayScore: number | null; venue: string; city: string; date: string };
  onEdit: (id: string) => void;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('rounded-lg border p-2', highlight && 'border-yellow-500/50 bg-yellow-500/5')}>
      <div className="text-[10px] font-bold text-center text-muted-foreground mb-1">{label}</div>
      <BracketMatchCard match={match} onEdit={onEdit} compact />
    </div>
  );
}

function BracketMatchCard({
  match, onEdit, compact = false
}: {
  match: { id: string; homeTeam: string | null; awayTeam: string | null; homeSlot: string; awaySlot: string; homeScore: number | null; awayScore: number | null; venue: string; city: string; date: string };
  onEdit: (id: string) => void;
  compact?: boolean;
}) {
  const homeLabel = match.homeTeam ? getTeamName(match.homeTeam) : getSlotLabel(match.homeSlot);
  const awayLabel = match.awayTeam ? getTeamName(match.awayTeam) : getSlotLabel(match.awaySlot);
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const hasTeams = match.homeTeam !== null && match.awayTeam !== null;

  return (
    <button
      onClick={() => onEdit(match.id)}
      className={cn(
        'w-full rounded-md border text-left transition-colors',
        hasScore ? 'bg-card hover:bg-accent/50 border-border/50' : 'bg-card hover:bg-accent border-border',
        compact ? 'p-1.5' : 'p-2',
        !hasTeams && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-1">
        {match.homeTeam && <FlagIcon teamId={match.homeTeam} size={16} />}
        <span className={cn('flex-1 truncate', compact ? 'text-[10px]' : 'text-xs', match.homeTeam && 'font-medium')}>
          {homeLabel}
        </span>
        {hasScore && <span className={cn('font-bold', compact ? 'text-[10px]' : 'text-xs')}>{match.homeScore}</span>}
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        {match.awayTeam && <FlagIcon teamId={match.awayTeam} size={16} />}
        <span className={cn('flex-1 truncate', compact ? 'text-[10px]' : 'text-xs', match.awayTeam && 'font-medium')}>
          {awayLabel}
        </span>
        {hasScore && <span className={cn('font-bold', compact ? 'text-[10px]' : 'text-xs')}>{match.awayScore}</span>}
      </div>
      {!compact && (
        <div className="text-[9px] text-muted-foreground mt-1 truncate">
          {match.venue} · {match.date.slice(5)}
        </div>
      )}
    </button>
  );
}

// Mobile linear list
function BracketListView({
  bracket, onEdit
}: {
  bracket: ReturnType<typeof useWorldCupStore.getState>['bracket'];
  onEdit: (id: string) => void;
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
          <div className="bg-primary/10 px-3 py-1.5">
            <span className="font-bold text-xs">{round.title}</span>
          </div>
          <div className="divide-y">
            {round.matches.map(m => (
              <MobileMatchRow key={m.id} match={m} onEdit={onEdit} />
            ))}
          </div>
        </div>
      ))}

      {/* Third place & Final */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-yellow-500/10 px-3 py-1.5">
          <span className="font-bold text-xs">Decisões</span>
        </div>
        <div className="divide-y">
          <MobileMatchRow match={bracket.thirdPlace} onEdit={onEdit} />
          <MobileMatchRow match={bracket.final} onEdit={onEdit} highlight />
        </div>
      </div>
    </div>
  );
}

function MobileMatchRow({
  match, onEdit, highlight = false
}: {
  match: { id: string; homeTeam: string | null; awayTeam: string | null; homeSlot: string; awaySlot: string; homeScore: number | null; awayScore: number | null; venue: string; city: string; date: string };
  onEdit: (id: string) => void;
  highlight?: boolean;
}) {
  const homeLabel = match.homeTeam ? getTeamName(match.homeTeam) : getSlotLabel(match.homeSlot);
  const awayLabel = match.awayTeam ? getTeamName(match.awayTeam) : getSlotLabel(match.awaySlot);
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <button
      onClick={() => onEdit(match.id)}
      className={cn(
        'w-full flex items-center gap-2 p-3 text-left transition-colors',
        highlight && 'bg-yellow-500/5',
        'hover:bg-accent/50'
      )}
    >
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.homeTeam && <FlagIcon teamId={match.homeTeam} size={20} />}
          <span className="text-sm font-medium truncate">{homeLabel}</span>
        </div>
        <div className="text-center shrink-0">
          {hasScore ? (
            <span className="text-sm font-bold">{match.homeScore} × {match.awayScore}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{match.date.slice(5)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="text-sm font-medium truncate">{awayLabel}</span>
          {match.awayTeam && <FlagIcon teamId={match.awayTeam} size={20} />}
        </div>
      </div>
    </button>
  );
}