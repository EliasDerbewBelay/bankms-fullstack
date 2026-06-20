import { env } from './env';

/** Comma-separated origins from CORS_ORIGIN, e.g. https://app.com,https://www.app.com */
export function getAllowedOrigins(): string[] {
  return env.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/** Dynamic CORS origin check — supports multiple origins and optional Vercel previews. */
export function corsOriginDelegate(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void {
  // Same-origin / server-to-server / curl
  if (!origin) {
    callback(null, true);
    return;
  }

  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) {
    callback(null, true);
    return;
  }

  if (
    env.CORS_ALLOW_VERCEL_PREVIEWS === 'true' &&
    /^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)
  ) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin ${origin} not allowed by CORS`));
}
