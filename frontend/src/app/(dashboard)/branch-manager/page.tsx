'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  AreaChart, Area, ComposedChart, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { useAuthStore } from '../../../store/auth.store';
import { useToast } from '../../../components/ui/toaster';
import {
  Briefcase, FileText, BarChart3, TrendingUp, Users, Building2,
  Shield, DollarSign, Landmark, ArrowUpCircle, ArrowDownCircle,
  CheckCircle2, XCircle, Clock, AlertTriangle, Search, RefreshCw,
  ChevronDown, Eye, Loader2, AlertCircle, Activity, PieChart as PieIcon,
  ClipboardList, Banknote, Lock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab =
  | 'dashboard'
  | 'disbursement'
  | 'tx-stats'
  | 'loan-portfolio'
  | 'employees'
  | 'branches'
  | 'audit'
  | 'rates'
  | 'atm';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',     label: 'Executive Dashboard',  icon: BarChart3 },
  { id: 'disbursement',  label: 'Loan Disbursement',    icon: FileText },
  { id: 'tx-stats',      label: 'Transaction Stats',    icon: TrendingUp },
  { id: 'loan-portfolio',label: 'Loan Portfolio',       icon: PieIcon },
  { id: 'employees',     label: 'Employee Roster',      icon: Users },
  { id: 'branches',      label: 'Branch Management',    icon: Building2 },
  { id: 'audit',         label: 'Audit Log',            icon: Shield },
  { id: 'rates',         label: 'Rates & Charges',      icon: DollarSign },
  { id: 'atm',           label: 'ATM Management',       icon: Landmark },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    INACTIVE:        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    FROZEN:          'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    APPROVED:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    REJECTED:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    SUBMITTED:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    UNDER_REVIEW:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DISBURSED:       'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    COMPLETED:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    PENDING:         'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    FAILED:          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    ONLINE:          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    OFFLINE:         'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    LOW_CASH:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    OUT_OF_CASH:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    MAINTENANCE:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    DEFAULTED:       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    VERIFIED:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    ADMIN:           'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    BRANCH_MANAGER:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    SUPERVISOR:      'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    TELLER:          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    CUSTOMER:        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card shadow-sm ${className}`}>{children}</div>;
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between px-6 py-4 border-b">
      <div>
        <h2 className="font-semibold text-base text-card-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} dark:bg-opacity-20`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

const CHART_COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e', '#ec4899'];

// ─── Executive Dashboard Tab ─────────────────────────────────────────────────
function DashboardTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  const trendData = (data.trend ?? []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Volume: Number(d.volume),
    Count: Number(d.count),
  }));

  const typePieData = (data.byType ?? []).map((t: any) => ({
    name: t.type.replace(/_/g, ' '),
    value: t.count,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Customers"  value={data.customers.total}             sub={`${data.customers.verified} verified`}         icon={Users}       color="text-blue-600" />
        <KpiCard label="Active Accounts"  value={data.accounts.active}             sub={`of ${data.accounts.total} total`}             icon={Banknote}    color="text-teal-600" />
        <KpiCard label="Txns Today"       value={data.transactions.today}          sub={formatCurrency(data.transactions.volumeToday)} icon={Activity}    color="text-violet-600" />
        <KpiCard label="Active Loans"     value={data.loans.active}                sub={`NPL ${data.loans.nplRatio}%`}                 icon={FileText}    color="text-orange-600" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Deposits"    value={formatCurrency(data.transactions.totalDeposits)}    icon={ArrowDownCircle} color="text-emerald-600" />
        <KpiCard label="Total Withdrawals" value={formatCurrency(data.transactions.totalWithdrawals)} icon={ArrowUpCircle}   color="text-red-500" />
        <KpiCard label="Pending Refunds"   value={data.alerts.pendingRefunds}   sub="awaiting approval" icon={RefreshCw}   color="text-amber-600" />
        <KpiCard label="Suspicious Alerts" value={data.alerts.suspiciousToday}  sub="today"             icon={AlertTriangle} color="text-red-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionTitle title="Transaction Volume Trend" subtitle="Last 30 days" />
          <div className="p-4 h-64">
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No transaction data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="Volume" stroke="#14b8a6" fill="url(#colorVol)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Transactions by Type" />
          <div className="p-4 h-64">
            {typePieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No transaction data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {typePieData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <SectionTitle title="Recent Transactions" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {['Reference', 'Type', 'Channel', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data.recentTransactions ?? []).map((t: any) => (
                <tr key={t.transaction_id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{t.reference_number}</td>
                  <td className="px-4 py-3 text-xs">{t.transaction_type?.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.channel}</td>
                  <td className="px-4 py-3 font-medium">{t.currency?.symbol}{Number(t.amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(t.transaction_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Loan Disbursement Tab ───────────────────────────────────────────────────
function DisbursementTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [accountSearch, setAccountSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    interest_rate: string;
    disbursement_account_id: string;
  }>();

  const { data, isLoading } = useQuery({
    queryKey: ['approved-loan-apps'],
    queryFn: () => api.get('/loans/applications?status=APPROVED&limit=50').then(r => r.data.data),
  });

  const { data: accountData } = useQuery({
    queryKey: ['accounts-disburse', accountSearch],
    queryFn: () => api.get(`/accounts?search=${accountSearch}&limit=10`).then(r => r.data.data),
    enabled: accountSearch.length >= 3,
  });

  const disburseMutation = useMutation({
    mutationFn: ({ appId, body }: { appId: number; body: any }) =>
      api.post(`/loans/applications/${appId}/disburse`, body),
    onSuccess: (res) => {
      toast(`Loan ${res.data.data?.loan_number ?? ''} disbursed successfully — repayment schedule generated`, 'success');
      qc.invalidateQueries({ queryKey: ['approved-loan-apps'] });
      setSelectedApp(null);
      reset();
      setAccountSearch('');
    },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Disbursement failed', 'error'),
  });

  const applications: any[] = data?.applications ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Loan Disbursement — Final Step</p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
            Only APPROVED applications (reviewed by a Supervisor) appear here. Disbursement creates the live loan record,
            auto-generates the full EMI repayment schedule, and records <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">disbursed_by_id</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Applications list */}
        <Card className="lg:col-span-2">
          <SectionTitle title="APPROVED Applications" subtitle={`${applications.length} ready for disbursement`} />
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <p className="font-medium">No approved applications pending disbursement</p>
            </div>
          ) : (
            <div className="divide-y max-h-[520px] overflow-y-auto">
              {applications.map((app: any) => (
                <button
                  key={app.application_id}
                  onClick={() => { setSelectedApp(app); reset(); setAccountSearch(''); }}
                  className={`w-full text-left px-6 py-4 transition-colors ${
                    selectedApp?.application_id === app.application_id
                      ? 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-600'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-card-foreground truncate">
                      {app.customer?.first_name} {app.customer?.last_name || app.customer?.company_name}
                    </p>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {app.loan_type?.replace(/_/g, ' ')} · {formatCurrency(app.requested_amount)} · {app.requested_term_months}mo
                  </p>
                  <p className="text-xs text-muted-foreground">{app.application_number}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Disbursement form */}
        <Card className="lg:col-span-3">
          <SectionTitle title="Disbursement Details" subtitle="Set interest rate and select the disbursement account" />
          <div className="p-6">
            {!selectedApp ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="text-sm">Select an approved application to disburse</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(d =>
                  disburseMutation.mutate({
                    appId: selectedApp.application_id,
                    body: {
                      interest_rate: parseFloat(d.interest_rate) / 100,
                      disbursement_account_id: parseInt(d.disbursement_account_id),
                      approved_by_id: user?.linkedEmployeeId,
                    },
                  })
                )}
                className="space-y-5"
              >
                {/* Application summary */}
                <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Application Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-xs text-muted-foreground">Applicant</p><p className="font-medium">{selectedApp.customer?.first_name} {selectedApp.customer?.last_name || selectedApp.customer?.company_name}</p></div>
                    <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-bold text-teal-600">{formatCurrency(selectedApp.requested_amount)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Type</p><p>{selectedApp.loan_type?.replace(/_/g, ' ')}</p></div>
                    <div><p className="text-xs text-muted-foreground">Term</p><p>{selectedApp.requested_term_months} months</p></div>
                    <div className="col-span-2"><p className="text-xs text-muted-foreground">Purpose</p><p className="italic text-muted-foreground">"{selectedApp.purpose}"</p></div>
                  </div>
                </div>

                {/* Interest rate */}
                <div>
                  <label className="text-sm font-medium text-card-foreground">Annual Interest Rate (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('interest_rate', {
                      required: 'Interest rate is required',
                      min: { value: 0.1, message: 'Minimum 0.1%' },
                      max: { value: 50, message: 'Maximum 50%' },
                    })}
                    placeholder="e.g. 12.5"
                    className="mt-1.5 w-full text-sm p-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.interest_rate && <p className="text-xs text-red-500 mt-1">{errors.interest_rate.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">EMI = P × r(1+r)ⁿ / ((1+r)ⁿ−1) where r = rate/12</p>
                </div>

                {/* Account search & selection */}
                <div>
                  <label className="text-sm font-medium text-card-foreground">Disbursement Account *</label>
                  <input
                    type="text"
                    value={accountSearch}
                    onChange={e => setAccountSearch(e.target.value)}
                    placeholder="Search account number (min 3 chars)…"
                    className="mt-1.5 w-full text-sm p-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {(accountData?.accounts ?? []).length > 0 && !errors.disbursement_account_id && (
                    <div className="mt-1.5 border rounded-lg divide-y max-h-36 overflow-y-auto">
                      {(accountData?.accounts ?? []).map((a: any) => (
                        <button
                          type="button"
                          key={a.account_id}
                          onClick={() => {
                            setAccountSearch(a.account_number);
                            (document.getElementById('disbursement_account_id') as HTMLInputElement).value = a.account_id;
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50"
                        >
                          <span className="font-mono font-medium">{a.account_number}</span>
                          <span className="text-muted-foreground ml-2">{a.account_type?.type_name} · Bal: {formatCurrency(a.available_balance)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    type="hidden"
                    id="disbursement_account_id"
                    {...register('disbursement_account_id', { required: 'Select a disbursement account' })}
                  />
                  {errors.disbursement_account_id && <p className="text-xs text-red-500 mt-1">{errors.disbursement_account_id.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={disburseMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm disabled:opacity-50"
                >
                  {disburseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Disburse Loan &amp; Generate Repayment Schedule
                </button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Transaction Stats Tab ────────────────────────────────────────────────────
function TxStatsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  const barData = (data.byType ?? []).map((t: any) => ({
    type: t.type.replace(/_/g, ' '),
    Count: t.count,
    Volume: Number(t.volume),
  }));

  const channelData = (data.byChannel ?? []).map((c: any) => ({
    name: c.channel,
    value: c.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Today's Transactions" value={data.transactions.today}                        icon={Activity}        color="text-blue-600" />
        <KpiCard label="Volume Today"          value={formatCurrency(data.transactions.volumeToday)} icon={TrendingUp}      color="text-teal-600" />
        <KpiCard label="Total Deposits"        value={formatCurrency(data.transactions.totalDeposits)}    icon={ArrowDownCircle} color="text-emerald-600" />
        <KpiCard label="Total Withdrawals"     value={formatCurrency(data.transactions.totalWithdrawals)} icon={ArrowUpCircle}   color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Transactions by Type" subtitle="All time, completed" />
          <div className="p-4 h-72">
            {barData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No transaction data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="Count" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Transactions by Channel" subtitle="Completed only" />
          <div className="p-4 h-72">
            {channelData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No transaction data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="45%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {channelData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* 30-day trend */}
      <Card>
        <SectionTitle title="Daily Transaction Volume" subtitle="Last 30 days" />
        <div className="p-4 h-64">
          {(data.trend ?? []).length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No transaction data</div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={(data.trend ?? []).map((d: any) => ({
              date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              Volume: Number(d.volume),
              Count: Number(d.count),
            }))}>
              <defs>
                <linearGradient id="colorV2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="vol" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="cnt" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any, n) => n === 'Volume' ? formatCurrency(v) : v} />
              <Legend />
              <Bar yAxisId="cnt" dataKey="Count" fill="#e2e8f0" radius={[2, 2, 0, 0]} />
              <Area yAxisId="vol" type="monotone" dataKey="Volume" stroke="#3b82f6" fill="url(#colorV2)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Loan Portfolio Tab ───────────────────────────────────────────────────────
function LoanPortfolioTab() {
  const { data: admin, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['loan-stats'],
    queryFn: () => api.get('/loans/stats').then(r => r.data.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  const loans = admin?.loans ?? {};
  // Use real loansByType from API — falls back to status breakdown if no type data yet
  const loansByType: any[] = admin?.loansByType ?? [];
  const pieData = loansByType.length > 0
    ? loansByType.map((l: any) => ({ name: l.type.replace(/_/g, ' '), value: l.count }))
    : [
        { name: 'Active', value: loans.active ?? 0 },
        { name: 'Defaulted', value: loans.defaulted ?? 0 },
        { name: 'Other', value: Math.max(0, (loans.total ?? 0) - (loans.active ?? 0) - (loans.defaulted ?? 0)) },
      ].filter((d: any) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Loans"        value={statsData?.totalLoans ?? 0}                          sub="all statuses"       icon={FileText}  color="text-blue-600" />
        <KpiCard label="Active Loans"       value={statsData?.activeCount ?? 0}                         sub="currently active"   icon={CheckCircle2} color="text-emerald-600" />
        <KpiCard label="Defaulted"          value={statsData?.defaultedLoans ?? 0}                      sub={`NPL ${statsData?.nplRatio ?? '0.00'}%`} icon={AlertTriangle} color="text-red-600" />
        <KpiCard label="Total Disbursed"    value={formatCurrency(statsData?.totalDisbursed ?? 0)}      sub="principal"          icon={DollarSign} color="text-teal-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Outstanding Balance" subtitle="Total principal still owed" />
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Outstanding</p>
              <p className="text-3xl font-bold text-card-foreground">{formatCurrency(statsData?.totalOutstanding ?? 0)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Disbursed</span>
                <span className="font-medium">{formatCurrency(statsData?.totalDisbursed ?? 0)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-teal-500 h-3 rounded-full"
                  style={{ width: `${(statsData?.totalDisbursed ?? 0) > 0 ? Math.min(100, ((statsData?.totalOutstanding ?? 0) / (statsData?.totalDisbursed ?? 1)) * 100) : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{(((statsData?.totalDisbursed ?? 0) - (statsData?.totalOutstanding ?? 0)) / Math.max(1, statsData?.totalDisbursed ?? 1) * 100).toFixed(1)}% recovered</span>
                <span>{statsData?.nplRatio}% NPL ratio</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Loan Portfolio Mix" subtitle="Active loans by loan type" />
          <div className="p-4 h-56">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No loan data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Recent active loans */}
      <Card>
        <SectionTitle title="Active Loans" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {['Loan Number', 'Customer', 'Type', 'Principal', 'Outstanding', 'Interest Rate', 'Status', 'Maturity'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {(statsData?.activeLoans ?? []).map((l: any) => (
                <tr key={l.loan_id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{l.loan_number}</td>
                  <td className="px-4 py-3 text-xs">{l.customer?.first_name} {l.customer?.last_name || l.customer?.company_name}</td>
                  <td className="px-4 py-3 text-xs">{l.loan_type?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(l.principal_amount)}</td>
                  <td className="px-4 py-3 text-orange-600 font-medium">{formatCurrency(l.outstanding_balance)}</td>
                  <td className="px-4 py-3 text-xs">{(l.interest_rate * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(l.maturity_date)}</td>
                </tr>
              ))}
              {(statsData?.activeLoans ?? []).length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">No active loans found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Employee Roster Tab ──────────────────────────────────────────────────────
function EmployeesTab() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employees', query],
    queryFn: () => api.get(`/admin/employees?search=${query}&limit=50`).then(r => r.data.data),
  });

  const employees: any[] = data?.employees ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Employee Roster"
          subtitle="Branch employees — view accounts, roles, and last login times"
        />
        <div className="px-6 py-3 border-b">
          <form onSubmit={e => { e.preventDefault(); setQuery(search); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, or employee code…"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Search</button>
          </form>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['Employee', 'Code', 'Branch', 'Dept', 'Username', 'Role', 'Last Login', 'Account'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {employees.map((e: any) => (
                  <tr key={e.employee_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-card-foreground">{e.first_name} {e.last_name}</p>
                      <p className="text-xs text-muted-foreground">{e.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{e.employee_code}</td>
                    <td className="px-4 py-3 text-xs">{e.branch?.branch_name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.department?.department_name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{e.online_user?.username ?? '—'}</td>
                    <td className="px-4 py-3">
                      {e.online_user?.role ? <StatusBadge status={e.online_user.role} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {e.online_user?.last_login ? formatDate(e.online_user.last_login) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      {e.online_user?.account_locked ? (
                        <span className="text-xs text-red-600 font-medium flex items-center gap-1"><Lock className="w-3 h-3" />Locked</span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Active</span>
                      )}
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Branch Management Tab ────────────────────────────────────────────────────
function BranchesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/admin/branches').then(r => r.data.data),
  });

  const branches: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle title="Branch Network" subtitle="Branch details, department structure, and headcount" />
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : branches.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground text-sm">No branch data available</div>
        ) : (
          <div className="divide-y">
            {branches.map((b: any) => (
              <div key={b.branch_id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-card-foreground">{b.branch_name}</p>
                        <p className="text-xs text-muted-foreground">{b.branch_code} · {b.city}{b.region ? `, ${b.region}` : ''}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <p className="text-lg font-bold text-card-foreground">{b._count?.employee ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Employees</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <p className="text-lg font-bold text-card-foreground">{b._count?.account ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Accounts</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <p className="text-lg font-bold text-card-foreground">{b._count?.atm ?? 0}</p>
                        <p className="text-xs text-muted-foreground">ATMs</p>
                      </div>
                    </div>
                    {(b.department ?? []).length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Departments</p>
                        <div className="flex flex-wrap gap-1.5">
                          {b.department.map((d: any) => (
                            <span key={d.department_id} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              {d.department_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {b.phone && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-mono">{b.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────
function AuditLogTab() {
  const [filters, setFilters] = useState({ action_type: '', entity_type: '', suspicious: '', from_date: '', to_date: '' });
  const [page, setPage] = useState(1);

  const queryStr = new URLSearchParams({
    page: String(page),
    limit: '25',
    ...(filters.action_type && { action_type: filters.action_type }),
    ...(filters.entity_type && { entity_type: filters.entity_type }),
    ...(filters.suspicious && { suspicious: filters.suspicious }),
    ...(filters.from_date && { from_date: filters.from_date }),
    ...(filters.to_date && { to_date: filters.to_date }),
  }).toString();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', queryStr],
    queryFn: () => api.get(`/admin/audit-logs?${queryStr}`).then(r => r.data.data),
  });

  const logs: any[] = data?.logs ?? [];
  const meta = data?.meta ?? {};

  const ACTION_TYPES = ['LOGIN','LOGOUT','FAILED_LOGIN','CREATE','UPDATE','DELETE','TRANSACTION','LOAN_APPROVAL','CARD_BLOCK','PASSWORD_CHANGE','REFUND_APPROVAL','ACCOUNT_FREEZE','EXPORT','CONFIG_CHANGE'];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Audit Log"
          subtitle="Full audit trail — filter by action, entity, date range, or suspicious flag"
          action={
            <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          }
        />

        {/* Filters */}
        <div className="px-6 py-3 border-b grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={filters.action_type}
            onChange={e => { setFilters(f => ({...f, action_type: e.target.value})); setPage(1); }}
            className="text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Actions</option>
            {ACTION_TYPES.map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
          </select>
          <input
            value={filters.entity_type}
            onChange={e => { setFilters(f => ({...f, entity_type: e.target.value})); setPage(1); }}
            placeholder="Entity type…"
            className="text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={filters.suspicious}
            onChange={e => { setFilters(f => ({...f, suspicious: e.target.value})); setPage(1); }}
            className="text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Logs</option>
            <option value="true">Suspicious Only</option>
          </select>
          <input type="date" value={filters.from_date} onChange={e => { setFilters(f => ({...f, from_date: e.target.value})); setPage(1); }}
            className="text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="date" value={filters.to_date} onChange={e => { setFilters(f => ({...f, to_date: e.target.value})); setPage(1); }}
            className="text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {['Timestamp', 'Action', 'Entity', 'ID', 'Performed By', 'Details', 'Flag'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((l: any) => (
                    <tr key={l.log_id} className={`hover:bg-muted/30 ${l.is_suspicious ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(l.timestamp)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">{l.action_type?.replace(/_/g,' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">{l.entity_type}</td>
                      <td className="px-4 py-3 font-mono text-xs">{l.entity_id}</td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-medium">{l.performed_by?.username ?? '—'}</p>
                        {l.performed_by?.role && <StatusBadge status={l.performed_by.role} />}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{l.details}</td>
                      <td className="px-4 py-3">
                        {l.is_suspicious && (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle className="w-3 h-3" />Suspicious
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No audit logs found for the selected filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {meta.total_pages > 1 && (
              <div className="px-6 py-3 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Page {meta.current_page} of {meta.total_pages} · {meta.total_items} total</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted disabled:opacity-40">Previous</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= meta.total_pages} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Rates & Charges Tab ──────────────────────────────────────────────────────
function RatesChargesTab() {
  const { data: rates, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => api.get('/admin/exchange-rates').then(r => r.data.data),
  });
  const { data: charges, isLoading: chargesLoading } = useQuery({
    queryKey: ['charge-schedules'],
    queryFn: () => api.get('/admin/charge-schedules').then(r => r.data.data),
  });

  const ratesList: any[] = Array.isArray(rates) ? rates : [];
  const chargesList: any[] = Array.isArray(charges) ? charges : [];

  return (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
        <Lock className="w-4 h-4 flex-shrink-0" />
        Read-only view — Only ADMIN can modify exchange rates and charge schedules
      </div>

      {/* Exchange Rates */}
      <Card>
        <SectionTitle title="Exchange Rates" subtitle="Current active rates per currency pair" />
        {ratesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['From', 'To', 'Rate', 'Effective Date', 'Expiry'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {ratesList.map((r: any) => (
                  <tr key={r.rate_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold">{r.from_currency?.currency_code}</span>
                      <span className="text-muted-foreground ml-1 text-xs">{r.from_currency?.symbol}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold">{r.to_currency?.currency_code}</span>
                      <span className="text-muted-foreground ml-1 text-xs">{r.to_currency?.symbol}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-teal-600">{Number(r.rate).toFixed(4)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.effective_date)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.expiry_date ? formatDate(r.expiry_date) : '—'}</td>
                  </tr>
                ))}
                {ratesList.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No exchange rates configured</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Charge Schedules */}
      <Card>
        <SectionTitle title="Fee / Charge Schedules" subtitle="Active fee rules — flat/percentage, min/max caps" />
        {chargesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['Name', 'Transaction Type', 'Fee Type', 'Amount/Rate', 'Min Cap', 'Max Cap', 'Effective Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {chargesList.map((c: any) => (
                  <tr key={c.schedule_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-card-foreground">{c.schedule_name}</td>
                    <td className="px-4 py-3 text-xs">{c.transaction_type?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.fee_type === 'FLAT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>{c.fee_type}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-bold">
                      {c.fee_type === 'FLAT' ? formatCurrency(c.fee_amount ?? 0) : `${Number(c.fee_percentage ?? 0).toFixed(2)}%`}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.min_fee ? formatCurrency(c.min_fee) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.max_fee ? formatCurrency(c.max_fee) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.effective_date)}</td>
                  </tr>
                ))}
                {chargesList.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No charge schedules configured</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── ATM Management Tab ───────────────────────────────────────────────────────
function AtmManagementTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['atm-management'],
    queryFn: () => api.get('/admin/atm').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const atms: any[] = Array.isArray(data) ? data : [];
  const online = atms.filter(a => a.status === 'ONLINE').length;
  const lowCash = atms.filter(a => a.status === 'LOW_CASH').length;
  const offline = atms.filter(a => ['OFFLINE', 'OUT_OF_CASH', 'MAINTENANCE'].includes(a.status)).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Online"   value={online}   icon={CheckCircle2}  color="text-emerald-600" />
        <KpiCard label="Low Cash" value={lowCash}  icon={AlertTriangle} color="text-amber-600" />
        <KpiCard label="Offline / Maintenance" value={offline} icon={XCircle} color="text-red-600" />
      </div>

      <Card>
        <SectionTitle
          title="ATM Network Status"
          subtitle="Cash balances and last refill across all branches"
          action={
            <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          }
        />
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['ATM', 'Branch', 'City', 'Cash Balance', 'Capacity', 'Fill %', 'Status', 'Last Refill By', 'Last Refill'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {atms.map((a: any) => {
                  const pct = a.capacity ? Math.min(100, (Number(a.cash_balance) / Number(a.capacity)) * 100) : 0;
                  return (
                    <tr key={a.atm_id} className={`hover:bg-muted/30 ${a.status === 'OUT_OF_CASH' || a.status === 'OFFLINE' ? 'bg-red-50/40 dark:bg-red-900/5' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{a.atm_code}</p>
                        <p className="text-xs text-muted-foreground">{a.location}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">{a.branch?.branch_name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{a.branch?.city}</td>
                      <td className="px-4 py-3 font-bold">{formatCurrency(a.cash_balance)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{a.capacity ? formatCurrency(a.capacity) : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${pct < 20 ? 'bg-red-500' : pct < 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {a.last_refill_by ? `${a.last_refill_by.first_name} ${a.last_refill_by.last_name}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{a.last_refill_date ? formatDate(a.last_refill_date) : '—'}</td>
                    </tr>
                  );
                })}
                {atms.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">No ATM data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BranchManagerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-card-foreground">Branch Manager Operations Center</h1>
              <p className="text-xs text-muted-foreground">
                {user?.email} — Level 3 Branch Authority · Loan Disbursement &amp; Oversight
              </p>
            </div>
            <div className="ml-auto">
              <span className="hidden sm:flex items-center gap-1.5 text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full font-medium">
                <Briefcase className="w-3.5 h-3.5" />
                BRANCH MANAGER
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="mt-5 flex items-center gap-0.5 overflow-x-auto pb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-background border border-b-background text-foreground -mb-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'dashboard'      && <DashboardTab />}
        {activeTab === 'disbursement'   && <DisbursementTab />}
        {activeTab === 'tx-stats'       && <TxStatsTab />}
        {activeTab === 'loan-portfolio' && <LoanPortfolioTab />}
        {activeTab === 'employees'      && <EmployeesTab />}
        {activeTab === 'branches'       && <BranchesTab />}
        {activeTab === 'audit'          && <AuditLogTab />}
        {activeTab === 'rates'          && <RatesChargesTab />}
        {activeTab === 'atm'            && <AtmManagementTab />}
      </div>
    </div>
  );
}
