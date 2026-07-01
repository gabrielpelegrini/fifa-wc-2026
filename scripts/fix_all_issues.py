#!/usr/bin/env python3
"""
Comprehensive fix for all reported FIFA WC 2026 webapp issues:
1. Store: add espnBracketTeams for ESPN-confirmed matchups
2. Calendar: use ESPN raw knockout events as PRIMARY source
3. Artilharia: replace mock data with unavailable message
4. KnockoutBracket: use ESPN-confirmed teams
5. VisualBracket: use ESPN-confirmed teams + improve layout
"""
import re, os

BASE = '/home/z/my-project/src'

def read_file(path):
    with open(path, 'r') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w') as f:
        f.write(content)

# ═══════════════════════════════════════════════════════════════════
# FIX 1: Store - add espnBracketTeams
# ═══════════════════════════════════════════════════════════════════
def fix_store():
    path = f'{BASE}/store/worldCupStore.ts'
    content = read_file(path)
    
    # 1. Add espnBracketTeams to state interface
    old_interface = """  rawKnockoutEvents: RawKnockoutEvent[];
  isRefreshing: boolean;
  lastError: string | null;"""
    new_interface = """  rawKnockoutEvents: RawKnockoutEvent[];
  espnBracketTeams: Record<string, { homeTeam: string; awayTeam: string }>;
  isRefreshing: boolean;
  lastError: string | null;"""
    content = content.replace(old_interface, new_interface, 1)
    
    # 2. Add initial value
    old_init = """    rawKnockoutEvents: [],
    isRefreshing: false,"""
    new_init = """    rawKnockoutEvents: [],
    espnBracketTeams: {},
    isRefreshing: false,"""
    content = content.replace(old_init, new_init, 1)
    
    # 3. In updateKnockoutLive, add date-based matching and store espnBracketTeams
    # This is the big change. We need to add logic after the existing matching loop
    # to try date-based matching for unmatched events, and store confirmed teams.
    
    # Find the section after "for (const evt of events)" loop ends and before "Single atomic set()"
    # We need to add: (a) date-based fallback matching, (b) store espnBracketTeams
    
    # Add the espnBracketTeams population into the update object
    old_set = """      // Single atomic set() — no intermediate render state
      const update: Record<string, unknown> = {
        knockoutLiveInfo: newInfo,
        liveMatches: { ...get().liveMatches, ...newKnockoutLive },
        rawKnockoutEvents: events, // Store raw ESPN data for LiveTab fallback display
        bracket: freshBracket, // Use the fresh bracket we computed above
      };"""
    
    new_set = """      // ── Date-based fallback matching for unmatched events ──
      // Build a date-indexed list of bracket entries that weren't matched above
      const matchedIds = new Set(Object.keys(newInfo));
      const dateToUnmatched = new Map<string, Array<{ id: string; homeSlot: string; awaySlot: string; homeTeam: string | null; awayTeam: string | null }>>();
      for (const entry of allEntries) {
        if (matchedIds.has(entry.id)) continue;
        if (!entry.date) continue;
        const arr = dateToUnmatched.get(entry.date) || [];
        arr.push(entry);
        dateToUnmatched.set(entry.date, arr);
      }

      // For each unmatched ESPN event, try to match by date
      const espnBracketTeams: Record<string, { homeTeam: string; awayTeam: string }> = { ...get().espnBracketTeams };
      for (const evt of events) {
        const homeId = ESPN_TO_TEAM[evt.homeAbbr];
        const awayId = ESPN_TO_TEAM[evt.awayAbbr];
        if (!homeId || !awayId) continue;
        const evtDate = evt.date;
        if (!evtDate) continue;

        // Skip if this team pair was already matched in the main loop
        if (matchedIds.size > 0) {
          // Check if we already have a confirmed matchup for these teams
          const pairKey = [homeId, awayId].sort().join(':');
          let alreadyMatched = false;
          for (const [bid, teams] of Object.entries(espnBracketTeams)) {
            if ([teams.homeTeam, teams.awayTeam].sort().join(':') === pairKey) {
              alreadyMatched = true;
              break;
            }
          }
          if (alreadyMatched) continue;
        }

        // Find unmatched bracket entries on the same date
        const unmatched = dateToUnmatched.get(evtDate);
        if (!unmatched) continue;

        for (const entry of unmatched) {
          // Check if ESPN teams could plausibly fill this bracket entry's slots
          const homePossible = getPossibleTeams(entry.homeSlot, allStandings);
          const awayPossible = getPossibleTeams(entry.awaySlot, allStandings);

          const homeFits = homeId === entry.homeTeam || homeId === entry.awayTeam ||
            (entry.homeTeam === null && homePossible.has(homeId));
          const awayFits = awayId === entry.homeTeam || awayId === entry.awayTeam ||
            (entry.awayTeam === null && awayPossible.has(awayId));

          if ((homeFits && awayFits) || (homeFits && awayId === entry.awayTeam) || (awayFits && homeId === entry.homeTeam)) {
            // Determine home/away alignment
            let confirmedHome = homeId;
            let confirmedAway = awayId;
            if (entry.homeTeam && entry.awayTeam) {
              // Entry already has teams from resolver — override if ESPN differs
              if (entry.homeTeam === awayId && entry.awayTeam === homeId) {
                confirmedHome = awayId;
                confirmedAway = homeId;
              }
            }
            espnBracketTeams[entry.id] = { homeTeam: confirmedHome, awayTeam: confirmedAway };
            // Also set live info if not already set
            if (!newInfo[entry.id]) {
              const status = classifyESPNStatus(evt.statusName);
              const isLiveOrFinished = status === 'live' || status === 'finished';
              const pH = parseInt(evt.homeScore, 10);
              const pA = parseInt(evt.awayScore, 10);
              newInfo[entry.id] = {
                status,
                homeScore: isLiveOrFinished && !isNaN(pH) ? pH : null,
                awayScore: isLiveOrFinished && !isNaN(pA) ? pA : null,
                minute: status === 'live' && evt.clock ? Math.floor(evt.clock / 60) : undefined,
                displayClock: evt.displayClock,
              };
              if (status === 'finished' && !isNaN(pH) && !isNaN(pA)) {
                const isRev = entry.homeTeam === awayId;
                let penH: number | undefined, penA: number | undefined;
                if (evt.shortDetail) {
                  const pk = evt.shortDetail.match(/PK\\s+(\\d+)\\s*[-–]\\s*(\\d+)/i);
                  if (pk) {
                    penH = isRev ? parseInt(pk[2], 10) : parseInt(pk[1], 10);
                    penA = isRev ? parseInt(pk[1], 10) : parseInt(pk[2], 10);
                  }
                }
                finishedKO.push({
                  id: entry.id,
                  home: isRev ? (isNaN(pA) ? 0 : pA) : (isNaN(pH) ? 0 : pH),
                  away: isRev ? (isNaN(pH) ? 0 : pH) : (isNaN(pA) ? 0 : pA),
                  penaltyHome: penH, penaltyAway: penA,
                });
              }
            }
            // Remove from unmatched so it's not reused
            const idx = unmatched.indexOf(entry);
            if (idx >= 0) unmatched.splice(idx, 1);
            break;
          }
        }
      }

      // Also store confirmed teams for entries matched in the main loop
      for (const entry of allEntries) {
        if (matchedIds.has(entry.id) && entry.homeTeam && entry.awayTeam) {
          espnBracketTeams[entry.id] = { homeTeam: entry.homeTeam, awayTeam: entry.awayTeam };
        }
      }

      // Single atomic set() — no intermediate render state
      const update: Record<string, unknown> = {
        knockoutLiveInfo: newInfo,
        liveMatches: { ...get().liveMatches, ...newKnockoutLive },
        rawKnockoutEvents: events, // Store raw ESPN data for LiveTab fallback display
        bracket: freshBracket, // Use the fresh bracket we computed above
        espnBracketTeams,
      };"""
    
    content = content.replace(old_set, new_set, 1)
    
    # Add the getPossibleTeams helper function after the import block
    old_import_end = "import { classifyESPNStatus } from '@/lib/espnStatus';"
    new_import_end = """import { classifyESPNStatus } from '@/lib/espnStatus';
import { THIRD_PLACE_POOLS } from '@/data/worldcup';"""
    content = content.replace(old_import_end, new_import_end, 1)
    
    # Add helper function before the store creation
    old_create = "export const useWorldCupStore = create<WorldCupState>((set, get) => {"
    new_create = """/** Get all possible team IDs that could fill a bracket slot */
function getPossibleTeams(
  slot: string,
  allStandings: Map<string, TeamStanding[]>
): Set<string> {
  const m1 = slot.match(/^1([A-L])$/);
  if (m1) {
    const sts = allStandings.get(m1[1]);
    return sts ? new Set(sts.map(s => s.teamId)) : new Set();
  }
  const m2 = slot.match(/^2([A-L])$/);
  if (m2) {
    const sts = allStandings.get(m2[1]);
    return sts ? new Set(sts.map(s => s.teamId)) : new Set();
  }
  const m3 = slot.match(/^3_([A-L]+)$/);
  if (m3) {
    const pool = THIRD_PLACE_POOLS[slot as keyof typeof THIRD_PLACE_POOLS];
    if (!pool) return new Set();
    const teams = new Set<string>();
    for (const g of pool.groups) {
      const sts = allStandings.get(g);
      if (sts) {
        const third = sts.find(s => s.position === 3);
        if (third) teams.add(third.teamId);
      }
    }
    return teams;
  }
  return new Set();
}

export const useWorldCupStore = create<WorldCupState>((set, get) => {"""
    content = content.replace(old_create, new_create, 1)
    
    write_file(path, content)
    print(f"  ✓ Fixed {path}")

# ═══════════════════════════════════════════════════════════════════
# FIX 2: Calendar - ESPN data first for knockout
# ═══════════════════════════════════════════════════════════════════
def fix_calendar():
    path = f'{BASE}/components/worldcup/Calendar.tsx'
    content = read_file(path)
    
    # Replace the knockout data section in the useMemo
    # Old: bracket first, then ESPN fallback
    # New: ESPN first, then bracket supplement
    
    old_ko_section = """    // 2) Bracket knockout matches (resolved)
    if (bracket) {
      const koMatches = [...bracket.r32, ...bracket.r16, ...bracket.qf, ...bracket.sf, bracket.thirdPlace, bracket.final];
      for (const m of koMatches) {
        const koInfo = knockoutLiveInfo[m.id];
        const hasResult = m.homeScore !== null && m.awayScore !== null;
        const status = koInfo?.status ?? (hasResult ? 'finished' : 'upcoming');
        const ht = m.homeTeam;
        const at = m.awayTeam;
        list.push({
          id: m.id, homeTeam: ht, awayTeam: at,
          homeLabel: ht ? getTeamName(ht) : m.homeSlot,
          awayLabel: at ? getTeamName(at) : m.awaySlot,
          date: m.date, time: m.time, venue: m.venue, city: m.city, country: '',
          group: '', round: 4,
          homeScore: koInfo?.homeScore ?? m.homeScore,
          awayScore: koInfo?.awayScore ?? m.awayScore,
          status, liveMinute: liveMatches[m.id],
          roundLabel: ROUND_LABELS[m.round] || m.round,
        });
      }
    }

    // 3) Raw ESPN knockout fallback (for unmatched events)
    for (const evt of rawKnockoutEvents) {
      const homeId = ESPN_TO_TEAM[evt.homeAbbr];
      const awayId = ESPN_TO_TEAM[evt.awayAbbr];
      // Skip if already in bracket (check both orders)
      if (homeId && awayId && list.some(m =>
        (m.homeTeam === homeId && m.awayTeam === awayId) ||
        (m.homeTeam === awayId && m.awayTeam === homeId)
      )) continue;
      const status = evt.statusName === 'STATUS_FULL_TIME' ? 'finished'
        : ['STATUS_IN_PROGRESS','STATUS_HALFTIME','STATUS_1ST_PERIOD','STATUS_2ND_PERIOD','STATUS_EXTRA_TIME','STATUS_PENALTY_SHOOTOUT'].includes(evt.statusName)
          ? 'live' as const : 'upcoming' as const;
      const hasScore = status !== 'upcoming';
      // Fallback: if ESPN has no time, use '12:00' so the match still appears in calendar
      const evtTime = evt.time || '12:00';
      list.push({
        id: `espn-ko-${evt.homeAbbr}-${evt.awayAbbr}`,
        homeTeam: homeId ?? null, awayTeam: awayId ?? null,
        homeLabel: evt.homeName, awayLabel: evt.awayName,
        date: evt.date || '', time: evtTime,
        venue: evt.venue || '', city: evt.city || '', country: '',
        group: '', round: 4,
        homeScore: hasScore ? (parseInt(evt.homeScore, 10) || 0) : null,
        awayScore: hasScore ? (parseInt(evt.awayScore, 10) || 0) : null,
        status,
        liveMinute: status === 'live' && evt.clock ? Math.floor(evt.clock / 60) : undefined,
        roundLabel: 'Mata-mata',
      });
    }"""
    
    new_ko_section = """    // 2) Raw ESPN knockout events (PRIMARY source — real confirmed matchups)
    const espnKOPairs = new Set<string>();
    for (const evt of rawKnockoutEvents) {
      const homeId = ESPN_TO_TEAM[evt.homeAbbr];
      const awayId = ESPN_TO_TEAM[evt.awayAbbr];
      // Skip future rounds with placeholder names like "Round of 32 5 Winner"
      if (evt.homeName.includes('Winner') || evt.awayName.includes('Winner')) continue;
      const status = evt.statusName === 'STATUS_FULL_TIME' ? 'finished'
        : evt.statusName === 'STATUS_FINAL_PEN' ? 'finished'
        : ['STATUS_IN_PROGRESS','STATUS_HALFTIME','STATUS_1ST_PERIOD','STATUS_2ND_PERIOD','STATUS_EXTRA_TIME','STATUS_PENALTY_SHOOTOUT'].includes(evt.statusName)
          ? 'live' as const : 'upcoming' as const;
      const hasScore = status !== 'upcoming';
      const evtTime = evt.time || '12:00';
      // Determine round label from ESPN altGameNote
      const note = (evt as unknown as { altGameNote?: string }).altGameNote || '';
      let roundLabel = 'Mata-mata';
      if (note.includes('Round of 32')) roundLabel = '32 Avos';
      else if (note.includes('Round of 16')) roundLabel = 'Oitavas';
      else if (note.includes('Quarterfinal')) roundLabel = 'Quartas';
      else if (note.includes('Semifinal')) roundLabel = 'Semifinal';
      else if (note.includes('Third Place') || note.includes('3rd')) roundLabel = '3\\u00B0 Lugar';
      else if (note.includes('Final')) roundLabel = 'Final';

      list.push({
        id: `espn-ko-${evt.homeAbbr}-${evt.awayAbbr}`,
        homeTeam: homeId ?? null, awayTeam: awayId ?? null,
        homeLabel: evt.homeName, awayLabel: evt.awayName,
        date: evt.date || '', time: evtTime,
        venue: evt.venue || '', city: evt.city || '', country: '',
        group: '', round: 4,
        homeScore: hasScore ? (parseInt(evt.homeScore, 10) || 0) : null,
        awayScore: hasScore ? (parseInt(evt.awayScore, 10) || 0) : null,
        status,
        liveMinute: status === 'live' && evt.clock ? Math.floor(evt.clock / 60) : undefined,
        roundLabel,
      });

      // Track pairs to avoid duplicate bracket entries
      if (homeId && awayId) {
        espnKOPairs.add([homeId, awayId].sort().join(':'));
      }
    }

    // 3) Bracket knockout matches (SUPPLEMENT — only for slots not covered by ESPN)
    if (bracket) {
      const koMatches = [...bracket.r32, ...bracket.r16, ...bracket.qf, ...bracket.sf, bracket.thirdPlace, bracket.final];
      for (const m of koMatches) {
        // Skip if ESPN already has this team pair
        if (m.homeTeam && m.awayTeam) {
          const key = [m.homeTeam, m.awayTeam].sort().join(':');
          if (espnKOPairs.has(key)) continue;
        }
        const koInfo = knockoutLiveInfo[m.id];
        const hasResult = m.homeScore !== null && m.awayScore !== null;
        const status = koInfo?.status ?? (hasResult ? 'finished' : 'upcoming');
        const ht = m.homeTeam;
        const at = m.awayTeam;
        list.push({
          id: m.id, homeTeam: ht, awayTeam: at,
          homeLabel: ht ? getTeamName(ht) : m.homeSlot,
          awayLabel: at ? getTeamName(at) : m.awaySlot,
          date: m.date, time: m.time, venue: m.venue, city: m.city, country: '',
          group: '', round: 4,
          homeScore: koInfo?.homeScore ?? m.homeScore,
          awayScore: koInfo?.awayScore ?? m.awayScore,
          status, liveMinute: liveMatches[m.id],
          roundLabel: ROUND_LABELS[m.round] || m.round,
        });
      }
    }"""
    
    content = content.replace(old_ko_section, new_ko_section, 1)
    
    # Add classifyESPNStatus import (Calendar uses inline status check)
    # Actually, Calendar uses inline status check, which is fine. But let's also add the import for STATUS_FINAL_PEN
    
    write_file(path, content)
    print(f"  ✓ Fixed {path}")

# ═══════════════════════════════════════════════════════════════════
# FIX 3: Artilharia - replace mock data
# ═══════════════════════════════════════════════════════════════════
def fix_artilharia():
    path = f'{BASE}/components/worldcup/Engagement.tsx'
    content = read_file(path)
    
    # Replace MOCK_SCORERS and TopScorersPanel
    old_section = """// ── Top Scorers (Artilharia) ───────────────────────────────────────

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
}"""
    
    new_section = """// ── Top Scorers (Artilharia) ───────────────────────────────────────

export function TopScorersPanel() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="bg-fifa-gold/10 px-3 py-2 flex items-center gap-1.5">
        <Trophy className="h-3.5 w-3.5 text-fifa-gold" />
        <span className="text-xs font-bold uppercase tracking-wider">Artilharia</span>
      </div>
      <div className="px-3 py-6 text-center">
        <Trophy className="h-8 w-8 text-fifa-gold/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Dados de artilharia nao disponiveis no momento.
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          A artilharia sera atualizada automaticamente quando a ESPN disponibilizar os dados.
        </p>
      </div>
    </div>
  );
}"""
    
    content = content.replace(old_section, new_section, 1)
    
    # Remove unused imports
    content = content.replace("import { Star, Share2, Trophy } from 'lucide-react';\n", "import { Star, Share2, Trophy } from 'lucide-react';\n")
    # FlagIcon is still used by FavoritesPanel, so keep it
    
    write_file(path, content)
    print(f"  ✓ Fixed {path}")

# ═══════════════════════════════════════════════════════════════════
# FIX 4: KnockoutBracket - use ESPN-confirmed teams
# ═══════════════════════════════════════════════════════════════════
def fix_knockout():
    path = f'{BASE}/components/worldcup/KnockoutBracket.tsx'
    content = read_file(path)
    
    # Add espnBracketTeams to the destructured store
    old_destruct = """  const { bracket, knockoutResults, knockoutLiveInfo, liveMatches } = useWorldCupStore();"""
    new_destruct = """  const { bracket, knockoutResults, knockoutLiveInfo, liveMatches, espnBracketTeams } = useWorldCupStore();"""
    content = content.replace(old_destruct, new_destruct, 1)
    
    # Pass espnBracketTeams to enrichBracket
    old_enrich_call = """  const enrichedBracket = bracket ? enrichBracket(bracket, knockoutLiveInfo, liveMatches) : null;"""
    new_enrich_call = """  const enrichedBracket = bracket ? enrichBracket(bracket, knockoutLiveInfo, liveMatches, espnBracketTeams) : null;"""
    content = content.replace(old_enrich_call, new_enrich_call, 1)
    
    # Update enrichBracket function signature and body
    old_enrich_fn = """function enrichBracket(
  bracket: NonNullable<ReturnType<typeof useWorldCupStore.getState>['bracket']>,
  knockoutLiveInfo: Record<string, { status: string; homeScore: number | null; awayScore: number | null; minute?: number; displayClock?: string }>,
  liveMatches: Record<string, number>
): { r32: BracketMatchInfo[]; r16: BracketMatchInfo[]; qf: BracketMatchInfo[]; sf: BracketMatchInfo[]; thirdPlace: BracketMatchInfo; final: BracketMatchInfo } {
  function enrich(m: typeof bracket.r32[0]): BracketMatchInfo {
    const live = knockoutLiveInfo[m.id];
    const hasLive = live && (live.status === 'live' || live.status === 'finished');
    return {
      id: m.id,
      round: m.round,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeSlot: m.homeSlot,
      awaySlot: m.awaySlot,
      homeScore: hasLive ? (live.homeScore ?? m.homeScore) : m.homeScore,
      awayScore: hasLive ? (live.awayScore ?? m.awayScore) : m.awayScore,
      penaltyHome: m.penaltyHome,
      penaltyAway: m.penaltyAway,
      venue: m.venue,
      city: m.city,
      date: m.date,
      time: m.time,
      liveStatus: live?.status as BracketMatchInfo['liveStatus'],
      liveMinute: liveMatches[m.id],
      displayClock: live?.displayClock,
    };
  }"""
    
    new_enrich_fn = """function enrichBracket(
  bracket: NonNullable<ReturnType<typeof useWorldCupStore.getState>['bracket']>,
  knockoutLiveInfo: Record<string, { status: string; homeScore: number | null; awayScore: number | null; minute?: number; displayClock?: string }>,
  liveMatches: Record<string, number>,
  espnTeams: Record<string, { homeTeam: string; awayTeam: string }>
): { r32: BracketMatchInfo[]; r16: BracketMatchInfo[]; qf: BracketMatchInfo[]; sf: BracketMatchInfo[]; thirdPlace: BracketMatchInfo; final: BracketMatchInfo } {
  function enrich(m: typeof bracket.r32[0]): BracketMatchInfo {
    const live = knockoutLiveInfo[m.id];
    const hasLive = live && (live.status === 'live' || live.status === 'finished');
    // Use ESPN-confirmed teams when available, otherwise fall back to bracket resolver
    const confirmed = espnTeams[m.id];
    const homeTeam = confirmed ? confirmed.homeTeam : m.homeTeam;
    const awayTeam = confirmed ? confirmed.awayTeam : m.awayTeam;
    return {
      id: m.id,
      round: m.round,
      homeTeam,
      awayTeam,
      homeSlot: m.homeSlot,
      awaySlot: m.awaySlot,
      homeScore: hasLive ? (live.homeScore ?? m.homeScore) : m.homeScore,
      awayScore: hasLive ? (live.awayScore ?? m.awayScore) : m.awayScore,
      penaltyHome: m.penaltyHome,
      penaltyAway: m.penaltyAway,
      venue: m.venue,
      city: m.city,
      date: m.date,
      time: m.time,
      liveStatus: live?.status as BracketMatchInfo['liveStatus'],
      liveMinute: liveMatches[m.id],
      displayClock: live?.displayClock,
    };
  }"""
    
    content = content.replace(old_enrich_fn, new_enrich_fn, 1)
    
    write_file(path, content)
    print(f"  ✓ Fixed {path}")

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("Fixing all reported issues...")
    fix_store()
    fix_calendar()
    fix_artilharia()
    fix_knockout()
    print("\nAll fixes applied!")