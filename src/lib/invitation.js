const dateTime = '2026-11-28T16:00:00-03:00';
const dateOptions = { timeZone: 'America/Santiago' };
const eventDate = new Date(dateTime);
const address = 'Alcalde Julio Arangua Nuñez Norte 399, Peñaflor';
const timeLabel = `${new Intl.DateTimeFormat('es-CL', { ...dateOptions, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(eventDate)} hrs`;
export const invitationConfig = {
  dateTime,
  timeLabel,
  address,
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
  embedUrl: `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`,
  dateLabel: new Intl.DateTimeFormat('es-CL', { ...dateOptions, day: 'numeric', month: 'long', year: 'numeric' }).format(eventDate),
  day: new Intl.DateTimeFormat('es-CL', { ...dateOptions, day: 'numeric' }).format(eventDate),
  weekday: new Intl.DateTimeFormat('es-CL', { ...dateOptions, weekday: 'long' }).format(eventDate),
  month: new Intl.DateTimeFormat('es-CL', { ...dateOptions, month: 'long' }).format(eventDate),
  year: new Intl.DateTimeFormat('es-CL', { ...dateOptions, year: 'numeric' }).format(eventDate),
  phone: '56979381427',
  defaultGuest: 'Familia y amigos',
};

// Tokens obscure names in shared links; they are not encryption or access control.
export function toTitleCaseName(name) {
  return String(name ?? '')
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase('es-CL')
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_, separator, letter) => separator + letter.toLocaleUpperCase('es-CL'));
}

export function parseGuestName(token) {
  if (!token || token.length > 512 || !/^[A-Za-z0-9_-]+={0,2}$/.test(token)) return null;
  try {
    const bytes = Uint8Array.from(atob(token.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const name = new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim();
    return name && name.length <= 100 && !/[\u0000-\u001f\u007f]/.test(name) ? toTitleCaseName(name) : null;
  } catch { return null; }
}
export function decodeGuestName(token) {
  return parseGuestName(token) ?? invitationConfig.defaultGuest;
}
export function encodeGuestName(name) {
  const bytes = new TextEncoder().encode(name.trim());
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function getConfirmationUrl(guest) {
  const introduction = guest === invitationConfig.defaultGuest ? '¡Hola!' : `¡Hola! Soy ${guest}.`;
  const message = `${introduction} Confirmo mi asistencia a la revelación de género del ${invitationConfig.dateLabel} a las ${invitationConfig.timeLabel}. ¡Qué emoción acompañarlos!`;
  return `https://wa.me/${invitationConfig.phone}?text=${encodeURIComponent(message)}`;
}

export function createCalendarEvent() {
  const escape = value => String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const start = new Date(invitationConfig.dateTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Habichuelaland//Invitacion//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:gender-reveal-${start}@habichuelaland`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${start}`, 'SUMMARY:Revelación de género', `LOCATION:${escape(invitationConfig.address)}`,
    `DESCRIPTION:${escape(`Celebración de revelación de género. ${invitationConfig.timeLabel}.`)}`, 'END:VEVENT', 'END:VCALENDAR', ''
  ].join('\r\n');
}
