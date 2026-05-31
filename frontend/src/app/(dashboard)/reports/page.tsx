'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency } from '../../../lib/utils';
import { BarChart3, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart,
  Area, Legend,
} from 'recharts';

const COLORS = ['#3b5bdb', '#0f6e56', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6'];

type ReportTab = 'transactions' | 'loans' | 'accounts';

const DAYS_OPTIONS = [7, 14, 30, 90, 180, 365];

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('transactions');
  const [days, setDays] = useState(30);

  const txReport = useQuery({
    queryKey: ['report-transactions', days],
    queryFn: async () => {
      const res = await api.get(`/reports/transactions?days=${days}`);
      return res.data.data;
    },
    enabled: tab === 'transactions',
  });

  const loanReport = useQuery({
    queryKey: ['report-loans'],
    queryFn: async () => {
      const res = await api.get('/reports/loans');
      return res.data.data;
    },
    enabled: tab === 'loans',
  });

  const accountReport = useQuery({
    queryKey: ['report-accounts'],
    queryFn: async () => {
      const res = await api.get('/reports/accounts');
      return res.data.data;
    },
    enabled: tab === 'accounts',
  });

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'loans', label: 'Loans' },
    { id: 'accounts', label: 'Accounts' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-subtitle">Financial insights and operational analytics</p>
        </div>
        {tab === 'transactions' && (
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {DAYS_OPTIONS.map(d => (
              <option key={d} value={d}>Last {d} days</option>
            ))}
          </select>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TRANSACTIONS TAB */}
      {tab === 'transactions' && (() => {
        const d = txReport.data;
        const loading = txReport.isLoading;
        return (
          <div className="space-y-6">
            {/* Trend chart */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Daily Transaction Volume</h3>
              {loading ? <div className="h-56 bg-muted rounded animate-pulse" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={d?.trend ?? []}>
                    <defs>
                      <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b5bdb" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b5bdb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Volume']} />
                    <Area type="monotone" dataKey="volume" stroke="#3b5bdb" strokeWidth={2} fill="url(#txGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Type */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Volume by Transaction Type</h3>
                {loading ? <div className="h-48 bg-muted rounded animate-pulse" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={d?.byType ?? []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="type" tick={{ fontSize: 9 }} width={110} tickFormatter={v => v.replace(/_/g, ' ')} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), 'Volume']} />
                      <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                        {(d?.byType ?? []).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* By Channel */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Transactions by Channel</h3>
                {loading ? <div className="h-48 bg-muted rounded animate-pulse" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={d?.byChannel ?? []} dataKey="count" nameKey="channel" cx="50%" cy="45%"
                        innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {(d?.byChannel ?? []).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend formatter={v => <span style={{ fontSize: 11 }}>{v}</span>} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* LOANS TAB */}
      {tab === 'loans' && (() => {
        const d = loanReport.data;
        const loading = loanReport.isLoading;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Status */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Portfolio by Status</h3>
                {loading ? <div className="h-56 bg-muted rounded animate-pulse" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={d?.byStatus ?? []} dataKey="outstanding" nameKey="status" cx="50%" cy="45%"
                        innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {(d?.byStatus ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend formatter={v => <span style={{ fontSize: 10 }}>{v.replace(/_/g, ' ')}</span>} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), 'Outstanding']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* By Type */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Disbursements by Type</h3>
                {loading ? <div className="h-56 bg-muted rounded animate-pulse" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={d?.byType ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), 'Principal']} />
                      <Bar dataKey="principal" radius={[4, 4, 0, 0]}>
                        {(d?.byType ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* NPL Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold">Non-Performing Loans (Top 10)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Loan #', 'Customer', 'Type', 'Principal', 'Outstanding', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                        ))}</tr>
                      ))
                    ) : (d?.nplLoans ?? []).length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No non-performing loans 🎉</td></tr>
                    ) : (
                      (d?.nplLoans ?? []).map((loan: any) => (
                        <tr key={loan.loan_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs">{loan.loan_number}</td>
                          <td className="px-4 py-3">{loan.customer?.first_name ? `${loan.customer.first_name} ${loan.customer.last_name}` : loan.customer?.company_name}</td>
                          <td className="px-4 py-3"><span className="badge-neutral">{loan.loan_type}</span></td>
                          <td className="px-4 py-3 font-financial">{formatCurrency(Number(loan.principal_amount))}</td>
                          <td className="px-4 py-3 font-financial text-red-500">{formatCurrency(Number(loan.outstanding_balance))}</td>
                          <td className="px-4 py-3"><span className="badge-danger">{loan.status.replace(/_/g, ' ')}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ACCOUNTS TAB */}
      {tab === 'accounts' && (() => {
        const d = accountReport.data;
        const loading = accountReport.isLoading;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Status */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Total Deposits by Account Status</h3>
                {loading ? <div className="h-56 bg-muted rounded animate-pulse" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={d?.byStatus ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), 'Balance']} />
                      <Bar dataKey="totalBalance" radius={[4, 4, 0, 0]}>
                        {(d?.byStatus ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* By Type */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Account Distribution by Type</h3>
                {loading ? <div className="h-56 bg-muted rounded animate-pulse" /> : (
                  <div className="space-y-3 mt-2">
                    {(d?.byType ?? []).map((item: any, i: number) => (
                      <div key={item.type}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{item.type}</span>
                          <span className="font-medium">{item.count} accounts · {(Number(item.rate) * 100).toFixed(2)}% rate</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${(item.count / Math.max(...(d?.byType ?? []).map((a: any) => a.count), 1)) * 100}%`,
                            backgroundColor: COLORS[i % COLORS.length]
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
