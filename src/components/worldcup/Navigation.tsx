'use client';

import { useWorldCupStore } from '@/store/worldCupStore';
import { cn } from '@/lib/utils';
import { Calendar, Trophy, GitBranch, ArrowLeftRight, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const TABS = [
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'groups', label: 'Grupos', icon: Trophy },
  { id: 'bracket', label: 'Mata-mata', icon: GitBranch },
  { id: 'crossover', label: 'Cruzamentos', icon: ArrowLeftRight },
];

export default function Navigation() {
  const { activeTab, setActiveTab, timezone, setTimezone } = useWorldCupStore();
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports:[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        {/* Top bar */}
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <div>
              <h1 className="text-sm sm:text-base font-bold leading-tight">Copa do Mundo FIFA 2026</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Canadá · México · EUA</p>
            </div>
          </div>
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="rounded-md p-2 hover:bg-accent transition-colors"
            aria-label="Alternar tema"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="h-4 w-4 hidden dark:block" />
          </button>
        </div>

        {/* Tabs */}
        <nav className="flex gap-0 -mb-px overflow-x-auto" role="tablist">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Timezone selector */}
        <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground border-b">
          <span>Fuso:</span>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="bg-transparent border-b border-muted-foreground/30 px-1 py-0.5 text-xs focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="America/Sao_Paulo">Brasília (UTC-3)</option>
            <option value="UTC">UTC</option>
            <option value="America/Mexico_City">Cidade do México (UTC-6)</option>
            <option value="America/New_York">New York (UTC-5)</option>
            <option value="America/Los_Angeles">Los Angeles (UTC-8)</option>
            <option value="Europe/London">Londres (UTC+0)</option>
            <option value="Asia/Tokyo">Tóquio (UTC+9)</option>
          </select>
        </div>
      </div>
    </header>
  );
}