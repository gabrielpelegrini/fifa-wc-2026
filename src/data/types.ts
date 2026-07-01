export interface Team {
  id: string;
  code: string;
  name: string;
  flag: string; // ISO 3166-1 alpha-2 lowercase, or 'tbd' for placeholder
  isPlaceholder?: boolean;
}

export interface GroupDef {
  id: string; // 'A' through 'L'
  teams: [string, string, string, string]; // team ids in order (seed 1,2,3,4)
}

export type MatchPhase = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final';

export interface MatchDef {
  id: string;
  phase: MatchPhase;
  group?: string; // 'A'-'L' for group matches
  round?: number; // matchday 1-3 for group
  knockoutSlot?: string; // e.g. 'R32-01', 'R16-01', etc.
  homeTeam: string; // team id, or slot ref like '1A', '2B', '3_ABCDF'
  awayTeam: string;
  homeSlot?: string; // bracket slot reference
  awaySlot?: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string; // HH:MM in UTC
  venue: string;
  city: string;
  country: 'USA' | 'MEX' | 'CAN';
  homeScore?: number | null;
  awayScore?: number | null;
  status?: 'upcoming' | 'live' | 'finished';
}

export interface TeamStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  fairPlay: number;
  position: number;
}

export interface ThirdPlaceEntry {
  teamId: string;
  groupId: string;
  points: number;
  goalDiff: number;
  goalsFor: number;
  fairPlay: number; // negative = more cards
  rank: number;
  qualified: boolean;
}

export interface KnockoutMatch {
  id: string;
  round: 'r32' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final';
  homeSlot: string;
  awaySlot: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeScore: number | null;
  awayScore: number | null;
  penaltyHome?: number | null;  // penalty score (if applicable)
  penaltyAway?: number | null;
  date: string;
  time: string; // HH:MM in UTC
  venue: string;
  city: string;
}

export interface TimezoneOption {
  label: string;
  offset: string; // e.g. 'America/Sao_Paulo'
  utcLabel: string;
}

// ── ESPN Integration Types (shared between route.ts and worldCupStore.ts) ──

export interface ESPNMatchScore {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  minute?: number;
  displayClock?: string;
  espnDate?: string;
  espnTime?: string;
  espnVenue?: string;
  espnCity?: string;
}

export interface RawKnockoutEvent {
  homeAbbr: string;
  awayAbbr: string;
  homeName: string;
  awayName: string;
  homeScore: string;
  awayScore: string;
  statusName: string;
  clock?: number;
  displayClock?: string;
  shortDetail?: string;
  date?: string;
  time?: string;
  venue?: string;
  city?: string;
  altGameNote?: string;
}