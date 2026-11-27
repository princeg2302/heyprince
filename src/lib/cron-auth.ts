import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * Authenticate scheduled automation requests.
 *
 * Vercel's x-vercel-cron and User-Agent headers are request metadata, not
 * authentication. Production cron endpoints must use a configured secret.
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    // Fail closed in production. Local development can exercise handlers
    // without provisioning a production secret.
    return process.env.NODE_ENV !== 'production';
  }

  const authorization = request.headers.get('authorization') || '';
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const customHeader = request.headers.get('x-cron-secret')?.trim();
  const supplied = bearer || customHeader;

  if (!supplied) return false;

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const suppliedBuffer = Buffer.from(supplied, 'utf8');
  return expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer);
}
