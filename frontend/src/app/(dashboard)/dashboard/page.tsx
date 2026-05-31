'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../../lib/utils';
import {
  Users, Banknote, ArrowLeftRight, FileText,
  TrendingUp, TrendingDown, AlertTriangle,
  Landmark, ShieldAlert, Clock, CheckCircle2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuthStore } from '../../../store/auth.store';

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

const PIE_COLORS = ['#3b5bdb', '#0f6e56', '#f59e0b', '#ef4444', '#6366f1'];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data;
    },
    refetchInterval: 60_000,
    enabled: user?.role !== 'CUSTOMER',
  });

  if (user?.role === 'CUSTOMER') {
    return <CustomerDashboard />;
  }

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

  const loanTypes = [
    { name: 'Personal', value: 30 },
    { name: 'Home', value: 25 },
    { name: 'Auto', value: 20 },
    { name: 'Corporate', value: 15 },
    { name: 'Education', value: 10 },
  ];

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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction trend */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Transaction Volume</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
            </div>
          </div>
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
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Volume']}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#3b5bdb"
                strokeWidth={2}
                fill="url(#volumeGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Loan portfolio */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Loan Portfolio Mix</h3>
            <p className="text-xs text-muted-foreground mt-0.5">By type</p>
          </div>
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
                  <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                    {value}
                  </span>
                )}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}%`, 'Share']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick stats */}
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

        {/* Alerts feed */}
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

function CustomerDashboard() {
  const { user } = useAuthStore();
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['my-accounts'],
    queryFn: async () => {
      const res = await api.get('/accounts/my');
      return res.data.data;
    },
  });

  const displayName = user?.profile
    ? 'first_name' in (user.profile as any)
      ? (user.profile as any).first_name
      : user.username
    : user?.username;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Good morning, {displayName} 👋</h1>
        <p className="page-subtitle">Here is your account overview</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="stat-card h-36 bg-muted animate-pulse" />
          ))}
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
                <span>Available: <span className="font-financial text-foreground">{formatCurrency(Number(ca.account?.available_balance))}</span></span>
                <span>{ca.account?.branch?.branch_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
