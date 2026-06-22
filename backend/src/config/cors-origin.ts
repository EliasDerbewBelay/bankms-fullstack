function ensureOriginProtocol(origin: string): string {
  if (/^https?:\/\//i.test(origin)) return origin;
  if (/^localhost(:\d+)?$/i.test(origin) || /^127\.0\.0\.1(:\d+)?$/i.test(origin)) {
    return `http://${origin}`;
  }
  return `https://${origin}`;
}

/**
 * Normalize CORS_ORIGIN from env — handles comma/semicolon/newline lists, quotes, trailing slashes.
 */
export function normalizeCorsOriginInput(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) {
    return 'http://localhost:3000';
  }

  return raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .split(/[\n,;]+/)
    .map((o) => o.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, ''))
    .filter(Boolean)
    .map(ensureOriginProtocol)
    .join(',');
}

export function isValidCorsOriginList(value: string): boolean {
  const origins = value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (origins.length === 0) return false;

  return origins.every((origin) => {
    try {
      const url = new URL(origin);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  });
}
