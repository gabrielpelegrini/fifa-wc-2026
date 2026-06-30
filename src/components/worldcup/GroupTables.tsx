'use client';

import { useWorldCupStore } from '@/store/worldCupStore';
import { getTeamName, isPlaceholder } from '@/lib/standings';
import FlagIcon from './FlagIcon';
import { cn } from '@/lib/utils';
import { TEAMS } from '@/data/worldcup';
import { useFavorites, ShareButton, TopScorersPanel, FavoritesPanel } from './Engagement';

export default function GroupTables() {
  const { allStandings, thirdPlaceRanking } = useWorldCupStore();
  const { favorites, isFavorite, toggle, loaded } = useFavorites();

  return (
    <div className="space-y-6">
      {/* Engagement panels */}
      {loaded && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FavoritesPanel favorites={favorites} isFavorite={isFavorite} onToggle={toggle} />
          <TopScorersPanel />
        </div>
      )}

      {['A','B','C','D','E','F','G','H','I','J','K','L'].map(groupId => {
        const standings = allStandings.get(groupId);
        if (!standings) return null;

        return (
          <div key={groupId} className="rounded-lg border bg-card overflow-hidden">
            <div className="bg-fifa-green/10 px-4 py-2 flex items-center justify-between">
              <span className="font-bold text-sm">Grupo {groupId}</span>
              <span className="text-xs text-muted-foreground">
                {TEAMS[standings[0]?.teamId] && !TEAMS[standings[0].teamId]?.isPlaceholder
                  ? '✓ Times confirmados'
                  : '⏳ Composição pendente'
                }
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-2 px-2 w-8">#</th>
                    <th className="text-left py-2 px-1">Seleção</th>
                    <th className="text-center py-2 px-1 w-8">J</th>
                    <th className="text-center py-2 px-1 w-8">V</th>
                    <th className="text-center py-2 px-1 w-8">E</th>
                    <th className="text-center py-2 px-1 w-8">D</th>
                    <th className="text-center py-2 px-1 w-8">GP</th>
                    <th className="text-center py-2 px-1 w-8">GC</th>
                    <th className="text-center py-2 px-1 w-8">SG</th>
                    <th className="text-center py-2 px-1 w-10 font-bold">Pts</th>
                    {loaded && <th className="w-8" />}
                  </tr>
                </thead>
                <tbody>
                  {standings.map(s => {
                    const qualified = s.position <= 2;
                    const possibleThird = s.position === 3;
                    const ph = isPlaceholder(s.teamId);
                    const fav = isFavorite(s.teamId);

                    return (
                      <tr
                        key={s.teamId}
                        className={cn(
                          'border-b last:border-0 transition-colors',
                          qualified && 'bg-green-500/10 dark:bg-green-500/5',
                          possibleThird && 'bg-yellow-500/10 dark:bg-yellow-500/5',
                          ph && 'opacity-60',
                          fav && 'bg-fifa-gold/5'
                        )}
                      >
                        <td className="py-2 px-2 text-center">
                          <span className={cn(
                            'inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold',
                            qualified && 'bg-fifa-green text-primary-foreground',
                            possibleThird && 'bg-fifa-gold/80 text-white',
                            !qualified && !possibleThird && 'bg-muted text-muted-foreground'
                          )}
                          role="status"
                          aria-label={qualified ? `${s.position}o lugar, classificado para mata-mata` : possibleThird ? `${s.position}o lugar, possivel classificacao como terceiro` : `${s.position}o lugar, eliminado`}
                        >
                            {s.position}
                          </span>
                        </td>
                        <td className="py-2 px-1">
                          <div className="flex items-center gap-1.5">
                            <FlagIcon teamId={s.teamId} size={20} />
                            <span className="font-medium">{getTeamName(s.teamId)}</span>
                            {qualified && (
                              <span className="text-[11px] text-fifa-green dark:text-fifa-green hidden sm:inline">
                                R32
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-2 px-1">{s.played}</td>
                        <td className="text-center py-2 px-1">{s.won}</td>
                        <td className="text-center py-2 px-1">{s.drawn}</td>
                        <td className="text-center py-2 px-1">{s.lost}</td>
                        <td className="text-center py-2 px-1">{s.goalsFor}</td>
                        <td className="text-center py-2 px-1">{s.goalsAgainst}</td>
                        <td className="text-center py-2 px-1">{s.goalDiff > 0 ? '+' : ''}{s.goalDiff}</td>
                        <td className="text-center py-2 px-1 font-bold">{s.points}</td>
                        {loaded && (
                          <td className="py-2 px-1">
                            <button
                              onClick={() => toggle(s.teamId)}
                              className="p-0.5 hover:scale-125 transition-transform"
                              aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            >
                              <svg
                                className={cn('h-3.5 w-3.5 transition-colors', fav ? 'text-fifa-gold fill-fifa-gold' : 'text-muted-foreground/30 hover:text-fifa-gold/50')}
                                viewBox="0 0 24 24"
                                fill={fav ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Third place ranking */}
      <ThirdPlaceSection thirds={thirdPlaceRanking} />
    </div>
  );
}

function ThirdPlaceSection({ thirds }: { thirds: ReturnType<typeof useWorldCupStore.getState>['thirdPlaceRanking'] }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="bg-fifa-gold/10 px-4 py-2">
        <span className="font-bold text-sm">Ranking dos Terceiros Colocados</span>
        <span className="text-xs text-muted-foreground ml-2">(8 melhores classificam)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left py-2 px-2 w-8">#</th>
              <th className="text-left py-2 px-1">Seleção</th>
              <th className="text-center py-2 px-1">Grupo</th>
              <th className="text-center py-2 px-1">Pts</th>
              <th className="text-center py-2 px-1">SG</th>
              <th className="text-center py-2 px-1">GP</th>
              <th className="text-center py-2 px-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {thirds.map(t => (
              <tr
                key={t.teamId}
                className={cn(
                  'border-b last:border-0',
                  t.qualified && 'bg-fifa-green/10 dark:bg-fifa-green/5'
                )}
              >
                <td className="py-2 px-2 text-center">
                  <span className={cn(
                    'inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold',
                    t.qualified ? 'bg-fifa-green text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {t.rank}
                  </span>
                </td>
                <td className="py-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <FlagIcon teamId={t.teamId} size={20} />
                    <span className="font-medium">{getTeamName(t.teamId)}</span>
                  </div>
                </td>
                <td className="text-center py-2 px-1 font-mono">{t.groupId}</td>
                <td className="text-center py-2 px-1">{t.points}</td>
                <td className="text-center py-2 px-1">{t.goalDiff > 0 ? '+' : ''}{t.goalDiff}</td>
                <td className="text-center py-2 px-1">{t.goalsFor}</td>
                <td className="text-center py-2 px-1">
                  {t.qualified ? (
                    <span className="text-fifa-green text-[11px] font-semibold">CLASSIFICADO</span>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">Eliminado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}