'use client';

import { useState } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';
import { TEAMS, BRACKET_CONFIG } from '@/data/worldcup';
import { getTeamName } from '@/lib/standings';
import { getCrossoverPath, getSlotLabel } from '@/lib/bracketResolver';
import FlagIcon from './FlagIcon';

export default function CrossoverPredictor() {
  const { allStandings, thirdPlaceRanking } = useWorldCupStore();
  const [selectedTeam, setSelectedTeam] = useState<string>('brazil');

  const realTeams = Object.entries(TEAMS)
    .filter(([, t]) => !t.isPlaceholder)
    .map(([id, t]) => ({ id, name: t.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Find which group this team is in and its current position
  let teamInfo: { groupId: string; position: number; standing: { played: number; won: number; drawn: number; lost: number; points: number } } | null = null;
  for (const [gId, standings] of allStandings) {
    const s = standings.find(s => s.teamId === selectedTeam);
    if (s) {
      teamInfo = { groupId: gId, position: s.position, standing: s };
      break;
    }
  }

  // Calculate crossover paths
  let crossover: { r32MatchId: string; r32Slot: string; opponentSlot: string; path: string[]; posLabel: string }[] | null = null;
  if (teamInfo) {
    const paths: { r32MatchId: string; r32Slot: string; opponentSlot: string; path: string[]; posLabel: string }[] = [];
    // Calculate path for each possible finishing position
    if (teamInfo.position === 1 || teamInfo.standing.played === 0) {
      const p = getCrossoverPath(selectedTeam, teamInfo.groupId, 1);
      if (p) paths.push({ ...p, posLabel: '1° colocado' });
    }
    if (teamInfo.position === 2 || teamInfo.standing.played === 0) {
      const p = getCrossoverPath(selectedTeam, teamInfo.groupId, 2);
      if (p) paths.push({ ...p, posLabel: '2° colocado' });
    }
    // Third place path
    const thirdEntry = thirdPlaceRanking.find(t => t.teamId === selectedTeam);
    if (thirdEntry) {
      const poolSlot = findThirdPlacePool(teamInfo.groupId, thirdEntry.rank);
      if (poolSlot) {
        const r32Match = BRACKET_CONFIG.r32.find(
          m => m.homeSlot === poolSlot || m.awaySlot === poolSlot
        );
        if (r32Match) {
          paths.push({
            r32MatchId: r32Match.id,
            r32Slot: poolSlot,
            opponentSlot: r32Match.homeSlot === poolSlot ? r32Match.awaySlot : r32Match.homeSlot,
            path: buildPathFromMatch(r32Match.id),
            posLabel: `3° colocado (${thirdEntry.qualified ? 'classificado' : 'não classificado'})`,
          });
        }
      }
    }
    crossover = paths;
  }

  if (!teamInfo) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Selecione uma seleção para ver os cruzamentos possíveis.
      </div>
    );
  }

  const team = TEAMS[selectedTeam];

  return (
    <div className="space-y-4">
      {/* Team selector */}
      <div className="rounded-lg border bg-card p-3">
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Selecione uma seleção</label>
        <select
          value={selectedTeam}
          onChange={e => setSelectedTeam(e.target.value)}
          className="w-full bg-background border rounded-md px-3 py-2 text-sm"
        >
          {realTeams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Current standing */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3 mb-2">
          <FlagIcon teamId={selectedTeam} size={36} />
          <div>
            <h3 className="font-bold text-lg">{team.name}</h3>
            <p className="text-sm text-muted-foreground">
              Grupo {teamInfo.groupId} · {teamInfo.position}° colocado · {teamInfo.standing.points} pts
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
          <div className="rounded bg-muted p-2">
            <div className="font-bold text-lg">{teamInfo.standing.won}</div>
            <div className="text-muted-foreground">Vitórias</div>
          </div>
          <div className="rounded bg-muted p-2">
            <div className="font-bold text-lg">{teamInfo.standing.drawn}</div>
            <div className="text-muted-foreground">Empates</div>
          </div>
          <div className="rounded bg-muted p-2">
            <div className="font-bold text-lg">{teamInfo.standing.lost}</div>
            <div className="text-muted-foreground">Derrotas</div>
          </div>
        </div>
      </div>

      {/* Possible paths */}
      {crossover && crossover.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm">Cruzamentos Possíveis</h3>
          {crossover.map((path, i) => (
            <PathCard key={i} path={path} teamId={selectedTeam} groupId={teamInfo.groupId} />
          ))}
        </div>
      )}

      {crossover && crossover.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Esta seleção ainda não possui caminho definido no mata-mata.
        </p>
      )}
    </div>
  );
}

function PathCard({
  path, teamId, groupId
}: {
  path: NonNullable<ReturnType<typeof getCrossoverPath>> & { posLabel: string };
  teamId: string;
  groupId: string;
}) {
  const r32Match = BRACKET_CONFIG.r32.find(m => m.id === path.r32MatchId);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs font-bold text-primary mb-3">{path.posLabel}</div>

      {/* R32 opponent */}
      {r32Match && (
        <div className="mb-3">
          <div className="text-[11px] text-muted-foreground uppercase mb-1">Na fase dos 32-avos:</div>
          <div className="flex items-center gap-2 text-sm">
            <FlagIcon teamId={teamId} size={18} />
            <span className="font-medium">{getTeamName(teamId)}</span>
            <span className="text-muted-foreground">×</span>
            <span className="font-medium">{getSlotLabel(path.opponentSlot)}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {r32Match.venue} · {r32Match.date}
          </div>
        </div>
      )}

      {/* Path visualization */}
      {path.path.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] text-muted-foreground">Caminho:</span>
          {path.path.map((step, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground text-[11px]">→</span>}
              <span className="inline-block rounded bg-muted px-2 py-0.5 text-[11px] font-medium">
                {step.replace('R32', '32-avos').replace('R16', 'Oitavas').replace('QF', 'Quartas').replace('SF', 'Semi').replace('FINAL', 'Final')}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function findThirdPlacePool(groupId: string, rank: number): string | null {
  // Map each group to the R32 third-place pool slots it belongs to
  // Each pool has 5 groups; each group appears in multiple pools
  // FIFA uses a 495-row lookup table for exact assignment
  const groupToPool: Record<string, string[]> = {
    'A': ['3_ABCDF', '3_CEFHI', '3_AEHIJ'],
    'B': ['3_ABCDF', '3_BEFIJ'],
    'C': ['3_ABCDF', '3_CDFGH', '3_CEFHI'],
    'D': ['3_ABCDF', '3_CDFGH', '3_BEFIJ', '3_DEIJL'],
    'E': ['3_CEFHI', '3_EHIJK', '3_BEFIJ', '3_AEHIJ', '3_EFGIJ', '3_DEIJL'],
    'F': ['3_ABCDF', '3_CDFGH', '3_CEFHI', '3_BEFIJ', '3_EFGIJ'],
    'G': ['3_CDFGH', '3_AEHIJ', '3_EFGIJ'],
    'H': ['3_CDFGH', '3_CEFHI', '3_EHIJK', '3_AEHIJ'],
    'I': ['3_CDFGH', '3_CEFHI', '3_EHIJK', '3_BEFIJ', '3_AEHIJ', '3_EFGIJ', '3_DEIJL'],
    'J': ['3_EHIJK', '3_BEFIJ', '3_AEHIJ', '3_EFGIJ', '3_DEIJL'],
    'K': ['3_EHIJK', '3_DEIJL'],
    'L': ['3_EHIJK', '3_DEIJL'],
  };

  const pools = groupToPool[groupId];
  if (!pools) return null;

  // For display: show the first pool this group belongs to.
  // The actual assignment depends on FIFA's 495-row lookup table.
  if (rank <= 8) return pools[0];
  return null;
}

function buildPathFromMatch(matchId: string): string[] {
  const path: string[] = [matchId];

  const r16 = BRACKET_CONFIG.r16.find(m => m.feederHome === matchId || m.feederAway === matchId);
  if (r16) {
    path.push(r16.id);
    const qf = BRACKET_CONFIG.qf.find(m => m.feederHome === r16.id || m.feederAway === r16.id);
    if (qf) {
      path.push(qf.id);
      const sf = BRACKET_CONFIG.sf.find(m => m.feederHome === qf.id || m.feederAway === qf.id);
      if (sf) {
        path.push(sf.id);
        path.push('FINAL');
      }
    }
  }

  return path;
}