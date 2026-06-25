export function formatTime(utcTime: string, timezone: string): string {
  try {
    const [h, m] = utcTime.split(':').map(Number);
    const date = new Date(Date.UTC(2026, 0, 1, h, m));
    return date.toLocaleTimeString('pt-BR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return utcTime;
  }
}

/**
 * Convert a UTC date + UTC time to a local date string (YYYY-MM-DD)
 * in the given timezone. Used for calendar grouping.
 * e.g. UTC 2026-06-12 00:00 in America/Sao_Paulo → "2026-06-11"
 */
export function getLocalDate(utcDate: string, utcTime: string, timezone: string): string {
  try {
    const [h, m] = utcTime.split(':').map(Number);
    const date = new Date(
      `${utcDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`
    );
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // "YYYY-MM-DD"
  } catch {
    return utcDate;
  }
}

export function formatDate(isoDate: string, timezone: string): string {
  try {
    const date = new Date(isoDate + 'T12:00:00Z');
    return date.toLocaleDateString('pt-BR', {
      timeZone: timezone,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return isoDate;
  }
}

export function formatFullDateTime(isoDate: string, utcTime: string, timezone: string): string {
  try {
    const [h, m] = utcTime.split(':').map(Number);
    const date = new Date(`${isoDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);
    return date.toLocaleString('pt-BR', {
      timeZone: timezone,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return `${isoDate} ${utcTime}`;
  }
}