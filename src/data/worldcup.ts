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

  // ===== GROUP K: Portugal, RD Congo, Uzbequistão, Colômbia =====
  portugal:     { id: 'portugal',     code: 'pt', name: 'Portugal',         flag: 'pt' },
  dr_congo:     { id: 'dr_congo',     code: 'cd', name: 'RD Congo',        flag: 'cd' },
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
  { id: 'K', teams: ['portugal', 'dr_congo', 'uzbekistan', 'colombia'] },
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

// All times in UTC. Sourced from ESPN API.
// Group stage: June 11-28, 2026

export const GROUP_MATCHES = [
  // === MATCHDAY 1 ===
  gm('G_A1_1', 'A', 1, 0, 1, '2026-06-11', '19:00', 'azteca'),       // MEX vs RSA
  gm('G_A1_2', 'A', 1, 2, 3, '2026-06-12', '02:00', 'guadalajara'),   // KOR vs CZE
  gm('G_B1_1', 'B', 1, 0, 1, '2026-06-12', '19:00', 'bmo'),           // CAN vs BIH
  gm('G_B1_2', 'B', 1, 2, 3, '2026-06-13', '19:00', 'bcplace'),       // QAT vs SUI
  gm('G_C1_1', 'C', 1, 0, 1, '2026-06-13', '22:00', 'sofi'),          // BRA vs MAR
  gm('G_C1_2', 'C', 1, 2, 3, '2026-06-14', '01:00', 'hardrock'),      // SCO vs HAI
  gm('G_D1_1', 'D', 1, 0, 1, '2026-06-13', '01:00', 'metlife'),       // USA vs PAR
  gm('G_D1_2', 'D', 1, 2, 3, '2026-06-14', '04:00', 'sofi'),          // AUS vs TUR

  gm('G_E1_1', 'E', 1, 0, 1, '2026-06-14', '17:00', 'lumen'),         // GER vs CUW
  gm('G_E1_2', 'E', 1, 2, 3, '2026-06-14', '23:00', 'lincoln'),       // CIV vs ECU
  gm('G_F1_1', 'F', 1, 0, 1, '2026-06-14', '20:00', 'atandt'),        // NED vs JPN
  gm('G_F1_2', 'F', 1, 2, 3, '2026-06-15', '02:00', 'arrowhead'),     // SWE vs TUN

  gm('G_G1_1', 'G', 1, 0, 1, '2026-06-15', '19:00', 'mercedes'),      // BEL vs EGY
  gm('G_G1_2', 'G', 1, 2, 3, '2026-06-16', '01:00', 'lumen'),         // IRN vs NZL
  gm('G_H1_1', 'H', 1, 0, 1, '2026-06-15', '16:00', 'mercedes'),      // ESP vs CPV
  gm('G_H1_2', 'H', 1, 2, 3, '2026-06-15', '22:00', 'hardrock'),      // KSA vs URU

  gm('G_I1_1', 'I', 1, 0, 1, '2026-06-16', '19:00', 'metlife'),       // FRA vs SEN
  gm('G_I1_2', 'I', 1, 2, 3, '2026-06-16', '22:00', 'gillette'),      // IRQ vs NOR
  gm('G_J1_1', 'J', 1, 0, 1, '2026-06-17', '01:00', 'arrowhead'),     // ARG vs ALG
  gm('G_J1_2', 'J', 1, 2, 3, '2026-06-17', '04:00', 'levis'),         // AUT vs JOR
  gm('G_K1_1', 'K', 1, 0, 1, '2026-06-17', '17:00', 'gillette'),      // POR vs COD
  gm('G_K1_2', 'K', 1, 2, 3, '2026-06-18', '02:00', 'lincoln'),       // UZB vs COL
  gm('G_L1_1', 'L', 1, 0, 1, '2026-06-17', '20:00', 'atandt'),        // ENG vs CRO
  gm('G_L1_2', 'L', 1, 2, 3, '2026-06-17', '23:00', 'bmo'),           // GHA vs PAN

  // === MATCHDAY 2 ===
  gm('G_A2_1', 'A', 2, 0, 2, '2026-06-19', '01:00', 'guadalajara'),   // MEX vs KOR
  gm('G_A2_2', 'A', 2, 1, 3, '2026-06-18', '16:00', 'mercedes'),      // RSA vs CZE
  gm('G_B2_1', 'B', 2, 0, 2, '2026-06-18', '22:00', 'bcplace'),       // CAN vs QAT
  gm('G_B2_2', 'B', 2, 1, 3, '2026-06-18', '19:00', 'sofi'),          // BIH vs SUI
  gm('G_C2_1', 'C', 2, 0, 2, '2026-06-19', '22:00', 'gillette'),      // BRA vs SCO
  gm('G_C2_2', 'C', 2, 1, 3, '2026-06-20', '22:00', 'hardrock'),      // MAR vs HAI
  gm('G_D2_1', 'D', 2, 0, 2, '2026-06-19', '19:00', 'lumen'),         // USA vs AUS
  gm('G_D2_2', 'D', 2, 1, 3, '2026-06-20', '03:00', 'levis'),         // PAR vs TUR

  gm('G_E2_1', 'E', 2, 0, 2, '2026-06-20', '20:00', 'bmo'),           // GER vs CIV
  gm('G_E2_2', 'E', 2, 1, 3, '2026-06-21', '00:00', 'arrowhead'),     // CUW vs ECU
  gm('G_F2_1', 'F', 2, 0, 2, '2026-06-20', '17:00', 'atandt'),        // NED vs SWE
  gm('G_F2_2', 'F', 2, 1, 3, '2026-06-21', '04:00', 'arrowhead'),     // JPN vs TUN

  gm('G_G2_1', 'G', 2, 0, 2, '2026-06-21', '19:00', 'sofi'),          // BEL vs IRN
  gm('G_G2_2', 'G', 2, 1, 3, '2026-06-22', '01:00', 'bcplace'),       // EGY vs NZL
  gm('G_H2_1', 'H', 2, 0, 2, '2026-06-21', '16:00', 'mercedes'),      // ESP vs KSA
  gm('G_H2_2', 'H', 2, 1, 3, '2026-06-21', '22:00', 'hardrock'),      // CPV vs URU

  gm('G_I2_1', 'I', 2, 0, 2, '2026-06-22', '21:00', 'lincoln'),       // FRA vs IRQ
  gm('G_I2_2', 'I', 2, 1, 3, '2026-06-23', '00:00', 'metlife'),       // SEN vs NOR
  gm('G_J2_1', 'J', 2, 0, 2, '2026-06-22', '17:00', 'atandt'),        // ARG vs AUT
  gm('G_J2_2', 'J', 2, 1, 3, '2026-06-23', '03:00', 'levis'),         // ALG vs JOR
  gm('G_K2_1', 'K', 2, 0, 2, '2026-06-23', '17:00', 'gillette'),      // POR vs UZB
  gm('G_K2_2', 'K', 2, 1, 3, '2026-06-24', '02:00', 'guadalajara'),   // COD vs COL
  gm('G_L2_1', 'L', 2, 0, 2, '2026-06-23', '20:00', 'atandt'),        // ENG vs GHA
  gm('G_L2_2', 'L', 2, 1, 3, '2026-06-23', '23:00', 'bmo'),           // CRO vs PAN

  // === MATCHDAY 3 ===
  gm('G_A3_1', 'A', 3, 0, 3, '2026-06-25', '01:00', 'azteca'),        // MEX vs CZE
  gm('G_A3_2', 'A', 3, 1, 2, '2026-06-25', '01:00', 'arrowhead'),     // RSA vs KOR
  gm('G_B3_1', 'B', 3, 0, 3, '2026-06-24', '19:00', 'lumen'),         // CAN vs SUI
  gm('G_B3_2', 'B', 3, 1, 2, '2026-06-24', '19:00', 'sofi'),          // BIH vs QAT
  gm('G_C3_1', 'C', 3, 0, 3, '2026-06-25', '22:00', 'lincoln'),       // BRA vs HAI
  gm('G_C3_2', 'C', 3, 1, 2, '2026-06-24', '22:00', 'hardrock'),      // MAR vs SCO
  gm('G_D3_1', 'D', 3, 0, 3, '2026-06-26', '02:00', 'sofi'),          // USA vs TUR
  gm('G_D3_2', 'D', 3, 1, 2, '2026-06-26', '02:00', 'metlife'),       // PAR vs AUS

  gm('G_E3_1', 'E', 3, 0, 3, '2026-06-25', '20:00', 'lumen'),         // GER vs ECU
  gm('G_E3_2', 'E', 3, 1, 2, '2026-06-25', '20:00', 'lincoln'),       // CUW vs CIV
  gm('G_F3_1', 'F', 3, 0, 3, '2026-06-25', '23:00', 'arrowhead'),     // NED vs TUN
  gm('G_F3_2', 'F', 3, 1, 2, '2026-06-25', '23:00', 'atandt'),        // JPN vs SWE

  gm('G_G3_1', 'G', 3, 0, 3, '2026-06-27', '03:00', 'bcplace'),       // BEL vs NZL
  gm('G_G3_2', 'G', 3, 1, 2, '2026-06-27', '03:00', 'lumen'),         // EGY vs IRN
  gm('G_H3_1', 'H', 3, 0, 3, '2026-06-27', '00:00', 'guadalajara'),   // ESP vs URU
  gm('G_H3_2', 'H', 3, 1, 2, '2026-06-27', '00:00', 'gillette'),      // CPV vs KSA

  gm('G_I3_1', 'I', 3, 0, 3, '2026-06-26', '19:00', 'gillette'),      // FRA vs NOR
  gm('G_I3_2', 'I', 3, 1, 2, '2026-06-26', '19:00', 'bmo'),           // SEN vs IRQ
  gm('G_J3_1', 'J', 3, 0, 3, '2026-06-28', '02:00', 'arrowhead'),     // ARG vs JOR
  gm('G_J3_2', 'J', 3, 1, 2, '2026-06-28', '02:00', 'atandt'),        // ALG vs AUT
  gm('G_K3_1', 'K', 3, 0, 3, '2026-06-27', '23:30', 'hardrock'),      // POR vs COL
  gm('G_K3_2', 'K', 3, 1, 2, '2026-06-27', '23:30', 'mercedes'),      // COD vs UZB
  gm('G_L3_1', 'L', 3, 0, 3, '2026-06-27', '21:00', 'lincoln'),       // ENG vs PAN
  gm('G_L3_2', 'L', 3, 1, 2, '2026-06-27', '21:00', 'sofi'),          // CRO vs GHA
];

// ============================================================
// Official FIFA World Cup 2026 Knockout Bracket
// Source: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/knockout-stage-match-schedule-bracket
// 48 teams → 12 groups → Top 2 (24) + 8 best 3rd (8) = 32 in R32
// ============================================================

export const BRACKET_CONFIG = {
  // Round of 32 — 16 matches (M73–M88)
  // Dates, times, venues sourced from ESPN — real FIFA 2026 schedule
  r32: [
    { id: 'R32-01', homeSlot: '2A',  awaySlot: '2B',      date: '2026-06-28', time: '19:00', venue: 'SoFi Stadium',             city: 'Inglewood' },
    { id: 'R32-02', homeSlot: '1E',  awaySlot: '3_ABCDF',  date: '2026-06-29', time: '20:30', venue: 'Gillette Stadium',         city: 'Foxborough' },
    { id: 'R32-03', homeSlot: '1F',  awaySlot: '2C',      date: '2026-06-30', time: '01:00', venue: 'Estadio BBVA',            city: 'Guadalupe' },
    { id: 'R32-04', homeSlot: '1C',  awaySlot: '2F',      date: '2026-06-29', time: '17:00', venue: 'NRG Stadium',              city: 'Houston' },
    { id: 'R32-05', homeSlot: '1I',  awaySlot: '3_CDFGH',  date: '2026-06-30', time: '21:00', venue: 'MetLife Stadium',         city: 'East Rutherford' },
    { id: 'R32-06', homeSlot: '2E',  awaySlot: '2I',      date: '2026-06-30', time: '17:00', venue: 'AT&T Stadium',            city: 'Arlington' },
    { id: 'R32-07', homeSlot: '1A',  awaySlot: '3_CEFHI',  date: '2026-07-01', time: '01:00', venue: 'Estadio Banorte',         city: 'Cidade do M\u00E9xico' },
    { id: 'R32-08', homeSlot: '1L',  awaySlot: '3_EHIJK',  date: '2026-07-01', time: '16:00', venue: 'Mercedes-Benz Stadium',   city: 'Atlanta' },
    { id: 'R32-09', homeSlot: '1D',  awaySlot: '3_BEFIJ',  date: '2026-07-02', time: '00:00', venue: "Levi's Stadium",           city: 'Santa Clara' },
    { id: 'R32-10', homeSlot: '1G',  awaySlot: '3_AEHIJ',  date: '2026-07-01', time: '20:00', venue: 'Lumen Field',              city: 'Seattle' },
    { id: 'R32-11', homeSlot: '2K',  awaySlot: '2L',      date: '2026-07-02', time: '23:00', venue: 'BMO Field',                city: 'Toronto' },
    { id: 'R32-12', homeSlot: '1H',  awaySlot: '2J',      date: '2026-07-02', time: '19:00', venue: 'SoFi Stadium',             city: 'Inglewood' },
    { id: 'R32-13', homeSlot: '1B',  awaySlot: '3_EFGIJ',  date: '2026-07-03', time: '03:00', venue: 'BC Place',                 city: 'Vancouver' },
    { id: 'R32-14', homeSlot: '1J',  awaySlot: '2H',      date: '2026-07-03', time: '22:00', venue: 'Hard Rock Stadium',       city: 'Miami Gardens' },
    { id: 'R32-15', homeSlot: '1K',  awaySlot: '3_DEIJL',  date: '2026-07-04', time: '01:30', venue: 'GEHA Field at Arrowhead Stadium', city: 'Kansas City' },
    { id: 'R32-16', homeSlot: '2D',  awaySlot: '2G',      date: '2026-07-03', time: '18:00', venue: 'AT&T Stadium',            city: 'Arlington' },
  ] as const,
  // Round of 16 — 8 matches (M89–M96)
  r16: [
    { id: 'R16-01', feederHome: 'R32-02', feederAway: 'R32-05', date: '2026-07-04', time: '21:00', venue: 'Lincoln Financial Field',  city: 'Philadelphia' },
    { id: 'R16-02', feederHome: 'R32-01', feederAway: 'R32-03', date: '2026-07-04', time: '17:00', venue: 'NRG Stadium',              city: 'Houston' },
    { id: 'R16-03', feederHome: 'R32-04', feederAway: 'R32-06', date: '2026-07-05', time: '20:00', venue: 'MetLife Stadium',         city: 'East Rutherford' },
    { id: 'R16-04', feederHome: 'R32-07', feederAway: 'R32-08', date: '2026-07-06', time: '00:00', venue: 'Estadio Banorte',         city: 'Cidade do M\u00E9xico' },
    { id: 'R16-05', feederHome: 'R32-11', feederAway: 'R32-12', date: '2026-07-06', time: '19:00', venue: 'AT&T Stadium',            city: 'Arlington' },
    { id: 'R16-06', feederHome: 'R32-09', feederAway: 'R32-10', date: '2026-07-07', time: '00:00', venue: 'Lumen Field',              city: 'Seattle' },
    { id: 'R16-07', feederHome: 'R32-14', feederAway: 'R32-16', date: '2026-07-07', time: '16:00', venue: 'Mercedes-Benz Stadium',   city: 'Atlanta' },
    { id: 'R16-08', feederHome: 'R32-13', feederAway: 'R32-15', date: '2026-07-07', time: '20:00', venue: 'BC Place',                 city: 'Vancouver' },
  ] as const,
  // Quarterfinals — 4 matches (M97–M100)
  qf: [
    { id: 'QF-01', feederHome: 'R16-01', feederAway: 'R16-02', date: '2026-07-09', time: '20:00', venue: 'Gillette Stadium',         city: 'Foxborough' },
    { id: 'QF-02', feederHome: 'R16-05', feederAway: 'R16-06', date: '2026-07-10', time: '19:00', venue: 'SoFi Stadium',             city: 'Inglewood' },
    { id: 'QF-03', feederHome: 'R16-03', feederAway: 'R16-04', date: '2026-07-11', time: '21:00', venue: 'Hard Rock Stadium',       city: 'Miami Gardens' },
    { id: 'QF-04', feederHome: 'R16-07', feederAway: 'R16-08', date: '2026-07-12', time: '01:00', venue: 'GEHA Field at Arrowhead Stadium', city: 'Kansas City' },
  ] as const,
  // Semifinals — 2 matches (M101–M102)
  sf: [
    { id: 'SF-01', feederHome: 'QF-01', feederAway: 'QF-02', date: '2026-07-14', time: '19:00', venue: 'AT&T Stadium',            city: 'Arlington' },
    { id: 'SF-02', feederHome: 'QF-03', feederAway: 'QF-04', date: '2026-07-15', time: '19:00', venue: 'Mercedes-Benz Stadium',   city: 'Atlanta' },
  ] as const,
  // Third place (M103)
  third_place: { id: '3RD', feederHome: 'SF-01', feederAway: 'SF-02', date: '2026-07-18', time: '21:00', venue: 'Hard Rock Stadium',       city: 'Miami Gardens' },
  // Final (M104)
  final: { id: 'FINAL', feederHome: 'SF-01', feederAway: 'SF-02', date: '2026-07-19', time: '19:00', venue: 'MetLife Stadium',         city: 'East Rutherford' },
};

// Third-place pools for R32 bracket slots
// Each pool: 5 groups → best qualified 3rd-place team from those groups
// No team faces a side from its own group in R32
export const THIRD_PLACE_POOLS = {
  '3_ABCDF': { groups: ['A', 'B', 'C', 'D', 'F'], label: 'Melhor 3° de A/B/C/D/F' },
  '3_CDFGH': { groups: ['C', 'D', 'F', 'G', 'H'], label: 'Melhor 3° de C/D/F/G/H' },
  '3_CEFHI': { groups: ['C', 'E', 'F', 'H', 'I'], label: 'Melhor 3° de C/E/F/H/I' },
  '3_EHIJK': { groups: ['E', 'H', 'I', 'J', 'K'], label: 'Melhor 3° de E/H/I/J/K' },
  '3_BEFIJ': { groups: ['B', 'E', 'F', 'I', 'J'], label: 'Melhor 3° de B/E/F/I/J' },
  '3_AEHIJ': { groups: ['A', 'E', 'H', 'I', 'J'], label: 'Melhor 3° de A/E/H/I/J' },
  '3_EFGIJ': { groups: ['E', 'F', 'G', 'I', 'J'], label: 'Melhor 3° de E/F/G/I/J' },
  '3_DEIJL': { groups: ['D', 'E', 'I', 'J', 'L'], label: 'Melhor 3° de D/E/I/J/L' },
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