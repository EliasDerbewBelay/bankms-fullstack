'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { useAuthStore } from '../../../store/auth.store';
import { useToast } from '../../../components/ui/toaster';
import {
  Shield, DollarSign, ClipboardList, Users, Building2, Lock,
  AlertTriangle, Settings, BarChart3, Coins, Loader2, Search,
  CheckCircle2, XCircle, RefreshCw, Eye, EyeOff, Ban, Unlock,
  Plus, Pencil, AlertCircle, LogOut, KeyRound, Trash2,
  TrendingUp, FileText, Landmark, Activity,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab =
  | 'dashboard' | 'exchange-rates' | 'charge-schedules' | 'users'
  | 'employees' | 'branches' | 'security' | 'suspicious'
  | 'account-types' | 'currencies' | 'reports';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',        label: 'Dashboard',          icon: BarChart3 },
  { id: 'exchange-rates',   label: 'Exchange Rates',     icon: DollarSign },
  { id: 'charge-schedules', label: 'Charge Schedules',   icon: ClipboardList },
  { id: 'users',            label: 'User Accounts',      icon: Users },
  { id: 'employees',        label: 'Employees',          icon: Users },
  { id: 'branches',         label: 'Branches & Depts',   icon: Building2 },
  { id: 'security',         label: 'Security Oversight', icon: Lock },
  { id: 'suspicious',       label: 'Suspicious Activity',icon: AlertTriangle },
  { id: 'account-types',    label: 'Account Types',      icon: Settings },
  { id: 'currencies',       label: 'Currencies',         icon: Coins },
  { id: 'reports',          label: 'System Reports',     icon: BarChart3 },
];

// ─── Shared ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    INACTIVE: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    ADMIN:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    BRANCH_MANAGER: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    SUPERVISOR: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    TELLER:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    CUSTOMER: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    true:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    false:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    LOCKED:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    UNLOCKED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    FLAT:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PERCENTAGE: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  };
  const label = typeof status === 'boolean' ? (status ? 'YES' : 'NO') : status.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[String(status)] ?? 'bg-muted text-muted-foreground'}`}>
      {label}
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

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-opacity-10 bg-current`} style={{ backgroundColor: 'currentColor', opacity: 0.1 }}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

const COLORS = ['#14b8a6','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#22c55e','#ec4899','#64748b'];

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
    refetchInterval: 60_000,
  });
  const { data: secData } = useQuery({
    queryKey: ['security-stats'],
    queryFn: () => api.get('/admin/security-stats').then(r => r.data.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  const byTypeData = (data.byType ?? []).map((t: any) => ({ name: t.type.replace(/_/g,' '), value: t.count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Customers" value={data.customers.total}          sub={`${data.customers.verificationRate}% KYC verified`} icon={Users}         color="text-blue-600" />
        <KpiCard label="Active Accounts" value={data.accounts.active}          sub={`of ${data.accounts.total} total`}                 icon={Coins}         color="text-teal-600" />
        <KpiCard label="Txns Today"      value={data.transactions.today}       sub={formatCurrency(data.transactions.volumeToday)}     icon={Activity}      color="text-violet-600" />
        <KpiCard label="NPL Ratio"       value={`${data.loans.nplRatio}%`}     sub={`${data.loans.defaulted} defaulted`}               icon={AlertTriangle} color="text-red-600" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Active Sessions"  value={secData?.activeSessions ?? '—'}   icon={Lock}          color="text-emerald-600" />
        <KpiCard label="Locked Accounts"  value={secData?.lockedAccounts ?? '—'}   icon={Ban}           color="text-red-500" />
        <KpiCard label="Suspicious Today" value={secData?.suspiciousToday ?? '—'}  icon={AlertTriangle} color="text-amber-600" />
        <KpiCard label="Failed Logins"    value={secData?.failedLoginsToday ?? '—'} icon={XCircle}      color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Transaction Type Breakdown" subtitle="All-time completed" />
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#14b8a6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionTitle title="Loan Portfolio" subtitle="By status" />
          <div className="p-6 space-y-3">
            {[
              { label: 'Total Loans', value: data.loans.total, color: 'text-card-foreground' },
              { label: 'Active', value: data.loans.active, color: 'text-emerald-600' },
              { label: 'Defaulted (NPL)', value: data.loans.defaulted, color: 'text-red-600' },
              { label: 'Total Disbursed', value: formatCurrency(data.loans.totalDisbursed), color: 'text-teal-600' },
              { label: 'Outstanding', value: formatCurrency(data.loans.totalOutstanding), color: 'text-orange-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={`font-bold text-sm ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Exchange Rates Tab ───────────────────────────────────────────────────────
function ExchangeRatesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const { data: rates, isLoading } = useQuery({
    queryKey: ['all-exchange-rates'],
    queryFn: () => api.get('/admin/exchange-rates/all').then(r => r.data.data),
  });
  const { data: currencies } = useQuery({
    queryKey: ['admin-currencies'],
    queryFn: () => api.get('/admin/currencies').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/admin/exchange-rates', d),
    onSuccess: () => { toast('Exchange rate created', 'success'); qc.invalidateQueries({ queryKey: ['all-exchange-rates'] }); setShowForm(false); reset(); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const expireMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/exchange-rates/${id}/expire`),
    onSuccess: () => { toast('Rate expired', 'success'); qc.invalidateQueries({ queryKey: ['all-exchange-rates'] }); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const ratesList: any[] = Array.isArray(rates) ? rates : [];
  const currList: any[] = Array.isArray(currencies) ? currencies : [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Exchange Rate Management"
          subtitle="Historical rates are preserved — setting expiry_date retires a rate"
          action={
            <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" />New Rate
            </button>
          }
        />
        {showForm && (
          <form onSubmit={handleSubmit(d => createMutation.mutate({ ...d, rate: parseFloat(d.rate), from_currency_id: parseInt(d.from_currency_id), to_currency_id: parseInt(d.to_currency_id) }))}
            className="px-6 py-4 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium">From Currency *</label>
              <select {...register('from_currency_id', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select…</option>
                {currList.filter(c => c.is_active).map(c => <option key={c.currency_id} value={c.currency_id}>{c.currency_code} — {c.currency_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">To Currency *</label>
              <select {...register('to_currency_id', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select…</option>
                {currList.filter(c => c.is_active).map(c => <option key={c.currency_id} value={c.currency_id}>{c.currency_code} — {c.currency_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Rate *</label>
              <input type="number" step="0.00000001" {...register('rate', { required: true })} placeholder="e.g. 56.5000" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium">Source</label>
              <input {...register('source')} defaultValue="NBE" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium">Effective Date</label>
              <input type="date" {...register('effective_date')} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium">Expiry Date (optional)</label>
              <input type="date" {...register('expiry_date')} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}Save
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="px-4 py-2 bg-muted text-muted-foreground text-sm rounded-lg hover:bg-muted/80">Cancel</button>
            </div>
          </form>
        )}
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">{['From','To','Rate','Source','Effective','Expiry','Status','Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {ratesList.map((r: any) => (
                  <tr key={r.rate_id} className={`hover:bg-muted/30 ${r.expiry_date && new Date(r.expiry_date) < new Date() ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono font-bold">{r.from_currency?.currency_code}</td>
                    <td className="px-4 py-3 font-mono font-bold">{r.to_currency?.currency_code}</td>
                    <td className="px-4 py-3 font-bold text-teal-600">{Number(r.rate).toFixed(4)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.source}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(r.effective_date)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.expiry_date ? formatDate(r.expiry_date) : '—'}</td>
                    <td className="px-4 py-3">{r.expiry_date && new Date(r.expiry_date) < new Date() ? <StatusBadge status="INACTIVE" /> : <StatusBadge status="ACTIVE" />}</td>
                    <td className="px-4 py-3">
                      {(!r.expiry_date || new Date(r.expiry_date) > new Date()) && (
                        <button onClick={() => expireMutation.mutate(r.rate_id)} className="text-xs text-red-600 hover:underline">Expire</button>
                      )}
                    </td>
                  </tr>
                ))}
                {ratesList.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">No exchange rates found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Charge Schedules Tab ─────────────────────────────────────────────────────
function ChargeSchedulesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, watch } = useForm<any>({ defaultValues: { charge_type: 'FLAT' } });
  const chargeType = watch('charge_type');

  const { data, isLoading } = useQuery({
    queryKey: ['charge-schedules-admin'],
    queryFn: () => api.get('/admin/charge-schedules').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/admin/charge-schedules', d),
    onSuccess: () => { toast('Charge schedule created', 'success'); qc.invalidateQueries({ queryKey: ['charge-schedules-admin'] }); setShowForm(false); reset(); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const expireMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/charge-schedules/${id}/expire`),
    onSuccess: () => { toast('Charge schedule expired', 'success'); qc.invalidateQueries({ queryKey: ['charge-schedules-admin'] }); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const APPLICABLE_TO = ['DEPOSIT','WITHDRAWAL','INTERNAL_TRANSFER','INTERBANK_TRANSFER','CARD_PAYMENT','UTILITY_PAYMENT','FX_CONVERSION','LOAN_PROCESSING'];
  const schedules: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle title="Fee / Charge Schedule Config" subtitle="Setting expiry_date retires a rule — historical records preserved"
          action={<button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"><Plus className="w-3.5 h-3.5" />New Rule</button>}
        />
        {showForm && (
          <form onSubmit={handleSubmit(d => createMutation.mutate({
            ...d,
            flat_amount: d.charge_type === 'FLAT' ? parseFloat(d.flat_amount || 0) : null,
            percentage_rate: d.charge_type === 'PERCENTAGE' ? parseFloat(d.percentage_rate || 0) / 100 : null,
            min_charge: d.min_charge ? parseFloat(d.min_charge) : null,
            max_charge: d.max_charge ? parseFloat(d.max_charge) : null,
          }))} className="px-6 py-4 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium">Rule Name *</label>
              <input {...register('charge_name', { required: true })} placeholder="e.g. Interbank Transfer Fee" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium">Applies To *</label>
              <select {...register('applicable_to', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select…</option>
                {APPLICABLE_TO.map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Type *</label>
              <select {...register('charge_type', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="FLAT">Flat Amount</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>
            </div>
            {chargeType === 'FLAT' ? (
              <div>
                <label className="text-xs font-medium">Flat Amount *</label>
                <input type="number" step="0.01" {...register('flat_amount')} placeholder="0.00" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium">Percentage (%) *</label>
                <input type="number" step="0.0001" {...register('percentage_rate')} placeholder="e.g. 1.5" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium">Min Cap</label>
              <input type="number" step="0.01" {...register('min_charge')} placeholder="0.00" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium">Max Cap</label>
              <input type="number" step="0.01" {...register('max_charge')} placeholder="No limit" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium">Effective Date *</label>
              <input type="date" {...register('effective_date', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}Save
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="px-4 py-2 bg-muted text-muted-foreground text-sm rounded-lg">Cancel</button>
            </div>
          </form>
        )}
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">{['Name','Applies To','Type','Amount/Rate','Min','Max','Effective','Expiry','Active','Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {schedules.map((s: any) => (
                  <tr key={s.schedule_id} className={`hover:bg-muted/30 ${!s.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-sm">{s.charge_name}</td>
                    <td className="px-4 py-3 text-xs">{s.applicable_to?.replace(/_/g,' ')}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.charge_type} /></td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {s.charge_type === 'FLAT' ? formatCurrency(s.flat_amount ?? 0) : `${(Number(s.percentage_rate ?? 0) * 100).toFixed(2)}%`}
                    </td>
                    <td className="px-4 py-3 text-xs">{s.min_charge ? formatCurrency(s.min_charge) : '—'}</td>
                    <td className="px-4 py-3 text-xs">{s.max_charge ? formatCurrency(s.max_charge) : '—'}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(s.effective_date)}</td>
                    <td className="px-4 py-3 text-xs">{s.expiry_date ? formatDate(s.expiry_date) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.is_active ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="px-4 py-3">
                      {s.is_active && <button onClick={() => expireMutation.mutate(s.schedule_id)} className="text-xs text-red-600 hover:underline">Expire</button>}
                    </td>
                  </tr>
                ))}
                {schedules.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground text-sm">No charge schedules found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── User Accounts Tab ────────────────────────────────────────────────────────
function UsersTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [resetModal, setResetModal] = useState<any>(null);
  const [newPwd, setNewPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', query],
    queryFn: () => api.get(`/admin/users?search=${query}&limit=50`).then(r => r.data.data),
  });

  const lockMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/users/${id}/lock`),
    onSuccess: () => { toast('User locked', 'success'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });
  const unlockMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/users/${id}/unlock`),
    onSuccess: () => { toast('User unlocked', 'success'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });
  const resetPwdMutation = useMutation({
    mutationFn: ({ id, pwd }: { id: number; pwd: string }) => api.patch(`/admin/users/${id}/reset-password`, { new_password: pwd }),
    onSuccess: () => { toast('Password reset — user must change on next login', 'success'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setResetModal(null); setNewPwd(''); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });
  const disable2FAMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}/2fa`),
    onSuccess: () => { toast('2FA disabled', 'success'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });
  const invalidateAllMutation = useMutation({
    mutationFn: (userId: number) => api.patch(`/admin/users/${userId}/sessions/invalidate-all`),
    onSuccess: () => toast('All sessions invalidated', 'success'),
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const users: any[] = data?.users ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle title="User Account Management" subtitle="Lock/unlock, reset passwords, disable 2FA, invalidate sessions" />
        <div className="px-6 py-3 border-b">
          <form onSubmit={e => { e.preventDefault(); setQuery(search); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search username, name…" className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Search</button>
          </form>
        </div>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">{['User','Role','Linked To','Last Login','2FA','Status','Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {users.map((u: any) => (
                  <tr key={u.user_id} className={`hover:bg-muted/30 ${u.account_locked ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-mono font-medium text-sm">{u.username}</p>
                      <p className="text-xs text-muted-foreground">ID: {u.user_id}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.linked_employee ? `${u.linked_employee.first_name} ${u.linked_employee.last_name}` : u.linked_customer ? `${u.linked_customer.first_name ?? ''} ${u.linked_customer.last_name ?? u.linked_customer.company_name ?? ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.last_login ? formatDate(u.last_login) : 'Never'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${u.two_factor_enabled ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {u.two_factor_enabled ? '✓ Enabled' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.account_locked ? (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><Ban className="w-3 h-3" />Locked</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3 h-3" />Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {u.account_locked ? (
                          <button onClick={() => unlockMutation.mutate(u.user_id)} className="px-2 py-1 text-[10px] rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">Unlock</button>
                        ) : (
                          <button onClick={() => lockMutation.mutate(u.user_id)} className="px-2 py-1 text-[10px] rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">Lock</button>
                        )}
                        <button onClick={() => { setResetModal(u); setNewPwd(''); }} className="px-2 py-1 text-[10px] rounded bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400">Reset Pwd</button>
                        {u.two_factor_enabled && (
                          <button onClick={() => disable2FAMutation.mutate(u.user_id)} className="px-2 py-1 text-[10px] rounded bg-slate-100 text-slate-700 hover:bg-slate-200">Dis. 2FA</button>
                        )}
                        <button onClick={() => invalidateAllMutation.mutate(u.user_id)} className="px-2 py-1 text-[10px] rounded bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400">Kill Sessions</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No users found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Reset Password</h3>
                <p className="text-xs text-muted-foreground font-mono">{resetModal.username}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">New Password *</label>
              <div className="relative mt-1.5">
                <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min 8 characters" className="w-full text-sm p-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring pr-10" />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">User will be forced to change on next login</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { if (!newPwd || newPwd.length < 8) return toast('Password must be at least 8 characters', 'error'); resetPwdMutation.mutate({ id: resetModal.user_id, pwd: newPwd }); }}
                disabled={resetPwdMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50">
                {resetPwdMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}Reset
              </button>
              <button onClick={() => { setResetModal(null); setNewPwd(''); }} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Employees Tab ────────────────────────────────────────────────────────────
function EmployeesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();

  const { data: empData, isLoading } = useQuery({
    queryKey: ['admin-employees', query],
    queryFn: () => api.get(`/admin/employees?search=${query}&limit=50`).then(r => r.data.data),
  });
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/admin/branches').then(r => r.data.data),
  });
  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/admin/departments').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/admin/employees', { ...d, salary: parseFloat(d.salary), branch_id: parseInt(d.branch_id), department_id: d.department_id ? parseInt(d.department_id) : null }),
    onSuccess: () => { toast('Employee created', 'success'); qc.invalidateQueries({ queryKey: ['admin-employees'] }); setShowForm(false); reset(); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const employees: any[] = empData?.employees ?? [];
  const branchList: any[] = Array.isArray(branches) ? branches : [];
  const deptList: any[] = Array.isArray(depts) ? depts : [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle title="Employee Management" subtitle="Full CRUD across all branches — assign roles, departments, manager relationships"
          action={<button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"><Plus className="w-3.5 h-3.5" />New Employee</button>}
        />
        {showForm && (
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="px-6 py-4 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="text-xs font-medium">First Name *</label><input {...register('first_name', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-medium">Last Name *</label><input {...register('last_name', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-medium">Email *</label><input type="email" {...register('email', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-medium">Position *</label><input {...register('position', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div>
              <label className="text-xs font-medium">Type</label>
              <select {...register('employee_type')} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option><option value="CONTRACT">Contract</option><option value="INTERN">Intern</option>
              </select>
            </div>
            <div><label className="text-xs font-medium">Salary</label><input type="number" step="0.01" {...register('salary')} defaultValue="0" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-medium">Hire Date *</label><input type="date" {...register('hire_date', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div>
              <label className="text-xs font-medium">Branch *</label>
              <select {...register('branch_id', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select…</option>
                {branchList.map((b: any) => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Department</label>
              <select {...register('department_id')} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">None</option>
                {deptList.map((d: any) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-medium">Phone</label><input {...register('phone_number')} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}Create
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="px-4 py-2 bg-muted text-muted-foreground text-sm rounded-lg">Cancel</button>
            </div>
          </form>
        )}
        <div className="px-6 py-3 border-b">
          <form onSubmit={e => { e.preventDefault(); setQuery(search); }} className="flex gap-2">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, code…" className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Search</button>
          </form>
        </div>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">{['Employee','Code','Branch','Dept','Position','Type','Hire Date','Account'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {employees.map((e: any) => (
                  <tr key={e.employee_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3"><p className="font-medium">{e.first_name} {e.last_name}</p><p className="text-xs text-muted-foreground">{e.email}</p></td>
                    <td className="px-4 py-3 font-mono text-xs">{e.employee_code}</td>
                    <td className="px-4 py-3 text-xs">{e.branch?.branch_name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.department?.department_name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{e.position}</td>
                    <td className="px-4 py-3 text-xs">{e.employee_type?.replace(/_/g,' ')}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(e.hire_date)}</td>
                    <td className="px-4 py-3 text-xs">{e.online_user ? <StatusBadge status={e.online_user.role} /> : <span className="text-muted-foreground">No account</span>}</td>
                  </tr>
                ))}
                {employees.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">No employees found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Security Oversight Tab ───────────────────────────────────────────────────
function SecurityTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sessions', activeOnly, page],
    queryFn: () => api.get(`/admin/sessions?active_only=${activeOnly}&page=${page}&limit=25`).then(r => r.data.data),
  });
  const { data: secStats } = useQuery({
    queryKey: ['security-stats'],
    queryFn: () => api.get('/admin/security-stats').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const invalidateMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/sessions/${id}/invalidate`),
    onSuccess: () => { toast('Session force-invalidated', 'success'); qc.invalidateQueries({ queryKey: ['sessions'] }); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const sessions: any[] = data?.sessions ?? [];
  const meta = data?.meta ?? {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Active Sessions"   value={secStats?.activeSessions ?? '—'}    icon={Activity}     color="text-emerald-600" />
        <KpiCard label="Locked Accounts"   value={secStats?.lockedAccounts ?? '—'}    icon={Ban}          color="text-red-600" />
        <KpiCard label="Suspicious Today"  value={secStats?.suspiciousToday ?? '—'}   icon={AlertTriangle} color="text-amber-600" />
        <KpiCard label="Failed Logins Today" value={secStats?.failedLoginsToday ?? '—'} icon={XCircle}    color="text-orange-600" />
      </div>

      <Card>
        <SectionTitle title="Session Management" subtitle="Force-invalidate suspicious sessions"
          action={
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={activeOnly} onChange={e => { setActiveOnly(e.target.checked); setPage(1); }} className="rounded" />
                Active only
              </label>
              <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-muted"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          }
        />
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">{['User','Role','IP Address','Device','Created','Last Active','Expires','Status','Action'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {sessions.map((s: any) => (
                    <tr key={s.session_id} className={`hover:bg-muted/30 ${!s.is_active ? 'opacity-40' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs">{s.online_user?.username}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.online_user?.role ?? 'CUSTOMER'} /></td>
                      <td className="px-4 py-3 font-mono text-xs">{s.ip_address}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{s.device_name ?? s.user_agent?.substring(0,40) ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(s.last_active_at)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(s.expires_at)}</td>
                      <td className="px-4 py-3">{s.is_active && new Date(s.expires_at) > new Date() ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="INACTIVE" />}</td>
                      <td className="px-4 py-3">
                        {s.is_active && <button onClick={() => invalidateMutation.mutate(s.session_id)} className="text-xs text-red-600 hover:underline flex items-center gap-1"><LogOut className="w-3 h-3" />Revoke</button>}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">No sessions found</td></tr>}
                </tbody>
              </table>
            </div>
            {meta.total_pages > 1 && (
              <div className="px-6 py-3 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Page {meta.current_page} of {meta.total_pages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => p-1)} disabled={page <= 1} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted disabled:opacity-40">Previous</button>
                  <button onClick={() => setPage(p => p+1)} disabled={page >= meta.total_pages} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Suspicious Activity Tab ──────────────────────────────────────────────────
function SuspiciousTab() {
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const queryStr = new URLSearchParams({ page: String(page), limit: '25', suspicious: 'true', ...(fromDate && { from_date: fromDate }), ...(toDate && { to_date: toDate }) }).toString();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['suspicious-logs', queryStr],
    queryFn: () => api.get(`/admin/audit-logs?${queryStr}`).then(r => r.data.data),
  });

  const logs: any[] = data?.logs ?? [];
  const meta = data?.meta ?? {};

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">Suspicious Activity Monitor</p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">Audit log entries flagged as suspicious — append-only at DB level, even Admin cannot modify or delete these records.</p>
        </div>
      </div>
      <Card>
        <SectionTitle title="Suspicious Audit Logs" subtitle="is_suspicious = TRUE — filtered view"
          action={
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="text-xs border rounded-lg px-2 py-1.5 bg-background" />
              <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="text-xs border rounded-lg px-2 py-1.5 bg-background" />
              <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-muted"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          }
        />
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">{['Timestamp','Action','Entity','ID','User','Details','IP'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {logs.map((l: any) => (
                    <tr key={l.log_id} className="bg-red-50/30 dark:bg-red-900/5 hover:bg-red-50/50">
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDate(l.timestamp)}</td>
                      <td className="px-4 py-3"><span className="text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">{l.action_type?.replace(/_/g,' ')}</span></td>
                      <td className="px-4 py-3 text-xs">{l.entity_type}</td>
                      <td className="px-4 py-3 font-mono text-xs">{l.entity_id}</td>
                      <td className="px-4 py-3 text-xs"><p className="font-medium">{l.performed_by?.username ?? '—'}</p>{l.performed_by?.role && <StatusBadge status={l.performed_by.role} />}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{l.details}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.ip_address ?? '—'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No suspicious activity found</td></tr>}
                </tbody>
              </table>
            </div>
            {meta.total_pages > 1 && (
              <div className="px-6 py-3 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Page {meta.current_page} of {meta.total_pages} · {meta.total_items} total</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => p-1)} disabled={page <= 1} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted disabled:opacity-40">Previous</button>
                  <button onClick={() => setPage(p => p+1)} disabled={page >= meta.total_pages} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Account Types Tab ────────────────────────────────────────────────────────
function AccountTypesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const { register, handleSubmit, reset } = useForm<any>();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-account-types'],
    queryFn: () => api.get('/admin/account-types').then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => api.patch(`/admin/account-types/${id}`, body),
    onSuccess: () => { toast('Account type updated', 'success'); qc.invalidateQueries({ queryKey: ['admin-account-types'] }); setEditingId(null); reset(); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const types: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle title="Account Type Configuration" subtitle="Interest rates, min/max balances, calculation methods, accrual frequency" />
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <div className="divide-y">
            {types.map((t: any) => (
              <div key={t.account_type_id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-card-foreground">{t.type_name}</p>
                      <StatusBadge status={t.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </div>
                    {editingId !== t.account_type_id && (
                      <div className="mt-2 grid grid-cols-3 md:grid-cols-5 gap-3">
                        {[
                          ['Interest Rate', `${(Number(t.interest_rate) * 100).toFixed(2)}%`],
                          ['Min Balance', formatCurrency(t.minimum_balance)],
                          ['Max Balance', t.maximum_balance ? formatCurrency(t.maximum_balance) : 'No limit'],
                          ['Calc Method', t.calc_method?.replace(/_/g,' ')],
                          ['Accrual', `Every ${t.accrual_frequency}d`],
                        ].map(([label, val]) => (
                          <div key={label} className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-[10px] text-muted-foreground">{label}</p>
                            <p className="text-xs font-medium mt-0.5">{val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { if (editingId === t.account_type_id) { setEditingId(null); reset(); } else setEditingId(t.account_type_id); }}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    <Pencil className="w-3.5 h-3.5" />{editingId === t.account_type_id ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {editingId === t.account_type_id && (
                  <form onSubmit={handleSubmit(d => updateMutation.mutate({ id: t.account_type_id, body: {
                    interest_rate: parseFloat(d.interest_rate) / 100,
                    minimum_balance: parseFloat(d.minimum_balance),
                    maximum_balance: d.maximum_balance ? parseFloat(d.maximum_balance) : null,
                    calc_method: d.calc_method,
                    accrual_frequency: parseInt(d.accrual_frequency),
                    is_active: d.is_active === 'true',
                    description: d.description,
                  }}))} className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/30 border">
                    <div><label className="text-xs font-medium">Interest Rate (%)</label><input type="number" step="0.01" defaultValue={(Number(t.interest_rate)*100).toFixed(2)} {...register('interest_rate')} className="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                    <div><label className="text-xs font-medium">Min Balance</label><input type="number" step="0.01" defaultValue={Number(t.minimum_balance)} {...register('minimum_balance')} className="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                    <div><label className="text-xs font-medium">Max Balance</label><input type="number" step="0.01" defaultValue={t.maximum_balance ? Number(t.maximum_balance) : ''} {...register('maximum_balance')} placeholder="No limit" className="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                    <div><label className="text-xs font-medium">Calc Method</label><select defaultValue={t.calc_method} {...register('calc_method')} className="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"><option value="SIMPLE">Simple</option><option value="COMPOUND_DAILY">Compound Daily</option><option value="COMPOUND_MONTHLY">Compound Monthly</option></select></div>
                    <div><label className="text-xs font-medium">Accrual Frequency (days)</label><input type="number" defaultValue={t.accrual_frequency} {...register('accrual_frequency')} className="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                    <div><label className="text-xs font-medium">Status</label><select defaultValue={String(t.is_active)} {...register('is_active')} className="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"><option value="true">Active</option><option value="false">Inactive</option></select></div>
                    <div className="col-span-2"><label className="text-xs font-medium">Description</label><input defaultValue={t.description ?? ''} {...register('description')} className="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                    <div className="flex items-end gap-2">
                      <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {updateMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}Save
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Currencies Tab ───────────────────────────────────────────────────────────
function CurrenciesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-currencies'],
    queryFn: () => api.get('/admin/currencies').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/admin/currencies', { ...d, is_base: d.is_base === 'true' }),
    onSuccess: () => { toast('Currency added', 'success'); qc.invalidateQueries({ queryKey: ['admin-currencies'] }); setShowForm(false); reset(); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => api.patch(`/admin/currencies/${id}`, { is_active }),
    onSuccess: () => { toast('Currency updated', 'success'); qc.invalidateQueries({ queryKey: ['admin-currencies'] }); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const currencies: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        Partial unique index ensures only one base currency (ETB) exists at a time — deactivate before adding a new one.
      </div>
      <Card>
        <SectionTitle title="Currency Management" subtitle="Add/activate/deactivate currencies across the system"
          action={<button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"><Plus className="w-3.5 h-3.5" />Add Currency</button>}
        />
        {showForm && (
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="px-6 py-4 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><label className="text-xs font-medium">Code (3-letter) *</label><input {...register('currency_code', { required: true })} placeholder="USD" maxLength={3} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring uppercase" /></div>
            <div><label className="text-xs font-medium">Name *</label><input {...register('currency_name', { required: true })} placeholder="US Dollar" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-medium">Symbol *</label><input {...register('symbol', { required: true })} placeholder="$" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-medium">Base Currency</label><select {...register('is_base')} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"><option value="false">No</option><option value="true">Yes (ETB)</option></select></div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}Add
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="px-4 py-2 bg-muted text-muted-foreground text-sm rounded-lg">Cancel</button>
            </div>
          </form>
        )}
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">{['Code','Name','Symbol','Base','Status','Toggle'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {currencies.map((c: any) => (
                  <tr key={c.currency_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-bold text-sm">{c.currency_code}</td>
                    <td className="px-4 py-3">{c.currency_name}</td>
                    <td className="px-4 py-3 font-bold text-lg">{c.symbol}</td>
                    <td className="px-4 py-3">{c.is_base ? <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-medium">BASE</span> : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.is_active ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleMutation.mutate({ id: c.currency_id, is_active: !c.is_active })}
                        className={`text-xs px-3 py-1 rounded-lg font-medium ${c.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {currencies.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No currencies found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Branches & Departments Tab ───────────────────────────────────────────────
function BranchesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const { register: regB, handleSubmit: handleB, reset: resetB } = useForm<any>();
  const { register: regD, handleSubmit: handleD, reset: resetD } = useForm<any>();

  const { data: branches, isLoading: bl } = useQuery({ queryKey: ['branches'], queryFn: () => api.get('/admin/branches').then(r => r.data.data) });
  const { data: depts, isLoading: dl } = useQuery({ queryKey: ['departments'], queryFn: () => api.get('/admin/departments').then(r => r.data.data) });
  const { data: bankData } = useQuery({ queryKey: ['banks'], queryFn: () => api.get('/transactions/banks').then(r => r.data.data) });

  const createBranchMutation = useMutation({
    mutationFn: (d: any) => api.post('/admin/branches', { ...d, bank_id: parseInt(d.bank_id), parent_branch_id: d.parent_branch_id ? parseInt(d.parent_branch_id) : null }),
    onSuccess: () => { toast('Branch created', 'success'); qc.invalidateQueries({ queryKey: ['branches'] }); setShowBranchForm(false); resetB(); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const createDeptMutation = useMutation({
    mutationFn: (d: any) => api.post('/admin/departments', { ...d, branch_id: parseInt(d.branch_id) }),
    onSuccess: () => { toast('Department created', 'success'); qc.invalidateQueries({ queryKey: ['departments'] }); setShowDeptForm(false); resetD(); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  });

  const branchList: any[] = Array.isArray(branches) ? branches : [];
  const deptList: any[] = Array.isArray(depts) ? depts : [];
  const bankList: any[] = Array.isArray(bankData) ? bankData : [];

  return (
    <div className="space-y-6">
      {/* Branches */}
      <Card>
        <SectionTitle title="Branch Configuration" subtitle="Create and manage branches, set hierarchy"
          action={<button onClick={() => setShowBranchForm(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"><Plus className="w-3.5 h-3.5" />New Branch</button>}
        />
        {showBranchForm && (
          <form onSubmit={handleB(d => createBranchMutation.mutate(d))} className="px-6 py-4 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="text-xs font-medium">Branch Name *</label><input {...regB('branch_name', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-medium">Branch Code *</label><input {...regB('branch_code', { required: true })} placeholder="e.g. BR001" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-medium">City *</label><input {...regB('city', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-medium">Region</label><input {...regB('region')} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div>
              <label className="text-xs font-medium">Bank *</label>
              <select {...regB('bank_id', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select bank…</option>
                {bankList.map((b: any) => <option key={b.bank_id} value={b.bank_id}>{b.bank_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Parent Branch</label>
              <select {...regB('parent_branch_id')} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">None (top-level)</option>
                {branchList.map((b: any) => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-medium">Phone</label><input {...regB('phone')} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={createBranchMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {createBranchMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}Create
              </button>
              <button type="button" onClick={() => { setShowBranchForm(false); resetB(); }} className="px-4 py-2 bg-muted text-muted-foreground text-sm rounded-lg">Cancel</button>
            </div>
          </form>
        )}
        {bl ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">{['Branch','Code','City','Employees','Accounts','ATMs','Departments'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {branchList.map((b: any) => (
                  <tr key={b.branch_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{b.branch_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{b.branch_code}</td>
                    <td className="px-4 py-3 text-xs">{b.city}{b.region ? `, ${b.region}` : ''}</td>
                    <td className="px-4 py-3 font-bold text-center">{b._count?.employee ?? 0}</td>
                    <td className="px-4 py-3 font-bold text-center">{b._count?.account ?? 0}</td>
                    <td className="px-4 py-3 font-bold text-center">{b._count?.atm ?? 0}</td>
                    <td className="px-4 py-3 text-xs">{b.department?.map((d: any) => d.department_name).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Departments */}
      <Card>
        <SectionTitle title="Department Configuration" subtitle="Create departments and assign managers"
          action={<button onClick={() => setShowDeptForm(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"><Plus className="w-3.5 h-3.5" />New Dept</button>}
        />
        {showDeptForm && (
          <form onSubmit={handleD(d => createDeptMutation.mutate(d))} className="px-6 py-4 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="text-xs font-medium">Department Name *</label><input {...regD('department_name', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div>
              <label className="text-xs font-medium">Branch *</label>
              <select {...regD('branch_id', { required: true })} className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select…</option>
                {branchList.map((b: any) => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-medium">Cost Center</label><input {...regD('cost_center')} placeholder="e.g. CC001" className="mt-1 w-full text-sm border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={createDeptMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {createDeptMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}Create
              </button>
              <button type="button" onClick={() => { setShowDeptForm(false); resetD(); }} className="px-4 py-2 bg-muted text-muted-foreground text-sm rounded-lg">Cancel</button>
            </div>
          </form>
        )}
        {dl ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">{['Department','Branch','Cost Center','Employees','Manager'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {deptList.map((d: any) => (
                  <tr key={d.department_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{d.department_name}</td>
                    <td className="px-4 py-3 text-xs">{d.branch?.branch_name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.cost_center ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-center">{d._count?.employees ?? 0}</td>
                    <td className="px-4 py-3 text-xs">{d.manager ? `${d.manager.first_name} ${d.manager.last_name}` : '—'}</td>
                  </tr>
                ))}
                {deptList.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No departments found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── System Reports Tab ───────────────────────────────────────────────────────
function ReportsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-summary'],
    queryFn: () => api.get('/admin/reports/summary').then(r => r.data.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  const kycPie = (data.kycSummary ?? []).map((k: any) => ({ name: k.kyc_status.replace(/_/g,' '), value: k._count.customer_id }));
  const loanAgingBar = (data.loanAging ?? []).map((l: any) => ({ status: l.status.replace(/_/g,' '), count: l._count.loan_id, outstanding: Number(l._sum?.outstanding_balance ?? 0) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        Read-only report data — financial records and audit logs are immutable at the database level.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KYC Status */}
        <Card>
          <SectionTitle title="KYC Status Distribution" subtitle="All customers" />
          <div className="p-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={kycPie} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {kycPie.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Loan Aging */}
        <Card>
          <SectionTitle title="Loan Aging Report" subtitle="By loan status" />
          <div className="p-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanAgingBar}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any, n) => n === 'outstanding' ? formatCurrency(v) : v} />
                <Bar dataKey="count" fill="#14b8a6" radius={[4,4,0,0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Transaction Summary */}
      <Card>
        <SectionTitle title="Transaction Summary — Last 30 Days" subtitle="By type and status" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">{['Type','Status','Count','Volume'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {(data.txSummary ?? []).map((t: any, i: number) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs font-medium">{t.transaction_type?.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 font-bold">{t._count.transaction_id}</td>
                  <td className="px-4 py-3 font-bold text-teal-600">{formatCurrency(Number(t._sum?.amount ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ATM Performance */}
      <Card>
        <SectionTitle title="ATM Performance Report" subtitle="Cash levels and transaction counts" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">{['ATM Code','Branch','Status','Cash Balance','Capacity','Fill %','Total Txns'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {(data.atmPerformance ?? []).map((a: any) => {
                const pct = a.capacity ? Math.min(100, (Number(a.cash_balance) / Number(a.capacity)) * 100) : 0;
                return (
                  <tr key={a.atm_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-sm">{a.atm_code}</td>
                    <td className="px-4 py-3 text-xs">{a.branch?.branch_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(a.cash_balance)}</td>
                    <td className="px-4 py-3 text-xs">{a.capacity ? formatCurrency(a.capacity) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5"><div className={`h-1.5 rounded-full ${pct < 20 ? 'bg-red-500' : pct < 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-center">{a._count?.atm_transaction ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-card-foreground">Admin Operations Center</h1>
              <p className="text-xs text-muted-foreground">{user?.email} — Level 4 Highest Privilege · Full System Access</p>
            </div>
            <div className="ml-auto">
              <span className="hidden sm:flex items-center gap-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-full font-medium">
                <Shield className="w-3.5 h-3.5" />ADMIN
              </span>
            </div>
          </div>

          {/* Immutability notice */}
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Lock className="w-3 h-3" />
            Cannot do: Modify/delete audit_log entries (DB-level append-only trigger) · Delete transactions (financial records are immutable)
          </div>

          {/* Tabs */}
          <div className="mt-4 flex items-center gap-0.5 overflow-x-auto pb-px">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-background border border-b-background text-foreground -mb-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'dashboard'        && <DashboardTab />}
        {activeTab === 'exchange-rates'   && <ExchangeRatesTab />}
        {activeTab === 'charge-schedules' && <ChargeSchedulesTab />}
        {activeTab === 'users'            && <UsersTab />}
        {activeTab === 'employees'        && <EmployeesTab />}
        {activeTab === 'branches'         && <BranchesTab />}
        {activeTab === 'security'         && <SecurityTab />}
        {activeTab === 'suspicious'       && <SuspiciousTab />}
        {activeTab === 'account-types'    && <AccountTypesTab />}
        {activeTab === 'currencies'       && <CurrenciesTab />}
        {activeTab === 'reports'          && <ReportsTab />}
      </div>
    </div>
  );
}
