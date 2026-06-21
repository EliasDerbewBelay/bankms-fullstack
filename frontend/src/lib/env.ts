/**
 * Client-safe public env vars (NEXT_PUBLIC_* only).
 * Server-only vars like BACKEND_URL are used in next.config.ts rewrites.
 */
export const publicEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'CoreBank MS',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const;

/** Axios base URL — relative /api/v1 works on Vercel via same-origin proxy. */
export function getApiBaseUrl(): string {
  return publicEnv.apiUrl;
}
