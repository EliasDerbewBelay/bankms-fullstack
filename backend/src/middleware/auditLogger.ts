/**
 * auditLogger — Express middleware that automatically creates an audit_log
 * entry for every mutating request (POST, PUT, PATCH, DELETE).
 *
 * • Runs AFTER the response is sent (res.on('finish')) — never delays the API
 * • Only logs requests from authenticated users (req.user must be set)
 * • Strips all sensitive fields before logging (passwords, card data, etc.)
 * • Silently ignores any logging errors — logging must never crash the app
 *
 * Register AFTER authenticate middleware in app.ts so req.user is populated:
 *   app.use(authenticate);
 *   app.use(auditLogger);
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { audit_action } from '@prisma/client';

// ─── Sensitive fields — stripped before any value is persisted ────────────────
const SENSITIVE = new Set([
  'password', 'password_hash', 'new_password', 'old_password', 'confirm_password',
  'current_password', 'pin', 'pin_hash', 'cvv', 'cvv_hash', 'card_number',
  'two_factor_secret', 'salt', 'token', 'refresh_token', 'session_token', 'otp', 'secret',
]);

import { Prisma } from '@prisma/client';

function sanitize(body: unknown): Prisma.InputJsonValue | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
  const safe = Object.fromEntries(
    Object.entries(body as Record<string, unknown>)
      .filter(([k]) => !SENSITIVE.has(k.toLowerCase()))
  );
  return Object.keys(safe).length ? (safe as Prisma.InputJsonValue) : undefined;
}

// ─── Derive audit_action from HTTP method + URL path ─────────────────────────
function inferAction(method: string, path: string): audit_action {
  const p = path.toLowerCase();

  // Auth events
  if (p.includes('/auth/login'))             return 'LOGIN';
  if (p.includes('/auth/logout'))            return 'LOGOUT';

  // Financial operations
  if (p.includes('/transactions'))           return 'TRANSACTION';

  // Security-sensitive ops (check before generic UPDATE)
  if (p.match(/\/cards?\/\d+\/block/))       return 'CARD_BLOCK';
  if (p.match(/\/accounts?\/\d+\/(freeze|unfreeze)/)) return 'ACCOUNT_FREEZE';
  if (p.includes('/password') || p.includes('/reset-password')) return 'PASSWORD_CHANGE';

  // Loan approval / rejection
  if (p.includes('/loan') && (p.includes('/approve') || p.includes('/reject') || p.includes('/disburse')))
                                             return 'LOAN_APPROVAL';

  // Refund approval
  if (p.includes('/refund') && (p.includes('/approve') || p.includes('/reject')))
                                             return 'REFUND_APPROVAL';

  // System config changes
  if (
    p.includes('/exchange-rates') ||
    p.includes('/charge-schedules') ||
    p.includes('/currencies') ||
    p.includes('/account-types') ||
    p.includes('/settings')
  )                                          return 'CONFIG_CHANGE';

  // Fallback by HTTP method
  if (method === 'POST')                     return 'CREATE';
  if (method === 'DELETE')                   return 'DELETE';
  return 'UPDATE';                           // PUT / PATCH
}

// ─── Derive entity type from URL segments ─────────────────────────────────────
function inferEntity(path: string): string {
  const skipped = new Set(['api', 'v1', 'v2', 'v3']);
  const segment = path
    .split('/')
    .filter(Boolean)
    .find((s) => !skipped.has(s.toLowerCase()) && !/^\d+$/.test(s));
  return segment ?? 'unknown';
}

// ─── Extract numeric :id param from path ──────────────────────────────────────
function extractEntityId(params: Record<string, string | string[]>): number | undefined {
  const raw = params?.id ?? params?.userId ?? params?.accountId ?? params?.loanId;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(id ?? '');
  return isNaN(n) ? undefined : n;
}

// ─── Methods to log ───────────────────────────────────────────────────────────
const LOGGED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// ─── Middleware ───────────────────────────────────────────────────────────────
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  // Only intercept mutating methods
  if (!LOGGED_METHODS.has(req.method)) return next();

  res.on('finish', () => {
    const user = req.user;
    if (!user) return; // Skip unauthenticated requests

    const status = res.statusCode < 400 ? 'SUCCESS' : 'FAILED';
    const action = inferAction(req.method, req.path);
    const entity = inferEntity(req.path);
    const entityId = extractEntityId(req.params ?? {});
    const sanitized = sanitize(req.body);

    // Mark suspicious: repeated auth failures or unauthorized access attempts
    const isSuspicious =
      status === 'FAILED' && (res.statusCode === 401 || res.statusCode === 403);

    // Fire-and-forget: setImmediate so the response is already gone
    setImmediate(async () => {
      try {
        await prisma.audit_log.create({
          data: {
            action_type:          action,
            entity_type:          entity,
            entity_id:            entityId,
            performed_by_user_id: user.userId,
            new_values:           sanitized ?? undefined,
            ip_address:
              ((req.headers['x-forwarded-for'] as string) ?? '')
                .split(',')[0]
                .trim() || req.ip || undefined,
            user_agent:    req.headers['user-agent'] ?? undefined,
            details:       `${req.method} ${req.path} → HTTP ${res.statusCode}`,
            is_suspicious: isSuspicious,
            status,
          },
        });
      } catch {
        // Silently swallow — a logging failure must never affect the API
      }
    });
  });

  next();
}
