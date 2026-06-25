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
  homeTeam: string; // team id, or slot ref like '1A', '2B', '3DEF_best'
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

export type BracketSlotRef =
  | { type: 'group_winner'; group: string }
  | { type: 'group_runnerup'; group: string }
  | { type: 'third_place'; pool: string[]; index: number };

export interface KnockoutMatch {
  id: string;
  round: 'r32' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final';
  homeSlot: string;
  awaySlot: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  venue: string;
  city: string;
}

export interface BracketMatch {
  id: string;
  round: 'r32' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final';
  homeSlot: string; // slot reference string
  awaySlot: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  feederHome?: string; // winner of which match
  feederAway?: string;
  date: string;
  venue: string;
  city: string;
}

export interface TimezoneOption {
  label: string;
  offset: string; // e.g. 'America/Sao_Paulo'
  utcLabel: string;
}