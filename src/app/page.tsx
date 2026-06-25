'use client';

import Navigation from '@/components/worldcup/Navigation';
import LiveTab from '@/components/worldcup/LiveTab';
import Calendar from '@/components/worldcup/Calendar';
import GroupTables from '@/components/worldcup/GroupTables';
import KnockoutBracket from '@/components/worldcup/KnockoutBracket';
import CrossoverPredictor from '@/components/worldcup/CrossoverPredictor';
import { useWorldCupStore } from '@/store/worldCupStore';
import { useLiveScores } from '@/hooks/useLiveScores';

export default function Home() {
  const activeTab = useWorldCupStore(s => s.activeTab);

  // Always-on polling every 5 minutes
  useLiveScores();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 mx-auto w-full max-w-7xl px-2 sm:px-4 py-4">
        {activeTab === 'live' && <LiveTab />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'groups' && <GroupTables />}
        {activeTab === 'bracket' && <KnockoutBracket />}
        {activeTab === 'crossover' && <CrossoverPredictor />}
      </main>
      <footer className="border-t py-3 text-center text-xs text-muted-foreground">
        <p>Copa do Mundo FIFA 2026 · Dados atualizados automaticamente a cada 5 minutos</p>
      </footer>
    </div>
  );
}