'use client';

import Navigation from '@/components/worldcup/Navigation';
import Calendar from '@/components/worldcup/Calendar';
import GroupTables from '@/components/worldcup/GroupTables';
import KnockoutBracket from '@/components/worldcup/KnockoutBracket';
import CrossoverPredictor from '@/components/worldcup/CrossoverPredictor';
import ScoreInput from '@/components/worldcup/ScoreInput';
import { useWorldCupStore } from '@/store/worldCupStore';

export default function Home() {
  const activeTab = useWorldCupStore(s => s.activeTab);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 mx-auto w-full max-w-7xl px-2 sm:px-4 py-4">
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'groups' && <GroupTables />}
        {activeTab === 'bracket' && <KnockoutBracket />}
        {activeTab === 'crossover' && <CrossoverPredictor />}
      </main>
      <footer className="border-t py-3 text-center text-xs text-muted-foreground">
        <p>Copa do Mundo FIFA 2026 · Dados sujeitos a confirmação oficial · Clique em qualquer jogo para informar placar</p>
      </footer>
      <ScoreInput />
    </div>
  );
}