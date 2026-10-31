import { encodeGuestName } from '../src/lib/invitation.js';

const name = process.argv[2]?.trim();
if (!name || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
  console.error('Usage: pnpm invite "Guest name" [https://your-domain.example]');
  process.exit(1);
}
const url = new URL('/', process.argv[3] || 'http://localhost:6008');
url.searchParams.set('n', encodeGuestName(name));
console.log(url.href);
