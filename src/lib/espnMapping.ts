/**
 * Mapping between ESPN 3-letter abbreviations and our internal team IDs.
 * Used to match ESPN API data to our GROUP_MATCHES.
 */

import { GROUP_MATCHES } from '@/data/worldcup';

// ESPN 3-letter abbreviation → our internal team ID
export const ESPN_TO_TEAM: Record<string, string> = {
  MEX: 'mexico',
  RSA: 'south_africa',
  KOR: 'south_korea',
  CZE: 'czechia',
  CAN: 'canada',
  BIH: 'bosnia',
  QAT: 'qatar',
  SUI: 'switzerland',
  USA: 'usa',
  PAR: 'paraguay',
  BRA: 'brazil',
  MAR: 'morocco',
  HAI: 'haiti',
  SCO: 'scotland',
  AUS: 'australia',
  TUR: 'turkey',
  GER: 'germany',
  CUW: 'curacao',
  CIV: 'ivory_coast',
  ECU: 'ecuador',
  NED: 'netherlands',
  JPN: 'japan',
  SWE: 'sweden',
  TUN: 'tunisia',
  BEL: 'belgium',
  EGY: 'egypt',
  IRN: 'iran',
  NZL: 'new_zealand',
  ESP: 'spain',
  CPV: 'cape_verde',
  KSA: 'saudi_arabia',
  URU: 'uruguay',
  FRA: 'france',
  SEN: 'senegal',
  IRQ: 'iraq',
  NOR: 'norway',
  ARG: 'argentina',
  ALG: 'algeria',
  AUT: 'austria',
  JOR: 'jordan',
  POR: 'portugal',
  UZB: 'uzbekistan',
  COL: 'colombia',
  ENG: 'england',
  CRO: 'croatia',
  GHA: 'ghana',
  PAN: 'panama',
  COD: 'dr_congo',
};

// Our internal team ID → ESPN 3-letter abbreviation
export const TEAM_TO_ESPN: Record<string, string> = Object.fromEntries(
  Object.entries(ESPN_TO_TEAM).map(([k, v]) => [v, k])
);

/**
 * Extract group letter from ESPN's altGameNote field.
 * e.g. "FIFA World Cup, Group A" → "A"
 */
export function extractGroup(altGameNote: string): string | null {
  const match = altGameNote.match(/Group\s+([A-L])/i);
  return match ? match[1].toUpperCase() : null;
}