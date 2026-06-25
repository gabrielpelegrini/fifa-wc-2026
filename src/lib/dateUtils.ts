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