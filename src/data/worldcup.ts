import { Team, GroupDef } from './types';

export const TEAMS: Record<string, Team> = {
  // ===== GROUP A =====
  mexico: { id: 'mexico', code: 'mx', name: 'México', flag: 'mx' },
  a2: { id: 'a2', code: '??', name: 'A2 (TBD)', flag: 'tbd', isPlaceholder: true },
  a3: { id: 'a3', code: '??', name: 'A3 (TBD)', flag: 'tbd', isPlaceholder: true },
  a4: { id: 'a4', code: '??', name: 'A4 (TBD)', flag: 'tbd', isPlaceholder: true },

  // ===== GROUP B =====
  canada: { id: 'canada', code: 'ca', name: 'Canadá', flag: 'ca' },
  b2: { id: 'b2', code: '??', name: 'B2 (TBD)', flag: 'tbd', isPlaceholder: true },
  b3: { id: 'b3', code: '??', name: 'B3 (TBD)', flag: 'tbd', isPlaceholder: true },
  b4: { id: 'b4', code: '??', name: 'B4 (TBD)', flag: 'tbd', isPlaceholder: true },

  // ===== GROUP C =====
  brazil: { id: 'brazil', code: 'br', name: 'Brasil', flag: 'br' },
  morocco: { id: 'morocco', code: 'ma', name: 'Marrocos', flag: 'ma' },
  scotland: { id: 'scotland', code: 'gb-sct', name: 'Escócia', flag: 'gb-sct' },
  haiti: { id: 'haiti', code: 'ht', name: 'Haiti', flag: 'ht' },

  // ===== GROUP D =====
  usa: { id: 'usa', code: 'us', name: 'Estados Unidos', flag: 'us' },
  d2: { id: 'd2', code: '??', name: 'D2 (TBD)', flag: 'tbd', isPlaceholder: true },
  d3: { id: 'd3', code: '??', name: 'D3 (TBD)', flag: 'tbd', isPlaceholder: true },
  d4: { id: 'd4', code: '??', name: 'D4 (TBD)', flag: 'tbd', isPlaceholder: true },

  // ===== GROUP E =====
  e1: { id: 'e1', code: '??', name: 'E1 (TBD)', flag: 'tbd', isPlaceholder: true },
  e2: { id: 'e2', code: '??', name: 'E2 (TBD)', flag: 'tbd', isPlaceholder: true },
  e3: { id: 'e3', code: '??', name: 'E3 (TBD)', flag: 'tbd', isPlaceholder: true },
  e4: { id: 'e4', code: '??', name: 'E4 (TBD)', flag: 'tbd', isPlaceholder: true },

  // ===== GROUP F =====
  f1: { id: 'f1', code: '??', name: 'F1 (TBD)', flag: 'tbd', isPlaceholder: true },
  f2: { id: 'f2', code: '??', name: 'F2 (TBD)', flag: 'tbd', isPlaceholder: true },
  f3: { id: 'f3', code: '??', name: 'F3 (TBD)', flag: 'tbd', isPlaceholder: true },
  f4: { id: 'f4', code: '??', name: 'F4 (TBD)', flag: 'tbd', isPlaceholder: true },

  // ===== GROUP G =====
  g1: { id: 'g1', code: '??', name: 'G1 (TBD)', flag: 'tbd', isPlaceholder: true },
  g2: { id: 'g2', code: '??', name: 'G2 (TBD)', flag: 'tbd', isPlaceholder: true },
  g3: { id: 'g3', code: '??', name: 'G3 (TBD)', flag: 'tbd', isPlaceholder: true },
  g4: { id: 'g4', code: '??', name: 'G4 (TBD)', flag: 'tbd', isPlaceholder: true },

  // ===== GROUP H =====
  h1: { id: 'h1', code: '??', name: 'H1 (TBD)', flag: 'tbd', isPlaceholder: true },
  h2: { id: 'h2', code: '??', name: 'H2 (TBD)', flag: 'tbd', isPlaceholder: true },
  h3: { id: 'h3', code: '??', name: 'H3 (TBD)', flag: 'tbd', isPlaceholder: true },
  h4: { id: 'h4', code: '??', name: 'H4 (TBD)', flag: 'tbd', isPlaceholder: true },

  // ===== GROUP I =====
  i1: { id: 'i1', code: '??', name: 'I1 (TBD)', flag: 'tbd', isPlaceholder: true },
  i2: { id: 'i2', code: '??', name: 'I2 (TBD)', flag: 'tbd', isPlaceholder: true },
  i3: { id: 'i3', code: '??', name: 'I3 (TBD)', flag: 'tbd', isPlaceholder: true },
  i4: { id: 'i4', code: '??', name: 'I4 (TBD)', flag: 'tbd', isPlaceholder: true },

  // ===== GROUP J =====
  j1: { id: 'j1', code: '??', name: 'J1 (TBD)', flag: 'tbd', isPlaceholder: true },
  j2: { id: 'j2', code: '??', name: 'J2 (TBD)', flag: 'tbd', isPlaceholder: true },
  j3: { id: 'j3', code: '??', name: 'J3 (TBD)', flag: 'tbd', isPlaceholder: true },
  j4: { id: 'j4', code: '??', name: 'J4 (TBD)', flag: 'tbd', isPlaceholder: true },

  // ===== GROUP K =====
  k1: { id: 'k1', code: '??', name: 'K1 (TBD)', flag: 'tbd', isPlaceholder: true },
  k2: { id: 'k2', code: '??', name: 'K2 (TBD)', flag: 'tbd', isPlaceholder: true },
  k3: { id: 'k3', code: '??', name: 'K3 (TBD)', flag: 'tbd', isPlaceholder: true },
  k4: { id: 'k4', code: '??', name: 'K4 (TBD)', flag: 'tbd', isPlaceholder: true },

  // ===== GROUP L =====
  l1: { id: 'l1', code: '??', name: 'L1 (TBD)', flag: 'tbd', isPlaceholder: true },
  l2: { id: 'l2', code: '??', name: 'L2 (TBD)', flag: 'tbd', isPlaceholder: true },
  l3: { id: 'l3', code: '??', name: 'L3 (TBD)', flag: 'tbd', isPlaceholder: true },
  l4: { id: 'l4', code: '??', name: 'L4 (TBD)', flag: 'tbd', isPlaceholder: true },
};

export const GROUPS: GroupDef[] = [
  { id: 'A', teams: ['mexico', 'a2', 'a3', 'a4'] },
  { id: 'B', teams: ['canada', 'b2', 'b3', 'b4'] },
  { id: 'C', teams: ['brazil', 'morocco', 'scotland', 'haiti'] },
  { id: 'D', teams: ['usa', 'd2', 'd3', 'd4'] },
  { id: 'E', teams: ['e1', 'e2', 'e3', 'e4'] },
  { id: 'F', teams: ['f1', 'f2', 'f3', 'f4'] },
  { id: 'G', teams: ['g1', 'g2', 'g3', 'g4'] },
  { id: 'H', teams: ['h1', 'h2', 'h3', 'h4'] },
  { id: 'I', teams: ['i1', 'i2', 'i3', 'i4'] },
  { id: 'J', teams: ['j1', 'j2', 'j3', 'j4'] },
  { id: 'K', teams: ['k1', 'k2', 'k3', 'k4'] },
  { id: 'L', teams: ['l1', 'l2', 'l3', 'l4'] },
];

export const GROUP_MAP = Object.fromEntries(GROUPS.map(g => [g.id, g]));

// Venues
const V = {
  // USA
  metlife: { venue: 'MetLife Stadium', city: 'East Rutherford', country: 'USA' as const },
  sofi: { venue: 'SoFi Stadium', city: 'Inglewood', country: 'USA' as const },
  atandt: { venue: 'AT&T Stadium', city: 'Arlington', country: 'USA' as const },
  hardrock: { venue: 'Hard Rock Stadium', city: 'Miami Gardens', country: 'USA' as const },
  mercedes: { venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA' as const },
  gillette: { venue: 'Gillette Stadium', city: 'Foxborough', country: 'USA' as const },
  lumen: { venue: 'Lumen Field', city: 'Seattle', country: 'USA' as const },
  lincoln: { venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA' as const },
  arrowhead: { venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA' as const },
  levis: { venue: "Levi's Stadium", city: 'Santa Clara', country: 'USA' as const },
  // Mexico
  azteca: { venue: 'Estadio Azteca', city: 'Cidade do México', country: 'MEX' as const },
  guadalajara: { venue: 'Estadio Akron', city: 'Guadalajara', country: 'MEX' as const },
  monterrey: { venue: 'Estadio BBVA', city: 'Monterrey', country: 'MEX' as const },
  // Canada
  bmo: { venue: 'BMO Field', city: 'Toronto', country: 'CAN' as const },
  bcplace: { venue: 'BC Place', city: 'Vancouver', country: 'CAN' as const },
};

// Helper to create group matches
function gm(
  id: string, group: string, round: number,
  home: number, away: number,
  date: string, time: string,
  v: keyof typeof V
) {
  const g = GROUP_MAP[group];
  return {
    id,
    phase: 'group' as const,
    group,
    round,
    homeTeam: g.teams[home],
    awayTeam: g.teams[away],
    date,
    time,
    venue: V[v].venue,
    city: V[v].city,
    country: V[v].country,
    homeScore: null as number | null,
    awayScore: null as number | null,
    status: 'upcoming' as const,
  };
}

// All times in UTC. Brasília is UTC-3.
// Group stage: June 11-27, 2026
// Typical kickoff: 18:00, 21:00, 00:00 UTC (15h, 18h, 21h Brasília)

export const GROUP_MATCHES = [
  // === MATCHDAY 1 === June 11-15
  gm('G_A1_1', 'A', 1, 0, 1, '2026-06-11', '21:00', 'azteca'),       // Mexico vs A2
  gm('G_A1_2', 'A', 1, 2, 3, '2026-06-11', '18:00', 'guadalajara'),   // A3 vs A4
  gm('G_B1_1', 'B', 1, 0, 1, '2026-06-12', '00:00', 'bmo'),           // Canada vs B2
  gm('G_B1_2', 'B', 1, 2, 3, '2026-06-11', '21:00', 'bcplace'),       // B3 vs B4
  gm('G_C1_1', 'C', 1, 0, 1, '2026-06-12', '18:00', 'sofi'),          // Brazil vs Morocco
  gm('G_C1_2', 'C', 1, 2, 3, '2026-06-12', '21:00', 'hardrock'),      // Scotland vs Haiti
  gm('G_D1_1', 'D', 1, 0, 1, '2026-06-12', '21:00', 'metlife'),       // USA vs D2
  gm('G_D1_2', 'D', 1, 2, 3, '2026-06-12', '18:00', 'sofi'),          // D3 vs D4

  gm('G_E1_1', 'E', 1, 0, 1, '2026-06-13', '18:00', 'lumen'),         // E1 vs E2
  gm('G_E1_2', 'E', 1, 2, 3, '2026-06-13', '21:00', 'lumen'),         // E3 vs E4
  gm('G_F1_1', 'F', 1, 0, 1, '2026-06-13', '18:00', 'atandt'),        // F1 vs F2
  gm('G_F1_2', 'F', 1, 2, 3, '2026-06-13', '21:00', 'arrowhead'),     // F3 vs F4

  gm('G_G1_1', 'G', 1, 0, 1, '2026-06-14', '18:00', 'mercedes'),      // G1 vs G2
  gm('G_G1_2', 'G', 1, 2, 3, '2026-06-14', '21:00', 'mercedes'),      // G3 vs G4
  gm('G_H1_1', 'H', 1, 0, 1, '2026-06-14', '18:00', 'gillette'),      // H1 vs H2
  gm('G_H1_2', 'H', 1, 2, 3, '2026-06-14', '21:00', 'lincoln'),       // H3 vs H4

  gm('G_I1_1', 'I', 1, 0, 1, '2026-06-15', '18:00', 'levis'),         // I1 vs I2
  gm('G_I1_2', 'I', 1, 2, 3, '2026-06-15', '21:00', 'levis'),         // I3 vs I4
  gm('G_J1_1', 'J', 1, 0, 1, '2026-06-15', '18:00', 'hardrock'),      // J1 vs J2
  gm('G_J1_2', 'J', 1, 2, 3, '2026-06-15', '21:00', 'arrowhead'),     // J3 vs J4
  gm('G_K1_1', 'K', 1, 0, 1, '2026-06-15', '00:00', 'gillette'),      // K1 vs K2
  gm('G_K1_2', 'K', 1, 2, 3, '2026-06-15', '18:00', 'lincoln'),       // K3 vs K4
  gm('G_L1_1', 'L', 1, 0, 1, '2026-06-16', '00:00', 'atandt'),        // L1 vs L2
  gm('G_L1_2', 'L', 1, 2, 3, '2026-06-15', '21:00', 'lumen'),         // L3 vs L4

  // === MATCHDAY 2 === June 16-22
  gm('G_A2_1', 'A', 2, 0, 2, '2026-06-16', '21:00', 'guadalajara'),   // Mexico vs A3
  gm('G_A2_2', 'A', 2, 1, 3, '2026-06-16', '18:00', 'monterrey'),     // A2 vs A4
  gm('G_B2_1', 'B', 2, 0, 2, '2026-06-17', '00:00', 'bcplace'),       // Canada vs B3
  gm('G_B2_2', 'B', 2, 1, 3, '2026-06-17', '21:00', 'bmo'),           // B2 vs B4
  gm('G_C2_1', 'C', 2, 0, 2, '2026-06-17', '18:00', 'hardrock'),      // Brazil vs Scotland
  gm('G_C2_2', 'C', 2, 1, 3, '2026-06-17', '21:00', 'sofi'),          // Morocco vs Haiti
  gm('G_D2_1', 'D', 2, 0, 2, '2026-06-17', '21:00', 'sofi'),          // USA vs D3
  gm('G_D2_2', 'D', 2, 1, 3, '2026-06-17', '18:00', 'metlife'),       // D2 vs D4

  gm('G_E2_1', 'E', 2, 0, 2, '2026-06-18', '18:00', 'lumen'),         // E1 vs E3
  gm('G_E2_2', 'E', 2, 1, 3, '2026-06-18', '21:00', 'lumen'),         // E2 vs E4
  gm('G_F2_1', 'F', 2, 0, 2, '2026-06-18', '18:00', 'arrowhead'),     // F1 vs F3
  gm('G_F2_2', 'F', 2, 1, 3, '2026-06-18', '21:00', 'atandt'),        // F2 vs F4

  gm('G_G2_1', 'G', 2, 0, 2, '2026-06-19', '18:00', 'mercedes'),      // G1 vs G3
  gm('G_G2_2', 'G', 2, 1, 3, '2026-06-19', '21:00', 'gillette'),      // G2 vs G4
  gm('G_H2_1', 'H', 2, 0, 2, '2026-06-19', '18:00', 'lincoln'),       // H1 vs H3
  gm('G_H2_2', 'H', 2, 1, 3, '2026-06-19', '21:00', 'mercedes'),      // H2 vs H4

  gm('G_I2_1', 'I', 2, 0, 2, '2026-06-20', '18:00', 'levis'),         // I1 vs I3
  gm('G_I2_2', 'I', 2, 1, 3, '2026-06-20', '21:00', 'hardrock'),      // I2 vs I4
  gm('G_J2_1', 'J', 2, 0, 2, '2026-06-20', '18:00', 'arrowhead'),     // J1 vs J3
  gm('G_J2_2', 'J', 2, 1, 3, '2026-06-20', '21:00', 'hardrock'),      // J2 vs J4
  gm('G_K2_1', 'K', 2, 0, 2, '2026-06-21', '00:00', 'gillette'),      // K1 vs K3
  gm('G_K2_2', 'K', 2, 1, 3, '2026-06-21', '18:00', 'lincoln'),       // K2 vs K4
  gm('G_L2_1', 'L', 2, 0, 2, '2026-06-21', '00:00', 'atandt'),        // L1 vs L3
  gm('G_L2_2', 'L', 2, 1, 3, '2026-06-20', '21:00', 'lumen'),         // L2 vs L4

  // === MATCHDAY 3 === June 22-27
  gm('G_A3_1', 'A', 3, 0, 3, '2026-06-22', '21:00', 'azteca'),        // Mexico vs A4
  gm('G_A3_2', 'A', 3, 1, 2, '2026-06-22', '21:00', 'monterrey'),     // A2 vs A3
  gm('G_B3_1', 'B', 3, 0, 3, '2026-06-23', '00:00', 'bmo'),           // Canada vs B4
  gm('G_B3_2', 'B', 3, 1, 2, '2026-06-23', '21:00', 'bcplace'),       // B2 vs B3
  gm('G_C3_1', 'C', 3, 0, 3, '2026-06-23', '18:00', 'sofi'),          // Brazil vs Haiti
  gm('G_C3_2', 'C', 3, 1, 2, '2026-06-23', '21:00', 'hardrock'),      // Morocco vs Scotland
  gm('G_D3_1', 'D', 3, 0, 3, '2026-06-23', '21:00', 'metlife'),       // USA vs D4
  gm('G_D3_2', 'D', 3, 1, 2, '2026-06-23', '18:00', 'sofi'),          // D2 vs D3

  gm('G_E3_1', 'E', 3, 0, 3, '2026-06-24', '18:00', 'lumen'),         // E1 vs E4
  gm('G_E3_2', 'E', 3, 1, 2, '2026-06-24', '21:00', 'lumen'),         // E2 vs E3
  gm('G_F3_1', 'F', 3, 0, 3, '2026-06-24', '18:00', 'atandt'),        // F1 vs F4
  gm('G_F3_2', 'F', 3, 1, 2, '2026-06-24', '21:00', 'arrowhead'),     // F2 vs F3

  gm('G_G3_1', 'G', 3, 0, 3, '2026-06-25', '18:00', 'mercedes'),      // G1 vs G4
  gm('G_G3_2', 'G', 3, 1, 2, '2026-06-25', '21:00', 'gillette'),      // G2 vs G3
  gm('G_H3_1', 'H', 3, 0, 3, '2026-06-25', '18:00', 'lincoln'),       // H1 vs H4
  gm('G_H3_2', 'H', 3, 1, 2, '2026-06-25', '21:00', 'mercedes'),      // H2 vs H3

  gm('G_I3_1', 'I', 3, 0, 3, '2026-06-26', '18:00', 'levis'),         // I1 vs I4
  gm('G_I3_2', 'I', 3, 1, 2, '2026-06-26', '21:00', 'hardrock'),      // I2 vs I3
  gm('G_J3_1', 'J', 3, 0, 3, '2026-06-26', '18:00', 'arrowhead'),     // J1 vs J4
  gm('G_J3_2', 'J', 3, 1, 2, '2026-06-26', '21:00', 'hardrock'),      // J2 vs J3
  gm('G_K3_1', 'K', 3, 0, 3, '2026-06-27', '00:00', 'gillette'),      // K1 vs K4
  gm('G_K3_2', 'K', 3, 1, 2, '2026-06-27', '18:00', 'lincoln'),       // K2 vs K3
  gm('G_L3_1', 'L', 3, 0, 3, '2026-06-27', '00:00', 'atandt'),        // L1 vs L4
  gm('G_L3_2', 'L', 3, 1, 2, '2026-06-27', '21:00', 'lumen'),         // L2 vs L3
];

// Bracket configuration for knockout stage
// Each R32 match defines its home/away slot references
export const BRACKET_CONFIG = {
  // Round of 32 - slot references
  r32: [
    { id: 'R32-01', homeSlot: '1A',  awaySlot: '2B',   date: '2026-06-29', venue: 'SoFi Stadium',         city: 'Inglewood' },
    { id: 'R32-02', homeSlot: '1C',  awaySlot: '3DEF_1', date: '2026-06-29', venue: 'SoFi Stadium',         city: 'Inglewood' },
    { id: 'R32-03', homeSlot: '1E',  awaySlot: '2D',   date: '2026-06-30', venue: "Levi's Stadium",        city: 'Santa Clara' },
    { id: 'R32-04', homeSlot: '1G',  awaySlot: '3ABC_1', date: '2026-06-30', venue: "Levi's Stadium",        city: 'Santa Clara' },
    { id: 'R32-05', homeSlot: '2G',  awaySlot: '2H',   date: '2026-06-30', venue: 'Lumen Field',           city: 'Seattle' },
    { id: 'R32-06', homeSlot: '1B',  awaySlot: '3ADEF_1', date: '2026-07-01', venue: 'Lumen Field',           city: 'Seattle' },
    { id: 'R32-07', homeSlot: '1F',  awaySlot: '2E',   date: '2026-07-01', venue: 'Gillette Stadium',      city: 'Foxborough' },
    { id: 'R32-08', homeSlot: '1D',  awaySlot: '2C',   date: '2026-07-01', venue: 'Gillette Stadium',      city: 'Foxborough' },
    { id: 'R32-09', homeSlot: '1I',  awaySlot: '3GHI_1', date: '2026-07-02', venue: 'Lincoln Financial Field', city: 'Philadelphia' },
    { id: 'R32-10', homeSlot: '1K',  awaySlot: '3JKL_1', date: '2026-07-02', venue: 'Lincoln Financial Field', city: 'Philadelphia' },
    { id: 'R32-11', homeSlot: '2I',  awaySlot: '2J',   date: '2026-07-02', venue: 'AT&T Stadium',         city: 'Arlington' },
    { id: 'R32-12', homeSlot: '2K',  awaySlot: '2L',   date: '2026-07-02', venue: 'AT&T Stadium',         city: 'Arlington' },
    { id: 'R32-13', homeSlot: '1J',  awaySlot: '3GHI_2', date: '2026-07-03', venue: 'Arrowhead Stadium',    city: 'Kansas City' },
    { id: 'R32-14', homeSlot: '1L',  awaySlot: '3JKL_2', date: '2026-07-03', venue: 'Arrowhead Stadium',    city: 'Kansas City' },
    { id: 'R32-15', homeSlot: '2A',  awaySlot: '2F',   date: '2026-07-03', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
    { id: 'R32-16', homeSlot: '1H',  awaySlot: '3DEF_2', date: '2026-07-03', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  ] as const,
  // R16 pairings: which R32 matches feed into each R16 match
  r16: [
    { id: 'R16-01', feederHome: 'R32-01', feederAway: 'R32-02', date: '2026-07-05', venue: 'SoFi Stadium',         city: 'Inglewood' },
    { id: 'R16-02', feederHome: 'R32-03', feederAway: 'R32-04', date: '2026-07-05', venue: "Levi's Stadium",        city: 'Santa Clara' },
    { id: 'R16-03', feederHome: 'R32-05', feederAway: 'R32-06', date: '2026-07-06', venue: 'Lumen Field',           city: 'Seattle' },
    { id: 'R16-04', feederHome: 'R32-07', feederAway: 'R32-08', date: '2026-07-06', venue: 'Gillette Stadium',      city: 'Foxborough' },
    { id: 'R16-05', feederHome: 'R32-09', feederAway: 'R32-10', date: '2026-07-06', venue: 'Lincoln Financial Field', city: 'Philadelphia' },
    { id: 'R16-06', feederHome: 'R32-11', feederAway: 'R32-12', date: '2026-07-06', venue: 'AT&T Stadium',         city: 'Arlington' },
    { id: 'R16-07', feederHome: 'R32-13', feederAway: 'R32-14', date: '2026-07-07', venue: 'Arrowhead Stadium',    city: 'Kansas City' },
    { id: 'R16-08', feederHome: 'R32-15', feederAway: 'R32-16', date: '2026-07-07', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  ] as const,
  // Quarterfinals
  qf: [
    { id: 'QF-01', feederHome: 'R16-01', feederAway: 'R16-02', date: '2026-07-09', venue: 'SoFi Stadium',         city: 'Inglewood' },
    { id: 'QF-02', feederHome: 'R16-03', feederAway: 'R16-04', date: '2026-07-10', venue: 'Gillette Stadium',      city: 'Foxborough' },
    { id: 'QF-03', feederHome: 'R16-05', feederAway: 'R16-06', date: '2026-07-10', venue: 'AT&T Stadium',         city: 'Arlington' },
    { id: 'QF-04', feederHome: 'R16-07', feederAway: 'R16-08', date: '2026-07-11', venue: 'Arrowhead Stadium',    city: 'Kansas City' },
  ] as const,
  // Semifinals
  sf: [
    { id: 'SF-01', feederHome: 'QF-01', feederAway: 'QF-02', date: '2026-07-14', venue: 'SoFi Stadium',   city: 'Inglewood' },
    { id: 'SF-02', feederHome: 'QF-03', feederAway: 'QF-04', date: '2026-07-15', venue: 'AT&T Stadium',   city: 'Arlington' },
  ] as const,
  // Third place
  third_place: { id: '3RD', feederHome: 'SF-01', feederAway: 'SF-02', date: '2026-07-18', venue: 'Hard Rock Stadium', city: 'Miami Gardens' },
  // Final
  final: { id: 'FINAL', feederHome: 'SF-01', feederAway: 'SF-02', date: '2026-07-19', venue: 'MetLife Stadium', city: 'East Rutherford' },
};

// Third-place pools for bracket slot assignment
export const THIRD_PLACE_POOLS = {
  '3ABC_1': { groups: ['A', 'B', 'C'], index: 0, label: 'Melhor 3° de A/B/C' },
  '3ABC_2': { groups: ['A', 'B', 'C'], index: 1, label: '2° melhor 3° de A/B/C' },
  '3DEF_1': { groups: ['D', 'E', 'F'], index: 0, label: 'Melhor 3° de D/E/F' },
  '3DEF_2': { groups: ['D', 'E', 'F'], index: 1, label: '2° melhor 3° de D/E/F' },
  '3GHI_1': { groups: ['G', 'H', 'I'], index: 0, label: 'Melhor 3° de G/H/I' },
  '3GHI_2': { groups: ['G', 'H', 'I'], index: 1, label: '2° melhor 3° de G/H/I' },
  '3JKL_1': { groups: ['J', 'K', 'L'], index: 0, label: 'Melhor 3° de J/K/L' },
  '3JKL_2': { groups: ['J', 'K', 'L'], index: 1, label: '2° melhor 3° de J/K/L' },
  '3ADEF_1': { groups: ['A', 'D', 'E', 'F'], index: 0, label: 'Melhor 3° de A/D/E/F' },
} as const;

export const TIMEZONES = [
  { label: 'Brasília', offset: 'America/Sao_Paulo', utcLabel: 'UTC-3' },
  { label: 'UTC', offset: 'UTC', utcLabel: 'UTC+0' },
  { label: 'Cidade do México', offset: 'America/Mexico_City', utcLabel: 'UTC-6' },
  { label: 'New York', offset: 'America/New_York', utcLabel: 'UTC-5/-4' },
  { label: 'Los Angeles', offset: 'America/Los_Angeles', utcLabel: 'UTC-8/-7' },
  { label: 'Londres', offset: 'Europe/London', utcLabel: 'UTC+0/+1' },
  { label: 'Tóquio', offset: 'Asia/Tokyo', utcLabel: 'UTC+9' },
];