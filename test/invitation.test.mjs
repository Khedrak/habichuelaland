import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendarEvent, encodeGuestName, decodeGuestName, getConfirmationUrl, invitationConfig, toTitleCaseName } from '../src/lib/invitation.js';

test('guest tokens roundtrip Unicode with compact URL-safe characters', () => {
  for (const name of ['Gerardo', 'María José', '王小明', 'Familia 🌙', '<script>alert(1)</script>']) {
    const token = encodeGuestName(name);
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    assert.equal(decodeGuestName(token), toTitleCaseName(name));
  }
});

test('guest names are title-cased across words, accents, and hyphens', () => {
  assert.equal(toTitleCaseName('  mARÍA   jOsÉ DE la  o  '), 'María   José De La  O');
  assert.equal(toTitleCaseName('ana-maría d’ávila'), 'Ana-María D’Ávila');
  assert.equal(decodeGuestName(encodeGuestName('fAbIaN uRbInA')), 'Fabian Urbina');
});

test('malformed, excessive and empty tokens use a friendly fallback', () => {
  for (const token of [null, '', '%invalid', 'a', '_w', 'x'.repeat(513), encodeGuestName(' '), encodeGuestName('a'.repeat(101))]) {
    assert.equal(decodeGuestName(token), invitationConfig.defaultGuest);
  }
});

test('WhatsApp uses the confirmed phone and a personalized message', () => {
  const url = new URL(getConfirmationUrl('María José'));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/56979381427');
  assert.match(url.searchParams.get('text'), /María José/);
  assert.match(url.searchParams.get('text'), /28 de noviembre/);
  assert.match(url.searchParams.get('text'), /Confirmo mi asistencia/);
  assert.match(url.searchParams.get('text'), /16:00 hrs/);
});

test('countdown date has an explicit offset and the configured celebration date', () => {
  assert.equal(invitationConfig.dateTime, '2026-11-28T16:00:00-03:00');
  assert.equal(new Date(invitationConfig.dateTime).toISOString(), '2026-11-28T19:00:00.000Z');
});


test('date display and weekday match the configured event date', () => {
  assert.equal(invitationConfig.day, '28');
  assert.equal(invitationConfig.weekday, 'sábado');
  assert.equal(invitationConfig.dateLabel, '28 de noviembre de 2026');
  assert.equal(invitationConfig.timeLabel, '16:00 hrs');
});

test('map links preserve the exact venue address', () => {
  assert.equal(invitationConfig.address, 'Alcalde Julio Arangua Nuñez Norte 399, Peñaflor');
  const directions = new URL(invitationConfig.mapsUrl);
  const embed = new URL(invitationConfig.embedUrl);
  assert.equal(directions.hostname, 'www.google.com');
  assert.equal(directions.searchParams.get('query'), invitationConfig.address);
  assert.equal(embed.searchParams.get('q'), invitationConfig.address);
  assert.equal(embed.searchParams.get('output'), 'embed');
});

test('calendar event includes the configured date, local start time, and address', () => {
  const event = createCalendarEvent();
  assert.match(event, /DTSTART:20261128T190000Z/);
  assert.match(event, /SUMMARY:Revelación de género/);
  assert.match(event, /LOCATION:Alcalde Julio Arangua Nuñez Norte 399\\, Peñaflor/);
});
