import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string,
  currency: string = 'ETB',
  symbol: string = 'Br'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${symbol} 0.00`;
  return `${symbol} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${(num * 100).toFixed(2)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number = 30): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export const statusColors: Record<string, string> = {
  ACTIVE: 'badge-success',
  COMPLETED: 'badge-success',
  VERIFIED: 'badge-success',
  ONLINE: 'badge-success',
  PAID: 'badge-success',
  PENDING: 'badge-warning',
  PENDING_APPROVAL: 'badge-warning',
  PENDING_DISBURSEMENT: 'badge-warning',
  UNDER_REVIEW: 'badge-warning',
  LOW_CASH: 'badge-warning',
  PROCESSING: 'badge-info',
  FROZEN: 'badge-info',
  DORMANT: 'badge-info',
  FAILED: 'badge-danger',
  REJECTED: 'badge-danger',
  DEFAULTED: 'badge-danger',
  BLOCKED: 'badge-danger',
  CANCELLED: 'badge-neutral',
  CLOSED: 'badge-neutral',
  REPAID: 'badge-neutral',
  EXPIRED: 'badge-neutral',
};

export function getStatusBadge(status: string): string {
  return statusColors[status] ?? 'badge-neutral';
}
