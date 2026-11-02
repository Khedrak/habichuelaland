import { Buffer } from 'node:buffer';
import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from 'node:process';
import { defineMiddleware } from 'astro:middleware';

const ADMIN_USERNAME = 'admin';

function matchesCredentials(authorization: string | null, password: string): boolean {
  const encodedCredentials = authorization?.match(/^Basic\s+([A-Za-z0-9+/]+=*)$/i)?.[1];
  if (!encodedCredentials) return false;

  const provided = Buffer.from(encodedCredentials, 'base64');
  const expected = Buffer.from(`${ADMIN_USERNAME}:${password}`, 'utf8');

  // Hashing gives both values a fixed length for timingSafeEqual.
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Keep local development convenient; production and preview deployments remain protected.
  if (import.meta.env.DEV) return next();

  const pathname = context.url.pathname;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  if (!isAdminRoute) return next();

  const password = env.ADMIN_PASSWORD;
  if (!password) {
    return new Response('Admin authentication is not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  if (!matchesCredentials(context.request.headers.get('authorization'), password)) {
    return new Response('Authentication required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Invitation admin", charset="UTF-8"',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  const response = await next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
});
