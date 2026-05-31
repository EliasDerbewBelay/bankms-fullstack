'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../../lib/utils';
import { Banknote, ChevronLeft, ChevronRight, RefreshCw, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/auth.store';

const ACCOUNT_STATUSES = ['', 'ACTIVE', 'INACTIVE', 'FROZEN', 'CLOSED', 'DORMANT'];

export default function AccountsPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const isCustomer = user?.role === 'CUSTOMER';

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['accounts', page, status, isCustomer],
    queryFn: async () => {
      if (isCustomer) {
        const res = await api.get('/accounts/my');
        return { data: res.data.data, meta: null };
      }
      const params = new URLSearchParams({ page: String(page), limit: '15', ...(status && { status }) });
      const res = await api.get(`/accounts?${params}`);
      return res.data;
    },
  });

  const accounts = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isCustomer ? 'My Accounts' : 'Accounts'}</h1>
          <p className="page-subtitle">
            {meta ? `${meta.total.toLocaleString()} total accounts` : 'Manage bank accounts'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {!isCustomer && (
            <Link href="/accounts/new"
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Open Account
            </Link>
          )}
        </div>
      </div>

      {!isCustomer && (
        <div className="flex flex-wrap items-center gap-3">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Statuses</option>
            {ACCOUNT_STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {isCustomer ? (
        /* Customer card view */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-6 h-44 animate-pulse bg-muted" />
            ))
            : accounts.map((ca: any) => {
              const acc = ca.account ?? ca;
              return (
                <Link key={acc.account_id} href={`/accounts/${acc.account_id}`}
                  className="stat-card group hover:border-primary/50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {acc.account_type?.type_name}
                      </p>
                      <span className={`mt-1 ${getStatusBadge(acc.status)}`}>{acc.status}</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold font-financial text-foreground">
                    {formatCurrency(Number(acc.balance), acc.currency?.currency_code, acc.currency?.symbol)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{acc.account_number}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                    <span>Available: <span className="font-financial text-foreground">{formatCurrency(Number(acc.available_balance))}</span></span>
                    <span>{acc.branch?.branch_name}</span>
                  </div>
                </Link>
              );
            })}
        </div>
      ) : (
        /* Staff table view */
        <div className="data-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Account #', 'Owner', 'Type', 'Currency', 'Balance', 'Available', 'Branch', 'Status', 'Opened', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                  : accounts.length === 0
                    ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-16 text-center">
                          <Banknote className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="text-muted-foreground text-sm">No accounts found</p>
                        </td>
                      </tr>
                    )
                    : accounts.map((acc: any) => {
                      const primaryOwner = acc.customer_account?.find((ca: any) => ca.is_primary_owner);
                      const owner = primaryOwner?.customer;
                      const ownerName = owner
                        ? owner.customer_type === 'CORPORATE'
                          ? owner.company_name
                          : `${owner.first_name} ${owner.last_name}`
                        : '—';
                      return (
                        <tr key={acc.account_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{acc.account_number}</td>
                          <td className="px-4 py-3 text-foreground text-xs">{ownerName}</td>
                          <td className="px-4 py-3"><span className="badge-neutral">{acc.account_type?.type_name}</span></td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{acc.currency?.currency_code}</td>
                          <td className="px-4 py-3 font-financial font-semibold text-foreground whitespace-nowrap">
                            {formatCurrency(Number(acc.balance), acc.currency?.currency_code, acc.currency?.symbol)}
                          </td>
                          <td className="px-4 py-3 font-financial text-muted-foreground whitespace-nowrap">
                            {formatCurrency(Number(acc.available_balance), acc.currency?.currency_code, acc.currency?.symbol)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{acc.branch?.branch_name}</td>
                          <td className="px-4 py-3"><span className={getStatusBadge(acc.status)}>{acc.status}</span></td>
                          <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(acc.open_date)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/accounts/${acc.account_id}`}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                              <Eye className="w-3.5 h-3.5" /> View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!meta.hasPrev}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={!meta.hasNext}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
