'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../../lib/utils';
import { FileText, ChevronLeft, ChevronRight, RefreshCw, Eye, Plus } from 'lucide-react';
import Link from 'next/link';

const LOAN_STATUSES = ['', 'PENDING_DISBURSEMENT', 'ACTIVE', 'REPAID', 'DEFAULTED', 'WRITTEN_OFF'];
const LOAN_TYPES = ['', 'PERSONAL', 'HOME', 'AUTO', 'CORPORATE', 'EDUCATION', 'AGRICULTURE', 'EMERGENCY'];

export default function LoansPage() {
  const [view, setView] = useState<'loans' | 'applications'>('loans');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loanType, setLoanType] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [view, page, status, loanType],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page), limit: '15',
        ...(status && { status }),
        ...(loanType && { loan_type: loanType }),
      });
      const endpoint = view === 'loans' ? `/loans?${params}` : `/loans/applications?${params}`;
      const res = await api.get(endpoint);
      return res.data;
    },
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loans</h1>
          <p className="page-subtitle">{meta ? `${meta.total.toLocaleString()} records` : 'Loan management'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link href="/loans/apply"
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Apply for Loan
          </Link>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        {(['loans', 'applications'] as const).map((v) => (
          <button key={v} onClick={() => { setView(v); setPage(1); setStatus(''); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {v === 'loans' ? 'Active Loans' : 'Applications'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Statuses</option>
          {LOAN_STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={loanType} onChange={(e) => { setLoanType(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Types</option>
          {LOAN_TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {(view === 'loans'
                  ? ['Loan #', 'Customer', 'Type', 'Principal', 'Outstanding', 'Interest Rate', 'Maturity', 'Status', '']
                  : ['Application #', 'Customer', 'Type', 'Requested', 'Term', 'Status', 'Submitted', '']
                ).map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  ))}</tr>
                ))
                : items.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center">
                        <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No {view} found</p>
                      </td>
                    </tr>
                  )
                  : items.map((item: any) => (
                    <tr key={item.loan_id ?? item.application_id} className="hover:bg-muted/30 transition-colors">
                      {view === 'loans' ? (
                        <>
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{item.loan_number}</td>
                          <td className="px-4 py-3 text-foreground">
                            {item.customer?.first_name
                              ? `${item.customer.first_name} ${item.customer.last_name}`
                              : item.customer?.company_name ?? '—'}
                          </td>
                          <td className="px-4 py-3"><span className="badge-neutral">{item.loan_type}</span></td>
                          <td className="px-4 py-3 font-financial font-medium text-foreground whitespace-nowrap">
                            {formatCurrency(Number(item.principal_amount))}
                          </td>
                          <td className="px-4 py-3 font-financial text-foreground whitespace-nowrap">
                            {formatCurrency(Number(item.outstanding_balance))}
                          </td>
                          <td className="px-4 py-3 font-financial text-foreground">
                            {(Number(item.interest_rate) * 100).toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDate(item.maturity_date)}</td>
                          <td className="px-4 py-3"><span className={getStatusBadge(item.status)}>{item.status.replace(/_/g, ' ')}</span></td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{item.application_number}</td>
                          <td className="px-4 py-3 text-foreground">
                            {item.customer?.first_name
                              ? `${item.customer.first_name} ${item.customer.last_name}`
                              : item.customer?.company_name ?? '—'}
                          </td>
                          <td className="px-4 py-3"><span className="badge-neutral">{item.loan_type}</span></td>
                          <td className="px-4 py-3 font-financial font-medium text-foreground whitespace-nowrap">
                            {formatCurrency(Number(item.requested_amount))}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{item.requested_term_months} mo</td>
                          <td className="px-4 py-3"><span className={getStatusBadge(item.status)}>{item.status.replace(/_/g, ' ')}</span></td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDate(item.submitted_at)}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <Link href={`/loans/${item.loan_id ?? item.application_id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {meta.page} of {meta.totalPages} — {meta.total.toLocaleString()} total
            </p>
            <div className="flex items-center gap-2">
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
    </div>
  );
}
