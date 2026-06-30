'use client';

import { useState, useEffect } from 'react';
import { TEAMS } from '@/data/worldcup';
import { getTeamName } from '@/lib/standings';
import FlagIcon from './FlagIcon';
import { Star, Share2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Favorite Teams (localStorage) ──────────────────────────────────

const FAVORITES_KEY = 'wc2026_favorites';

function getFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
    setLoaded(true);
  }, []);

  const toggle = (teamId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      saveFavorites(next);
      return next;
    });
  };

  return { favorites, toggle, isFavorite: (id: string) => favorites.has(id), loaded };
}

// ── Share Result ───────────────────────────────────────────────────

export function useShareResult() {
  const share = (text: string) => {
    const encoded = encodeURIComponent(text);
    // Try Web Share API first, fallback to WhatsApp
    if (navigator.share) {
      navigator.share({ text, title: 'Copa do Mundo FIFA 2026' }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };
  return share;
}

// ── Favorites Panel ────────────────────────────────────────────────

export function FavoritesPanel({
  favorites,
  isFavorite,
  onToggle,
}: {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  if (favorites.size === 0) return null;

  const favTeams = [...favorites].map(id => TEAMS[id]).filter(Boolean);

  return (
    <div className="rounded-xl border border-fifa-gold/20 bg-fifa-gold/5 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Star className="h-3.5 w-3.5 text-fifa-gold fill-fifa-gold" />
        <span className="text-xs font-bold text-fifa-gold-dark dark:text-fifa-gold uppercase tracking-wider">
          Meus Times
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {favTeams.map(team => (
          <button
            key={team.id}
            onClick={() => onToggle(team.id)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-card border border-fifa-gold/20 hover:border-fifa-gold/50 transition-colors"
          >
            <FlagIcon teamId={team.id} size={16} />
            <span className="text-xs font-medium">{team.name}</span>
            <Star className="h-3 w-3 text-fifa-gold fill-fifa-gold" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Top Scorers (Artilharia) ───────────────────────────────────────

interface Scorer {
  teamId: string;
  name: string;
  goals: number;
  assists: number;
}

// Mock data — will be replaced with ESPN data when available
const MOCK_SCORERS: Scorer[] = [
  { teamId: 'france', name: 'Mbappé', goals: 8, assists: 3 },
  { teamId: 'argentina', name: 'Messi', goals: 6, assists: 5 },
  { teamId: 'england', name: 'Kane', goals: 6, assists: 2 },
  { teamId: 'brazil', name: 'Vinícius Jr.', goals: 5, assists: 4 },
  { teamId: 'portugal', name: 'Bruno Fernandes', goals: 4, assists: 4 },
  { teamId: 'germany', name: 'Wirtz', goals: 4, assists: 3 },
  { teamId: 'spain', name: 'Yamal', goals: 4, assists: 2 },
  { teamId: 'japan', name: 'Kaoru Mitoma', goals: 3, assists: 2 },
];

export function TopScorersPanel() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="bg-fifa-gold/10 px-3 py-2 flex items-center gap-1.5">
        <Trophy className="h-3.5 w-3.5 text-fifa-gold" />
        <span className="text-xs font-bold uppercase tracking-wider">Artilharia</span>
        <span className="text-[11px] text-muted-foreground ml-auto">G · A</span>
      </div>
      <div className="divide-y">
        {MOCK_SCORERS.map((scorer, i) => (
          <div
            key={scorer.name}
            className={cn(
              'flex items-center gap-2 px-3 py-2',
              i === 0 && 'bg-fifa-gold/5'
            )}
          >
            <span className={cn(
              'text-[11px] font-bold w-4 text-center',
              i === 0 ? 'text-fifa-gold' : i === 1 ? 'text-fifa-gold/70' : i === 2 ? 'text-fifa-gold/50' : 'text-muted-foreground/50'
            )}>
              {i + 1}
            </span>
            <FlagIcon teamId={scorer.teamId} size={18} />
            <div className="flex-1 min-w-0">
              <span className={cn('text-xs font-medium', i === 0 && 'text-fifa-gold-dark dark:text-fifa-gold')}>
                {scorer.name}
              </span>
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span className="text-xs font-bold">{scorer.goals}</span>
              <span className="text-[11px] text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">{scorer.assists}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Share Button Component ─────────────────────────────────────────

export function ShareButton({ text, label }: { text: string; label?: string }) {
  const share = useShareResult();

  return (
    <button
      onClick={() => share(text)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-fifa-green/20 text-fifa-green hover:bg-fifa-green/10 transition-colors"
    >
      <Share2 className="h-3.5 w-3.5" />
      {label || 'Compartilhar'}
    </button>
  );
}