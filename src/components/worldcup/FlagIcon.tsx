'use client';

import { TEAMS } from '@/data/worldcup';

const FLAG_BASE = 'https://flagcdn.com/w40/';

interface FlagIconProps {
  teamId: string;
  size?: number;
  className?: string;
}

export default function FlagIcon({ teamId, size = 24, className = '' }: FlagIconProps) {
  const team = TEAMS[teamId];

  if (!team || team.flag === 'tbd') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded bg-muted text-[11px] font-bold text-muted-foreground ${className}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={`${FLAG_BASE}${team.flag}.png`}
      alt={`${team.name} flag`}
      className={`inline-block rounded-sm object-cover ${className}`}
      style={{ width: size, height: size, minWidth: size }}
      loading="lazy"
    />
  );
}