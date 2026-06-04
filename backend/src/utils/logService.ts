/**
 * logService — call this from any controller to create an audit log entry.
 *
 * Usage (plain):
 *   await logService.create({ userId: 1, entity: 'account', entityId: 5, newValues: {...} });
 *
 * Usage (inside a Prisma $transaction):
 *   await prisma.$transaction(async (tx) => {
 *     // ... your db writes ...
 *     await logService.transaction({ userId, ... }, tx);
 *   });
 *
 * Sensitive fields are stripped automatically — never pass raw passwords,
 * card numbers, CVVs, PINs or secrets to this service.
 */

import { Prisma, audit_action, log_status } from '@prisma/client';
import { prisma } from '../config/database';

// ─── Sensitive-field strip list ───────────────────────────────────────────────
const SENSITIVE = new Set([
  'password', 'password_hash', 'new_password', 'old_password', 'confirm_password',
  'pin', 'pin_hash', 'cvv', 'cvv_hash', 'card_number', 'two_factor_secret',
  'salt', 'token', 'refresh_token', 'session_token', 'otp', 'secret',
]);

function sanitize(obj?: Record<string, unknown> | null): Prisma.InputJsonValue | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const safe = Object.fromEntries(
    Object.entries(obj).filter(([k]) => !SENSITIVE.has(k.toLowerCase()))
  );
  return Object.keys(safe).length ? (safe as Prisma.InputJsonValue) : undefined;
}

// ─── Core types ───────────────────────────────────────────────────────────────
interface LogInput {
  /** ID of the online_user performing the action */
  userId?: number | null;
  action: audit_action;
  entity: string;
  entityId?: number | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: string | null;
  isSuspicious?: boolean;
  status?: log_status;
  /** Pass a Prisma transaction context so the log is committed with your writes */
  tx?: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
}

// ─── Core write ──────────────────────────────────────────────────────────────
async function write(input: LogInput): Promise<void> {
  const db = (input.tx ?? prisma) as typeof prisma;
  await db.audit_log.create({
    data: {
      action_type:          input.action,
      entity_type:          input.entity,
      entity_id:            input.entityId ?? undefined,
      performed_by_user_id: input.userId ?? undefined,
      old_values:           sanitize(input.oldValues),
      new_values:           sanitize(input.newValues),
      ip_address:           input.ipAddress ?? undefined,
      user_agent:           input.userAgent ?? undefined,
      details:              input.details ?? undefined,
      is_suspicious:        input.isSuspicious ?? false,
      status:               input.status ?? 'SUCCESS',
    },
  });
}

// ─── Named helpers (convenience wrappers) ────────────────────────────────────

/** Generic log — use when no specific helper fits */
export async function log(input: LogInput): Promise<void> {
  await write(input).catch(() => { /* never throw — logging must not crash the app */ });
}

/** User signed in successfully */
export async function login(opts: {
  userId: number; ipAddress?: string | null; userAgent?: string | null;
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'LOGIN',
    entity:    'online_user',
    entityId:  opts.userId,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    details:   'Successful login',
    status:    'SUCCESS',
  }).catch(() => {});
}

/** Login attempt failed (wrong password, locked, etc.) */
export async function failedLogin(opts: {
  userId?: number | null; ipAddress?: string | null; userAgent?: string | null; reason?: string;
}): Promise<void> {
  await write({
    userId:      opts.userId,
    action:      'FAILED_LOGIN',
    entity:      'online_user',
    entityId:    opts.userId,
    ipAddress:   opts.ipAddress,
    userAgent:   opts.userAgent,
    details:     opts.reason ?? 'Failed login attempt',
    isSuspicious: true,
    status:      'FAILED',
  }).catch(() => {});
}

/** User signed out */
export async function logout(opts: {
  userId: number; ipAddress?: string | null; userAgent?: string | null;
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'LOGOUT',
    entity:    'online_user',
    entityId:  opts.userId,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    details:   'User logged out',
    status:    'SUCCESS',
  }).catch(() => {});
}

/** Any financial transaction (deposit, withdrawal, transfer, etc.) */
export async function transaction(opts: {
  userId?: number | null;
  transactionId: number;
  details: string;
  ipAddress?: string | null;
  status?: log_status;
  tx?: LogInput['tx'];
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'TRANSACTION',
    entity:    'transaction',
    entityId:  opts.transactionId,
    ipAddress: opts.ipAddress,
    details:   opts.details,
    status:    opts.status ?? 'SUCCESS',
    tx:        opts.tx,
  }).catch(() => {});
}

/** Loan application approved or rejected */
export async function loanApproval(opts: {
  userId?: number | null;
  loanId: number;
  details: string;
  newValues?: Record<string, unknown>;
  ipAddress?: string | null;
  tx?: LogInput['tx'];
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'LOAN_APPROVAL',
    entity:    'loan',
    entityId:  opts.loanId,
    newValues: opts.newValues,
    ipAddress: opts.ipAddress,
    details:   opts.details,
    status:    'SUCCESS',
    tx:        opts.tx,
  }).catch(() => {});
}

/** Card blocked or unblocked */
export async function cardBlock(opts: {
  userId?: number | null;
  cardId: number;
  reason: string;
  ipAddress?: string | null;
  tx?: LogInput['tx'];
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'CARD_BLOCK',
    entity:    'card',
    entityId:  opts.cardId,
    ipAddress: opts.ipAddress,
    details:   opts.reason,
    status:    'SUCCESS',
    tx:        opts.tx,
  }).catch(() => {});
}

/** Account frozen or unfrozen */
export async function accountFreeze(opts: {
  userId?: number | null;
  accountId: number;
  details: string;
  ipAddress?: string | null;
  tx?: LogInput['tx'];
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'ACCOUNT_FREEZE',
    entity:    'account',
    entityId:  opts.accountId,
    ipAddress: opts.ipAddress,
    details:   opts.details,
    status:    'SUCCESS',
    tx:        opts.tx,
  }).catch(() => {});
}

/** Refund approved or rejected */
export async function refundApproval(opts: {
  userId?: number | null;
  refundId: number;
  details: string;
  ipAddress?: string | null;
  tx?: LogInput['tx'];
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'REFUND_APPROVAL',
    entity:    'refund',
    entityId:  opts.refundId,
    ipAddress: opts.ipAddress,
    details:   opts.details,
    status:    'SUCCESS',
    tx:        opts.tx,
  }).catch(() => {});
}

/** User changed their password */
export async function passwordChange(opts: {
  userId: number; ipAddress?: string | null; tx?: LogInput['tx'];
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'PASSWORD_CHANGE',
    entity:    'online_user',
    entityId:  opts.userId,
    ipAddress: opts.ipAddress,
    details:   'Password changed',
    status:    'SUCCESS',
    tx:        opts.tx,
  }).catch(() => {});
}

/** A new entity was created (generic) */
export async function create(opts: {
  userId?: number | null;
  entity: string;
  entityId?: number | null;
  newValues?: Record<string, unknown>;
  details?: string;
  ipAddress?: string | null;
  tx?: LogInput['tx'];
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'CREATE',
    entity:    opts.entity,
    entityId:  opts.entityId,
    newValues: opts.newValues,
    ipAddress: opts.ipAddress,
    details:   opts.details,
    status:    'SUCCESS',
    tx:        opts.tx,
  }).catch(() => {});
}

/** An existing entity was updated */
export async function update(opts: {
  userId?: number | null;
  entity: string;
  entityId?: number | null;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  details?: string;
  ipAddress?: string | null;
  tx?: LogInput['tx'];
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'UPDATE',
    entity:    opts.entity,
    entityId:  opts.entityId,
    oldValues: opts.oldValues,
    newValues: opts.newValues,
    ipAddress: opts.ipAddress,
    details:   opts.details,
    status:    'SUCCESS',
    tx:        opts.tx,
  }).catch(() => {});
}

/** An entity was deleted */
export async function remove(opts: {
  userId?: number | null;
  entity: string;
  entityId?: number | null;
  oldValues?: Record<string, unknown>;
  details?: string;
  ipAddress?: string | null;
  tx?: LogInput['tx'];
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'DELETE',
    entity:    opts.entity,
    entityId:  opts.entityId,
    oldValues: opts.oldValues,
    ipAddress: opts.ipAddress,
    details:   opts.details,
    status:    'SUCCESS',
    tx:        opts.tx,
  }).catch(() => {});
}

/** System config was changed (exchange rates, charge schedules, account types, etc.) */
export async function configChange(opts: {
  userId?: number | null;
  entity: string;
  entityId?: number | null;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  details?: string;
  ipAddress?: string | null;
  tx?: LogInput['tx'];
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'CONFIG_CHANGE',
    entity:    opts.entity,
    entityId:  opts.entityId,
    oldValues: opts.oldValues,
    newValues: opts.newValues,
    ipAddress: opts.ipAddress,
    details:   opts.details,
    status:    'SUCCESS',
    tx:        opts.tx,
  }).catch(() => {});
}

/** Data was exported */
export async function exportData(opts: {
  userId?: number | null;
  entity: string;
  details?: string;
  ipAddress?: string | null;
}): Promise<void> {
  await write({
    userId:    opts.userId,
    action:    'EXPORT',
    entity:    opts.entity,
    ipAddress: opts.ipAddress,
    details:   opts.details,
    status:    'SUCCESS',
  }).catch(() => {});
}

const logService = {
  log,
  login,
  failedLogin,
  logout,
  transaction,
  loanApproval,
  cardBlock,
  accountFreeze,
  refundApproval,
  passwordChange,
  create,
  update,
  remove,
  configChange,
  exportData,
};

export default logService;
