'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
interface PlayerStat {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamAbbr: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  appearances: number;
}

type SortKey = 'goals' | 'assists' | 'yellowCards' | 'redCards';
type TabId = 'scorers' | 'assists' | 'cards';

// ── Sub-tabs ──────────────────────────────────────────────────────────
const SUBTABS: { id: TabId; label: string; sortKey: SortKey; icon: typeof BarChart3 }[] = [
  { id: 'scorers', label: 'Artilharia', sortKey: 'goals', icon: TrendingUp },
  { id: 'assists', label: 'Assistencias', sortKey: 'assists', icon: BarChart3 },
  { id: 'cards', label: 'Cartoes', sortKey: 'yellowCards', icon: AlertTriangle },
];

// ── Main component ────────────────────────────────────────────────────
export default function StatsTab() {
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('scorers');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/espn-stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data.all ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const tabConfig = SUBTABS.find(t => t.id === activeTab)!;

  const sorted = [...stats].sort((a, b) => {
    const av = a[tabConfig.sortKey];
    const bv = b[tabConfig.sortKey];
    if (activeTab === 'cards') {
      // Cards: red cards first, then yellow cards
      if (b.redCards !== a.redCards) return b.redCards - a.redCards;
      return bv - av;
    }
    // Scorers: goals desc, then assists desc
    // Assists: assists desc, then goals desc
    if (activeTab === 'scorers') {
      if (bv !== av) return bv - av;
      return b.assists - a.assists;
    }
    if (activeTab === 'assists') {
      if (bv !== av) return bv - av;
      return b.goals - a.goals;
    }
    return bv - av;
  });

  const filtered = sorted.filter(p => {
    if (activeTab === 'scorers') return p.goals > 0;
    if (activeTab === 'assists') return p.assists > 0;
    return p.yellowCards > 0 || p.redCards > 0;
  });

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="relative px-6 pt-5 pb-4 text-center">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-fifa-gold to-transparent" />
          <div className="flex items-center justify-center gap-3">
            <BarChart3 className="w-5 h-5 text-fifa-gold" />
            <h2 className="text-xl font-extrabold tracking-[0.2em] text-fifa-gold uppercase">
              Estatisticas
            </h2>
            <BarChart3 className="w-5 h-5 text-fifa-gold" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            FIFA World Cup 2026 &mdash; Dados da ESPN
          </p>
        </div>

        {/* ── Sub-tabs ── */}
        <div className="flex border-b border-border/50">
          {SUBTABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2',
                  activeTab === tab.id
                    ? 'border-fifa-gold text-fifa-gold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div className="p-3 sm:p-4">
          {loading && !stats.length ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-8 h-8 text-fifa-gold animate-spin" />
              <p className="text-sm text-muted-foreground">Carregando estatisticas da ESPN...</p>
              <p className="text-xs text-muted-foreground/60">Primeira carga pode demorar ~30s</p>
            </div>
          ) : error && !stats.length ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={fetchStats}
                className="mt-3 px-4 py-2 bg-fifa-gold/10 text-fifa-gold rounded-lg text-sm font-semibold hover:bg-fifa-gold/20 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Refresh */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={fetchStats}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-fifa-gold transition-colors"
                >
                  <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
                  Atualizar
                </button>
              </div>

              {/* Table */}
              <div className="rounded-xl border border-border/50 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[2.5rem_1fr_4.5rem_4.5rem_4.5rem_4.5rem] sm:grid-cols-[2.5rem_1fr_5rem_5rem_5rem_5rem] bg-muted/50 px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <span className="text-center">#</span>
                  <span>Jogador</span>
                  {activeTab === 'scorers' && (
                    <>
                      <span className="text-center">G</span>
                      <span className="text-center">A</span>
                      <span className="text-center hidden sm:block">CA</span>
                      <span className="text-center hidden sm:block">CV</span>
                    </>
                  )}
                  {activeTab === 'assists' && (
                    <>
                      <span className="text-center">A</span>
                      <span className="text-center">G</span>
                      <span className="text-center hidden sm:block">CA</span>
                      <span className="text-center hidden sm:block">CV</span>
                    </>
                  )}
                  {activeTab === 'cards' && (
                    <>
                      <span className="text-center">CA</span>
                      <span className="text-center">CV</span>
                      <span className="text-center hidden sm:block">G</span>
                      <span className="text-center hidden sm:block">A</span>
                    </>
                  )}
                </div>

                {/* Rows */}
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Nenhum dado disponivel ainda
                  </div>
                ) : (
                  filtered.slice(0, 50).map((p, i) => (
                    <div
                      key={p.playerId}
                      className={cn(
                        'grid grid-cols-[2.5rem_1fr_4.5rem_4.5rem_4.5rem_4.5rem] sm:grid-cols-[2.5rem_1fr_5rem_5rem_5rem_5rem] items-center px-3 py-2.5 border-t border-border/30 transition-colors hover:bg-muted/30',
                        i < 3 && activeTab === 'scorers' && 'bg-fifa-gold/5',
                      )}
                    >
                      {/* Rank */}
                      <span className={cn(
                        'text-center text-sm font-bold',
                        i === 0 && activeTab === 'scorers' && 'text-fifa-gold',
                        i === 1 && activeTab === 'scorers' && 'text-fifa-gold/70',
                        i === 2 && activeTab === 'scorers' && 'text-fifa-gold/50',
                        i > 2 && 'text-muted-foreground',
                      )}>
                        {i + 1}
                      </span>

                      {/* Player name + team */}
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-foreground block truncate">
                          {p.playerName}
                        </span>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {p.teamName}
                        </span>
                      </div>

                      {/* Stats columns */}
                      {activeTab === 'scorers' && (
                        <>
                          <StatCell value={p.goals} highlight={p.goals > 0} bold />
                          <StatCell value={p.assists} highlight={p.assists > 0} />
                          <StatCell value={p.yellowCards} highlight={false} className="hidden sm:block" />
                          <StatCell value={p.redCards} highlight={p.redCards > 0} red className="hidden sm:block" />
                        </>
                      )}
                      {activeTab === 'assists' && (
                        <>
                          <StatCell value={p.assists} highlight={p.assists > 0} bold />
                          <StatCell value={p.goals} highlight={p.goals > 0} />
                          <StatCell value={p.yellowCards} highlight={false} className="hidden sm:block" />
                          <StatCell value={p.redCards} highlight={p.redCards > 0} red className="hidden sm:block" />
                        </>
                      )}
                      {activeTab === 'cards' && (
                        <>
                          <StatCell value={p.yellowCards} highlight={p.yellowCards > 0} yellow />
                          <StatCell value={p.redCards} highlight={p.redCards > 0} red />
                          <StatCell value={p.goals} highlight={p.goals > 0} className="hidden sm:block" />
                          <StatCell value={p.assists} highlight={p.assists > 0} className="hidden sm:block" />
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {filtered.length > 50 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Mostrando 50 de {filtered.length} jogadores
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stat cell ─────────────────────────────────────────────────────────
function StatCell({
  value,
  highlight = false,
  bold = false,
  red = false,
  yellow = false,
  className = '',
}: {
  value: number;
  highlight?: boolean;
  bold?: boolean;
  red?: boolean;
  yellow?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'text-center text-sm tabular-nums',
        className,
        bold && 'font-bold',
        highlight && 'text-foreground font-semibold',
        red && 'text-red-500 font-bold',
        yellow && 'text-yellow-500',
        !highlight && !red && !yellow && !bold && 'text-muted-foreground',
      )}
    >
      {value || '-'}
    </span>
  );
}