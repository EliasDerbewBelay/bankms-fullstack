import { env } from './env';

/** Parse comma-separated CORS_ORIGIN into normalized origin list (no trailing slashes). */
export function getAllowedOrigins(): string[] {
  return env.CORS_ORIGIN.split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/** Dynamic CORS origin check — supports multiple origins and optional Vercel previews. */
export function corsOriginDelegate(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void {
  // Same-origin / server-to-server / curl / Postman
  if (!origin) {
    callback(null, true);
    return;
  }

  const normalizedOrigin = origin.replace(/\/+$/, '');
  const allowed = getAllowedOrigins();

  if (allowed.includes(normalizedOrigin)) {
    callback(null, true);
    return;
  }

  if (
    env.CORS_ALLOW_VERCEL_PREVIEWS === 'true' &&
    /^https:\/\/[\w.-]+\.vercel\.app$/.test(normalizedOrigin)
  ) {
    callback(null, true);
    return;
  }

  // Reject silently — do not pass Error or Express returns 500 on preflight
  callback(null, false);
}
