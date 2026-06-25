import { Team, GroupDef } from './types';

export const TEAMS: Record<string, Team> = {
  // ===== GROUP A: México, África do Sul, Coreia do Sul, Tchéquia =====
  mexico:       { id: 'mexico',       code: 'mx', name: 'México',           flag: 'mx' },
  south_africa: { id: 'south_africa', code: 'za', name: 'África do Sul',    flag: 'za' },
  south_korea:  { id: 'south_korea',  code: 'kr', name: 'Coreia do Sul',    flag: 'kr' },
  czechia:      { id: 'czechia',      code: 'cz', name: 'Tchéquia',         flag: 'cz' },

  // ===== GROUP B: Canadá, Bósnia, Catar, Suíça =====
  canada:       { id: 'canada',       code: 'ca', name: 'Canadá',           flag: 'ca' },
  bosnia:       { id: 'bosnia',       code: 'ba', name: 'Bósnia',           flag: 'ba' },
  qatar:        { id: 'qatar',        code: 'qa', name: 'Catar',            flag: 'qa' },
  switzerland:  { id: 'switzerland',  code: 'ch', name: 'Suíça',           flag: 'ch' },

  // ===== GROUP C: Brasil, Marrocos, Escócia, Haiti =====
  brazil:       { id: 'brazil',       code: 'br', name: 'Brasil',           flag: 'br' },
  morocco:      { id: 'morocco',      code: 'ma', name: 'Marrocos',         flag: 'ma' },
  scotland:     { id: 'scotland',     code: 'gb-sct', name: 'Escócia',     flag: 'gb-sct' },
  haiti:        { id: 'haiti',        code: 'ht', name: 'Haiti',            flag: 'ht' },

  // ===== GROUP D: EUA, Paraguai, Austrália, Turquia =====
  usa:          { id: 'usa',          code: 'us', name: 'Estados Unidos',   flag: 'us' },
  paraguay:     { id: 'paraguay',     code: 'py', name: 'Paraguai',         flag: 'py' },
  australia:    { id: 'australia',    code: 'au', name: 'Austrália',        flag: 'au' },
  turkey:       { id: 'turkey',       code: 'tr', name: 'Turquia',          flag: 'tr' },

  // ===== GROUP E: Alemanha, Curaçao, Costa do Marfim, Equador =====
  germany:      { id: 'germany',      code: 'de', name: 'Alemanha',         flag: 'de' },
  curacao:      { id: 'curacao',      code: 'cw', name: 'Curaçao',          flag: 'cw' },
  ivory_coast:  { id: 'ivory_coast',  code: 'ci', name: 'Costa do Marfim',  flag: 'ci' },
  ecuador:      { id: 'ecuador',      code: 'ec', name: 'Equador',          flag: 'ec' },

  // ===== GROUP F: Holanda, Japão, Suécia, Tunísia =====
  netherlands:  { id: 'netherlands',  code: 'nl', name: 'Holanda',          flag: 'nl' },
  japan:        { id: 'japan',        code: 'jp', name: 'Japão',            flag: 'jp' },
  sweden:       { id: 'sweden',       code: 'se', name: 'Suécia',           flag: 'se' },
  tunisia:      { id: 'tunisia',      code: 'tn', name: 'Tunísia',          flag: 'tn' },

  // ===== GROUP G: Bélgica, Egito, Irã, Nova Zelândia =====
  belgium:      { id: 'belgium',      code: 'be', name: 'Bélgica',          flag: 'be' },
  egypt:        { id: 'egypt',        code: 'eg', name: 'Egito',            flag: 'eg' },
  iran:         { id: 'iran',         code: 'ir', name: 'Irã',              flag: 'ir' },
  new_zealand:  { id: 'new_zealand',  code: 'nz', name: 'Nova Zelândia',     flag: 'nz' },

  // ===== GROUP H: Espanha, Cabo Verde, Arábia Saudita, Uruguai =====
  spain:        { id: 'spain',        code: 'es', name: 'Espanha',          flag: 'es' },
  cape_verde:   { id: 'cape_verde',   code: 'cv', name: 'Cabo Verde',       flag: 'cv' },
  saudi_arabia: { id: 'saudi_arabia', code: 'sa', name: 'Arábia Saudita',  flag: 'sa' },
  uruguay:      { id: 'uruguay',      code: 'uy', name: 'Uruguai',          flag: 'uy' },

  // ===== GROUP I: França, Senegal, Iraque, Noruega =====
  france:       { id: 'france',       code: 'fr', name: 'França',           flag: 'fr' },
  senegal:      { id: 'senegal',      code: 'sn', name: 'Senegal',          flag: 'sn' },
  iraq:         { id: 'iraq',         code: 'iq', name: 'Iraque',           flag: 'iq' },
  norway:       { id: 'norway',       code: 'no', name: 'Noruega',          flag: 'no' },

  // ===== GROUP J: Argentina, Argélia, Áustria, Jordânia =====
  argentina:    { id: 'argentina',    code: 'ar', name: 'Argentina',         flag: 'ar' },
  algeria:      { id: 'algeria',      code: 'dz', name: 'Argélia',          flag: 'dz' },
  austria:      { id: 'austria',      code: 'at', name: 'Áustria',          flag: 'at' },
  jordan:       { id: 'jordan',       code: 'jo', name: 'Jordânia',          flag: 'jo' },

  // ===== GROUP K: Portugal, Jamaica, Uzbequistão, Colômbia =====
  portugal:     { id: 'portugal',     code: 'pt', name: 'Portugal',         flag: 'pt' },
  jamaica:      { id: 'jamaica',      code: 'jm', name: 'Jamaica',          flag: 'jm' },
  uzbekistan:   { id: 'uzbekistan',   code: 'uz', name: 'Uzbequistão',      flag: 'uz' },
  colombia:     { id: 'colombia',     code: 'co', name: 'Colômbia',         flag: 'co' },

  // ===== GROUP L: Inglaterra, Croácia, Gana, Panamá =====
  england:      { id: 'england',      code: 'gb-eng', name: 'Inglaterra',      flag: 'gb-eng' },
  croatia:      { id: 'croatia',      code: 'hr', name: 'Croácia',          flag: 'hr' },
  ghana:        { id: 'ghana',        code: 'gh', name: 'Gana',             flag: 'gh' },
  panama:       { id: 'panama',       code: 'pa', name: 'Panamá',           flag: 'pa' },
};

export const GROUPS: GroupDef[] = [
  { id: 'A', teams: ['mexico', 'south_africa', 'south_korea', 'czechia'] },
  { id: 'B', teams: ['canada', 'bosnia', 'qatar', 'switzerland'] },
  { id: 'C', teams: ['brazil', 'morocco', 'scotland', 'haiti'] },
  { id: 'D', teams: ['usa', 'paraguay', 'australia', 'turkey'] },
  { id: 'E', teams: ['germany', 'curacao', 'ivory_coast', 'ecuador'] },
  { id: 'F', teams: ['netherlands', 'japan', 'sweden', 'tunisia'] },
  { id: 'G', teams: ['belgium', 'egypt', 'iran', 'new_zealand'] },
  { id: 'H', teams: ['spain', 'cape_verde', 'saudi_arabia', 'uruguay'] },
  { id: 'I', teams: ['france', 'senegal', 'iraq', 'norway'] },
  { id: 'J', teams: ['argentina', 'algeria', 'austria', 'jordan'] },
  { id: 'K', teams: ['portugal', 'jamaica', 'uzbekistan', 'colombia'] },
  { id: 'L', teams: ['england', 'croatia', 'ghana', 'panama'] },
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