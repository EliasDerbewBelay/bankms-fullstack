'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatDate, getStatusBadge, truncate } from '../../../lib/utils';
import {
  Search, Plus, Filter, Users, RefreshCw,
  ChevronLeft, ChevronRight, Eye, Building2, User,
} from 'lucide-react';
import Link from 'next/link';

const CUSTOMER_TYPES = ['', 'INDIVIDUAL', 'CORPORATE', 'JOINT'];
const KYC_STATUSES = ['', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'];

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['customers', page, debouncedSearch, customerType, kycStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(customerType && { customer_type: customerType }),
        ...(kycStatus && { kyc_status: kycStatus }),
      });
      const res = await api.get(`/customers?${params}`);
      return res.data;
    },
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const customers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">
            {meta ? `${meta.total.toLocaleString()} total customers` : 'Manage customer accounts'}
          </p>
        </div>
        <div className="page-actions">
          <button
            onClick={() => refetch()}
            className="btn-secondary gap-2 px-3"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link href="/customers/new" className="btn-primary gap-2 px-3">
            <Plus className="w-4 h-4" />
            New Customer
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="relative w-full min-w-0 sm:flex-1 sm:min-w-[12rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, phone, national ID…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background
                       focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={customerType}
          onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Types</option>
          {CUSTOMER_TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={kycStatus}
          onChange={(e) => { setKycStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All KYC Status</option>
          {KYC_STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <div className="data-table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Customer', 'Type', 'Contact', 'KYC Status', 'Risk', 'Accounts', 'Registered', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No customers found</p>
                  </td>
                </tr>
              ) : (
                customers.map((c: any) => (
                  <tr key={c.customer_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {c.customer_type === 'CORPORATE'
                            ? <Building2 className="w-4 h-4 text-primary" />
                            : <User className="w-4 h-4 text-primary" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {c.customer_type === 'CORPORATE'
                              ? truncate(c.company_name ?? '—', 25)
                              : `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{c.customer_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-neutral">{c.customer_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{c.phone_number}</p>
                      {c.email && <p className="text-xs text-muted-foreground">{truncate(c.email, 22)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadge(c.kyc_status)}>{c.kyc_status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadge(c.risk_profile)}>{c.risk_profile}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-financial text-foreground">{c._count?.customer_account ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(c.registration_date)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/customers/${c.customer_id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!meta.hasPrev}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs
                           disabled:opacity-40 hover:bg-accent transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!meta.hasNext}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs
                           disabled:opacity-40 hover:bg-accent transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
