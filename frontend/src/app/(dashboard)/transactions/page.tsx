'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDateTime, getStatusBadge } from '../../../lib/utils';
import { useAuthStore } from '../../../store/auth.store';
import {
  Search, ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  ChevronLeft, ChevronRight, RefreshCw, Zap,
} from 'lucide-react';

const TXN_TYPES = ['', 'DEPOSIT', 'WITHDRAWAL', 'INTERNAL_TRANSFER', 'INTERBANK_TRANSFER',
  'UTILITY_PAYMENT', 'CARD_PAYMENT', 'LOAN_REPAYMENT', 'INTEREST_CREDIT'];
const TXN_STATUSES = ['', 'COMPLETED', 'PENDING', 'PROCESSING', 'FAILED', 'REVERSED'];
const CHANNELS = ['', 'BRANCH', 'ATM', 'MOBILE', 'INTERNET', 'POS', 'SYSTEM'];

const txnIcon = (type: string) => {
  if (type === 'DEPOSIT' || type === 'INTEREST_CREDIT') return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
  if (type === 'WITHDRAWAL') return <ArrowUpRight className="w-4 h-4 text-red-500" />;
  return <ArrowLeftRight className="w-4 h-4 text-blue-500" />;
};

export default function TransactionsPage() {
  const { user } = useAuthStore();
  const isCustomer = user?.role === 'CUSTOMER';
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['transactions', isCustomer, page, type, status, channel, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        ...(type && { type }),
        ...(status && { status }),
        ...(!isCustomer && channel && { channel }),
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate }),
      });
      const res = await api.get(`${isCustomer ? '/transactions/my' : '/transactions'}?${params}`);
      return res.data;
    },
  });

  const transactions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isCustomer ? 'Transaction History' : 'Transactions'}</h1>
          <p className="page-subtitle">
            {meta ? `${meta.total.toLocaleString()} total transactions` : 'Full transaction history'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2
                     text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Types</option>
          {TXN_TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Statuses</option>
          {TXN_STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {!isCustomer && (
          <select value={channel} onChange={(e) => { setChannel(e.target.value); setPage(1); }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Channels</option>
            {CHANNELS.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-muted-foreground">From</label>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <label className="text-xs text-muted-foreground">To</label>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <div className="data-table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Reference', 'Type', 'Amount', 'From Account', 'Channel', 'Status', 'Date', 'Fees'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
                : transactions.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <Zap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No transactions found</p>
                      </td>
                    </tr>
                  )
                  : transactions.map((t: any) => {
                    const totalFees = (t.transaction_fee ?? []).reduce(
                      (sum: number, f: any) => sum + Number(f.fee_amount), 0
                    );
                    return (
                      <tr key={t.transaction_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-foreground">{t.reference_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {txnIcon(t.transaction_type)}
                            <span className="text-xs text-foreground whitespace-nowrap">
                              {t.transaction_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-financial font-semibold text-foreground whitespace-nowrap">
                            {formatCurrency(Number(t.amount), t.currency?.currency_code, t.currency?.symbol)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-muted-foreground">
                            {t.from_account?.account_number ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge-neutral">{t.channel}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={getStatusBadge(t.status)}>{t.status}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {formatDateTime(t.transaction_date)}
                        </td>
                        <td className="px-4 py-3 font-financial text-xs text-muted-foreground">
                          {totalFees > 0 ? formatCurrency(totalFees) : '—'}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!meta.hasPrev}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={!meta.hasNext}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
