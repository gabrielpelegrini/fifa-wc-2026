'use client';

import { useState } from 'react';
import { useWorldCupStore } from '@/store/worldCupStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TEAMS } from '@/data/worldcup';
import FlagIcon from './FlagIcon';
import { getTeamName } from '@/lib/standings';

export default function ScoreInput() {
  const { editingMatch, setEditingMatch, matches, setScore, knockoutResults, setKnockoutScore, bracket } = useWorldCupStore();
  const [homeVal, setHomeVal] = useState('');
  const [awayVal, setAwayVal] = useState('');

  const match = editingMatch
    ? matches.find(m => m.id === editingMatch)
    : null;

  const isKnockout = editingMatch?.startsWith('R32') || editingMatch?.startsWith('R16') || editingMatch?.startsWith('QF') || editingMatch?.startsWith('SF') || editingMatch === '3RD' || editingMatch === 'FINAL';

  const handleOpen = () => {
    if (!match && !isKnockout) return;

    if (isKnockout && editingMatch) {
      const existing = knockoutResults.get(editingMatch);
      setHomeVal(existing ? String(existing.home) : '');
      setAwayVal(existing ? String(existing.away) : '');
    } else if (match) {
      setHomeVal(match.homeScore !== null ? String(match.homeScore) : '');
      setAwayVal(match.awayScore !== null ? String(match.awayScore) : '');
    }
  };

  const handleSave = () => {
    if (!editingMatch) return;

    const h = homeVal.trim() === '' ? null : parseInt(homeVal, 10);
    const a = awayVal.trim() === '' ? null : parseInt(awayVal, 10);

    if (h === null || a === null || isNaN(h) || isNaN(a)) {
      if (isKnockout) return;
      // For group matches, allow clearing
      if (!isKnockout) {
        setScore(editingMatch, null, null);
      }
      setEditingMatch(null);
      return;
    }

    if (isKnockout) {
      setKnockoutScore(editingMatch, h, a);
    } else {
      setScore(editingMatch, h, a);
    }
    setEditingMatch(null);
  };

  const handleClear = () => {
    if (!editingMatch) return;
    if (isKnockout) {
      const kr = new Map(useWorldCupStore.getState().knockoutResults);
      kr.delete(editingMatch);
      const { recalculate } = useWorldCupStore.getState();
      useWorldCupStore.setState({ knockoutResults: kr });
      recalculate();
    } else {
      setScore(editingMatch, null, null);
    }
    setEditingMatch(null);
  };

  // Get team names for knockout matches
  let homeName = '';
  let awayName = '';
  if (isKnockout && bracket) {
    const allKO = [...bracket.r32, ...bracket.r16, ...bracket.qf, ...bracket.sf, bracket.thirdPlace, bracket.final];
    const koMatch = allKO.find(m => m.id === editingMatch);
    if (koMatch) {
      homeName = koMatch.homeTeam ? getTeamName(koMatch.homeTeam) : koMatch.homeSlot;
      awayName = koMatch.awayTeam ? getTeamName(koMatch.awayTeam) : koMatch.awaySlot;
    }
  } else if (match) {
    homeName = getTeamName(match.homeTeam);
    awayName = getTeamName(match.awayTeam);
  }

  return (
    <Dialog
      open={!!editingMatch}
      onOpenChange={(open) => {
        if (!open) setEditingMatch(null);
        if (open) handleOpen();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">Informar Placar</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center gap-4 py-6">
          <div className="flex flex-col items-center gap-2 min-w-[100px]">
            {!isKnockout && match && <FlagIcon teamId={match.homeTeam} size={36} />}
            <span className="text-sm font-medium text-center">{homeName}</span>
            <Input
              type="number"
              min="0"
              value={homeVal}
              onChange={e => setHomeVal(e.target.value)}
              className="w-20 text-center text-2xl font-bold h-14"
              placeholder="-"
              autoFocus
            />
          </div>
          <span className="text-2xl font-bold text-muted-foreground mt-6">×</span>
          <div className="flex flex-col items-center gap-2 min-w-[100px]">
            {!isKnockout && match && <FlagIcon teamId={match.awayTeam} size={36} />}
            <span className="text-sm font-medium text-center">{awayName}</span>
            <Input
              type="number"
              min="0"
              value={awayVal}
              onChange={e => setAwayVal(e.target.value)}
              className="w-20 text-center text-2xl font-bold h-14"
              placeholder="-"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Limpar
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}