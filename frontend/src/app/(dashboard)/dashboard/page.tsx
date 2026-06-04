'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../../lib/utils';
import {
  Users, Banknote, ArrowLeftRight, FileText,
  TrendingUp, TrendingDown, AlertTriangle,
  Landmark, ShieldAlert, Clock, CheckCircle2,
  Activity, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';
import { useAuthStore } from '../../../store/auth.store';

interface TxnRow {
  transaction_id: number;
  reference_number: string;
  transaction_type: string;
  channel?: string;
  amount: string | number;
  status: string;
  transaction_date: string;
  description?: string;
  from_account?: { account_number: string } | null;
  currency?: { currency_code: string; symbol: string } | null;
}

interface DashboardData {
  customers: { total: number; verified: number; verificationRate: string };
  accounts: { total: number; active: number };
  loans: {
    total: number; active: number; defaulted: number;
    totalDisbursed: number | string; totalOutstanding: number | string; nplRatio: string;
  };
  transactions: {
    today: number; volumeToday: number | string;
    totalDeposits: number | string; totalWithdrawals: number | string;
  };
  atm: { online: number; lowCash: number };
  alerts: { pendingRefunds: number; suspiciousToday: number };
  trend: Array<{ date: string; count: number; volume: number }>;
  byType: Array<{ type: string; count: number; volume: number }>;
  byChannel: Array<{ channel: string; count: number }>;
  loansByType: Array<{ type: string; count: number; disbursed: number; outstanding: number }>;
  recentTransactions: TxnRow[];
}

interface CustomerActivity {
  trend: Array<{ date: string; count: number; volume: number }>;
  byType: Array<{ type: string; count: number; volume: number }>;
  recentTransactions: TxnRow[];
}

function StatCard({
  label, value, sub, icon: Icon, trend, color = 'primary',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: { value: string; up: boolean };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'teal';
}) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  };
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground font-financial">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend.up ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

const PIE_COLORS = ['#3b5bdb', '#0f6e56', '#f59e0b', '#ef4444', '#6366f1', '#0ea5e9', '#8b5cf6'];

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  INTERNAL_TRANSFER: 'Int. Transfer',
  INTERBANK_TRANSFER: 'Interbank',
  LOAN_DISBURSEMENT: 'Loan Disburse',
  LOAN_REPAYMENT: 'Loan Repay',
  UTILITY_PAYMENT: 'Utility',
  SERVICE_CHARGE: 'Service Charge',
  REVERSAL: 'Reversal',
};

const CHANNEL_COLORS: Record<string, string> = {
  BRANCH: '#3b5bdb',
  ATM: '#0f6e56',
  MOBILE: '#f59e0b',
  INTERNET: '#6366f1',
  SYSTEM: '#94a3b8',
  POS: '#ef4444',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
  PENDING: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  FAILED: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  REVERSED: 'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400',
};

function TransactionsTable({ rows, title }: { rows: TxnRow[]; title: string }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
        <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{rows.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Reference</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
              {rows[0].channel !== undefined && (
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Channel</th>
              )}
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((txn) => (
              <tr key={txn.transaction_id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{txn.reference_number}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-foreground">
                    {TYPE_LABELS[txn.transaction_type] ?? txn.transaction_type.replace(/_/g, ' ')}
                  </span>
                </td>
                {txn.channel !== undefined && (
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{txn.channel?.toLowerCase()}</td>
                )}
                <td className="px-4 py-3 text-right font-financial font-semibold text-foreground">
                  {txn.currency?.symbol ?? 'ETB'}{' '}
                  {Number(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[txn.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {txn.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(txn.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartTooltipStyle() {
  return {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };
}

const ADMIN_ROLES = ['SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data;
    },
    refetchInterval: 60_000,
    enabled: !!user && ADMIN_ROLES.includes(user.role),
  });

  if (user?.role === 'CUSTOMER') {
    return <CustomerDashboard />;
  }

  if (user?.role === 'TELLER') {
    return <TellerDashboard />;
  }
  // SUPERVISOR, BRANCH_MANAGER, ADMIN all use the executive dashboard below

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="stat-card h-28 bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  const loanTypes = (data.loansByType ?? []).map((l: any) => ({
    name: l.type.replace(/_/g, ' '),
    value: l.count,
    disbursed: l.disbursed,
    outstanding: l.outstanding,
  }));

  const barTypeData = (data.byType ?? []).map((t) => ({
    name: TYPE_LABELS[t.type] ?? t.type.replace(/_/g, ' '),
    count: t.count,
    volume: t.volume,
  }));

  const channelDonutData = (data.byChannel ?? []).map((c) => ({
    name: c.channel,
    value: c.count,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">
            Real-time overview of bank operations — {formatDate(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live data
        </div>
      </div>

      {/* Alert banner */}
      {(data.alerts.pendingRefunds > 0 || data.alerts.suspiciousToday > 0) && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {data.alerts.pendingRefunds} pending refunds · {data.alerts.suspiciousToday} suspicious
            activities flagged today
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={data.customers.total.toLocaleString()}
          sub={`${data.customers.verificationRate}% KYC verified`}
          icon={Users}
          color="primary"
        />
        <StatCard
          label="Active Accounts"
          value={data.accounts.active.toLocaleString()}
          sub={`of ${data.accounts.total.toLocaleString()} total`}
          icon={Banknote}
          color="teal"
        />
        <StatCard
          label="Today's Volume"
          value={formatCurrency(Number(data.transactions.volumeToday))}
          sub={`${data.transactions.today} transactions`}
          icon={ArrowLeftRight}
          color="success"
        />
        <StatCard
          label="Active Loans"
          value={data.loans.active.toLocaleString()}
          sub={`NPL ratio: ${data.loans.nplRatio}%`}
          icon={FileText}
          color={parseFloat(data.loans.nplRatio) > 5 ? 'danger' : 'success'}
        />
        <StatCard
          label="Total Deposits"
          value={formatCurrency(Number(data.transactions.totalDeposits))}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          label="Total Withdrawals"
          value={formatCurrency(Number(data.transactions.totalWithdrawals))}
          icon={TrendingDown}
          color="warning"
        />
        <StatCard
          label="ATMs Online"
          value={`${data.atm.online}`}
          sub={data.atm.lowCash > 0 ? `${data.atm.lowCash} need refill` : 'All stocked'}
          icon={Landmark}
          color={data.atm.lowCash > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Outstanding Loans"
          value={formatCurrency(Number(data.loans.totalOutstanding))}
          sub={`of ${formatCurrency(Number(data.loans.totalDisbursed))} disbursed`}
          icon={ShieldAlert}
          color="primary"
        />
      </div>

      {/* ── Activity Analysis section ── */}
      <div className="flex items-center gap-2 pt-2">
        <Activity className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Activity Analysis</h2>
      </div>

      {/* Charts row 1: Trend + Channel donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-day transaction trend */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Transaction Volume Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 30 days</p>
            </div>
          </div>
          {data.trend.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b5bdb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b5bdb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={ChartTooltipStyle()}
                  formatter={(value: number) => [formatCurrency(value), 'Volume']}
                  labelFormatter={(l) => new Date(l).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                />
                <Area type="monotone" dataKey="volume" stroke="#3b5bdb" strokeWidth={2} fill="url(#volumeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Channel breakdown donut */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">By Channel</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Transaction count share</p>
          </div>
          {channelDonutData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={channelDonutData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {channelDonutData.map((c, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[c.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={ChartTooltipStyle()}
                  formatter={(value: number) => [value.toLocaleString(), 'Transactions']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2: Type bar + Loan portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction type bar chart */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Transactions by Type</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Completed transactions breakdown</p>
          </div>
          {barTypeData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barTypeData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={ChartTooltipStyle()}
                  formatter={(value: number) => [value.toLocaleString(), 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barTypeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Loan portfolio donut */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Loan Portfolio Mix</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Loans by type (from database)</p>
          </div>
          {loanTypes.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No loans in portfolio</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={loanTypes}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {loanTypes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={ChartTooltipStyle()}
                  formatter={(value: number) => [value.toLocaleString(), 'Loans']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent transactions table */}
      <TransactionsTable
        rows={data.recentTransactions ?? []}
        title="Recent Transactions"
      />

      {/* Bottom status row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational status */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Operational Status</h3>
          {[
            { label: 'KYC Verified Customers', value: data.customers.verified, total: data.customers.total, color: 'bg-emerald-500' },
            { label: 'Active Accounts', value: data.accounts.active, total: data.accounts.total, color: 'bg-primary' },
            { label: 'Performing Loans', value: data.loans.active - data.loans.defaulted, total: data.loans.active, color: 'bg-teal-500' },
          ].map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground font-financial">
                  {item.value.toLocaleString()} / {item.total.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* System alerts */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">System Alerts</h3>
          <div className="space-y-2">
            {data.atm.lowCash > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    {data.atm.lowCash} ATM(s) Low on Cash
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Refill required soon</p>
                </div>
              </div>
            )}
            {data.alerts.pendingRefunds > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 p-3">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                    {data.alerts.pendingRefunds} Pending Refunds
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Awaiting approval</p>
                </div>
              </div>
            )}
            {data.alerts.suspiciousToday > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3">
                <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-800 dark:text-red-300">
                    {data.alerts.suspiciousToday} Suspicious Activities
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Flagged today — review audit log</p>
                </div>
              </div>
            )}
            {data.atm.lowCash === 0 && data.alerts.pendingRefunds === 0 && data.alerts.suspiciousToday === 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 p-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  All systems operating normally
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Teller Dashboard ─────────────────────────────────────────────────────────
function TellerDashboard() {
  const { user } = useAuthStore();
  const employeeId = user?.linkedEmployeeId;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teller-dashboard-home', employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error('No employee linked');
      const res = await api.get(`/teller-drawers/employee/${employeeId}/dashboard`);
      return res.data.data as {
        drawer: any;
        daily: { deposits: { count: number; total: number }; withdrawals: { count: number; total: number } };
        recentTransactions: any[];
      };
    },
    enabled: !!employeeId,
    refetchInterval: 30_000,
  });

  const { data: accounts } = useQuery({
    queryKey: ['teller-accounts-summary'],
    queryFn: async () => {
      const res = await api.get('/accounts?limit=5');
      return res.data.data as any[];
    },
  });

  const { data: recentCustomers } = useQuery({
    queryKey: ['teller-customers-summary'],
    queryFn: async () => {
      const res = await api.get('/customers?limit=5');
      return res.data.data as any[];
    },
  });

  if (!employeeId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-muted-foreground text-sm">No employee profile linked to your account.</p>
        <p className="text-xs text-muted-foreground">Please contact your administrator.</p>
      </div>
    );
  }

  const drawer = data?.drawer;
  const daily = data?.daily;

  const statCards = [
    {
      label: 'Deposits Today',
      value: formatCurrency(daily?.deposits.total ?? 0),
      sub: `${daily?.deposits.count ?? 0} transactions`,
      icon: TrendingUp,
      color: 'success' as const,
    },
    {
      label: 'Withdrawals Today',
      value: formatCurrency(daily?.withdrawals.total ?? 0),
      sub: `${daily?.withdrawals.count ?? 0} transactions`,
      icon: TrendingDown,
      color: 'warning' as const,
    },
    {
      label: 'Net Cash Flow',
      value: formatCurrency((daily?.deposits.total ?? 0) - (daily?.withdrawals.total ?? 0)),
      sub: 'Deposits minus withdrawals',
      icon: ArrowLeftRight,
      color: 'primary' as const,
    },
    {
      label: 'Total Processed',
      value: ((daily?.deposits.count ?? 0) + (daily?.withdrawals.count ?? 0)).toString(),
      sub: 'Transactions this shift',
      icon: CheckCircle2,
      color: 'teal' as const,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Good morning, {user?.username} 👋</h1>
          <p className="page-subtitle">
            Teller dashboard — {formatDate(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-muted-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Level 1 · Front-office
          </div>
        </div>
      </div>

      {/* Drawer banner */}
      {!isLoading && (
        drawer ? (
          <div className="flex items-center justify-between rounded-xl border border-teal-200 dark:border-teal-800/40 bg-teal-50 dark:bg-teal-900/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">Cash Drawer Open</p>
                <p className="text-xs text-teal-600 dark:text-teal-400">
                  Opened at {new Date(drawer.opened_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ·
                  Opening balance: {formatCurrency(Number(drawer.opening_balance))}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-teal-600 dark:text-teal-400">Current Balance</p>
              <p className="text-xl font-bold font-financial text-teal-700 dark:text-teal-300">
                {formatCurrency(Number(drawer.current_balance))}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">No Active Drawer</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                You do not have an open drawer. Ask a Supervisor to open your cash drawer to begin processing transactions.
              </p>
            </div>
          </div>
        )
      )}

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card h-28 bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <p className="text-sm text-red-700 dark:text-red-400">Could not load shift data. Make sure the backend is running.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* Bottom grid: recent transactions + quick reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's transactions */}
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Today's Processed Transactions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Transactions you processed this shift</p>
            </div>
            <span className="text-xs text-muted-foreground">{(data?.recentTransactions ?? []).length} records</span>
          </div>
          {(data?.recentTransactions ?? []).length === 0 ? (
            <div className="py-14 text-center">
              <ArrowLeftRight className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions processed yet today</p>
              <p className="text-xs text-muted-foreground mt-1">Go to Teller Ops → Deposit / Withdrawal to begin</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Reference</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(data?.recentTransactions ?? []).map((txn: any) => (
                    <tr key={txn.transaction_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{txn.reference_number}</td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">
                        {TYPE_LABELS[txn.transaction_type] ?? txn.transaction_type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-right font-financial font-semibold text-foreground">
                        {txn.currency?.symbol ?? 'ETB'}{' '}
                        {Number(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[txn.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(txn.transaction_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: recent accounts + customers */}
        <div className="space-y-4">
          {/* Recent accounts */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Recent Accounts</h3>
              <p className="text-xs text-muted-foreground">Latest opened accounts</p>
            </div>
            <div className="divide-y divide-border">
              {(accounts ?? []).slice(0, 5).map((acc: any) => (
                <div key={acc.account_id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono font-medium text-foreground">{acc.account_number}</p>
                    <p className="text-xs text-muted-foreground">{acc.account_type?.type_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-financial font-semibold text-foreground">{formatCurrency(Number(acc.balance))}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${acc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {acc.status}
                    </span>
                  </div>
                </div>
              ))}
              {(accounts ?? []).length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">No accounts yet</div>
              )}
            </div>
          </div>

          {/* Recent customers */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Recent Customers</h3>
              <p className="text-xs text-muted-foreground">Latest registered customers</p>
            </div>
            <div className="divide-y divide-border">
              {(recentCustomers ?? []).slice(0, 5).map((c: any) => (
                <div key={c.customer_id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {c.customer_type === 'CORPORATE' ? c.company_name : `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.phone_number}</p>
                  </div>
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${c.kyc_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {c.kyc_status?.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {(recentCustomers ?? []).length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">No customers yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerDashboard() {
  const { user } = useAuthStore();

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['my-accounts'],
    queryFn: async () => {
      const res = await api.get('/accounts/my');
      return res.data.data as any[];
    },
  });

  const { data: activity, isLoading: activityLoading } = useQuery<CustomerActivity>({
    queryKey: ['my-activity'],
    queryFn: async () => {
      const res = await api.get('/transactions/my/activity');
      return res.data.data;
    },
    enabled: !!user?.linkedCustomerId,
    refetchInterval: 120_000,
  });

  const displayName = user?.profile
    ? 'first_name' in (user.profile as any)
      ? (user.profile as any).first_name
      : user.username
    : user?.username;

  const spendingTypeData = (activity?.byType ?? []).map((t, i) => ({
    name: TYPE_LABELS[t.type] ?? t.type.replace(/_/g, ' '),
    value: t.count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Good morning, {displayName} 👋</h1>
        <p className="page-subtitle">Here is your account overview</p>
      </div>

      {/* Account cards */}
      {accountsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="stat-card h-36 bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(accounts ?? []).map((ca: any) => (
            <div key={ca.account_id} className="stat-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {ca.account?.account_type?.type_name}
                </span>
                <span className={getStatusBadge(ca.account?.status)}>
                  {ca.account?.status}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold font-financial text-foreground">
                  {formatCurrency(
                    Number(ca.account?.balance),
                    ca.account?.currency?.currency_code,
                    ca.account?.currency?.symbol
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {ca.account?.account_number}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                <span>
                  Available:{' '}
                  <span className="font-financial text-foreground">
                    {formatCurrency(Number(ca.account?.available_balance))}
                  </span>
                </span>
                <span>{ca.account?.branch?.branch_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Activity Analysis ── */}
      <div className="flex items-center gap-2 pt-2">
        <Activity className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">My Activity</h2>
      </div>

      {activityLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card h-64 animate-pulse" />
          <div className="rounded-xl border bg-card h-64 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Trend + type breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Transaction History</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Last 30 days</p>
              </div>
              {(activity?.trend ?? []).length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No transactions yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={activity!.trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="custVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f6e56" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0f6e56" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Volume']}
                      labelFormatter={(l) => new Date(l).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#0f6e56" strokeWidth={2} fill="url(#custVolumeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Transaction Types</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Completed transactions (all accounts)</p>
              </div>
              {spendingTypeData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={spendingTypeData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {spendingTypeData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={7}
                      formatter={(value) => (
                        <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{value}</span>
                      )}
                    />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => [value.toLocaleString(), 'Transactions']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent transactions table */}
          <TransactionsTable
            rows={(activity?.recentTransactions ?? []).map((t) => ({ ...t, channel: undefined }))}
            title="Recent Transactions"
          />
        </>
      )}
    </div>
  );
}
