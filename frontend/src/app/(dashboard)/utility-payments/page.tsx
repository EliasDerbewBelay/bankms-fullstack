'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../../lib/utils';
import { Zap, Droplets, Phone, Wifi, Receipt, Shield, GraduationCap, FileText, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../../../components/ui/modal';
import { useToast } from '../../../components/ui/toaster';
import { useAuthStore } from '../../../store/auth.store';

const UTILITY_TYPES = ['ELECTRICITY', 'WATER', 'TELECOM', 'INTERNET', 'TAX', 'INSURANCE', 'SCHOOL_FEE', 'OTHER'];

const utilityIcon = (type: string) => {
  const cls = 'w-4 h-4';
  switch (type) {
    case 'ELECTRICITY': return <Zap className={cls} />;
    case 'WATER': return <Droplets className={cls} />;
    case 'TELECOM': return <Phone className={cls} />;
    case 'INTERNET': return <Wifi className={cls} />;
    case 'TAX': return <Receipt className={cls} />;
    case 'INSURANCE': return <Shield className={cls} />;
    case 'SCHOOL_FEE': return <GraduationCap className={cls} />;
    default: return <FileText className={cls} />;
  }
};

const emptyForm = {
  utility_type: 'ELECTRICITY',
  provider_name: '',
  provider_account_number: '',
  subscriber_name: '',
  amount: '',
  account_id: '',
  currency_id: 1,
};

export default function UtilityPaymentsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  const isCustomer = user?.role === 'CUSTOMER';
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);

  const endpoint = isCustomer ? '/utility-payments/my' : '/utility-payments';
  const { data, isLoading } = useQuery({
    queryKey: ['utility-payments', page, statusFilter, typeFilter, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...(statusFilter && { status: statusFilter }), ...(typeFilter && { utility_type: typeFilter }), ...(fromDate && { from_date: fromDate }), ...(toDate && { to_date: toDate }) });
      const r = await api.get(`${endpoint}?${params}`);
      return r.data;
    },
    staleTime: 30_000,
  });

  const { data: accountsData } = useQuery({
    queryKey: ['my-accounts-util'],
    queryFn: async () => { const r = await api.get('/accounts/my'); return r.data.data; },
    enabled: modalOpen,
  });

  const payMutation = useMutation({
    mutationFn: (payload: any) => api.post('/utility-payments', payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['utility-payments'] });
      setModalOpen(false);
      setStep(1);
      setForm(emptyForm);
      toast.success('Payment submitted', `Reference: ${res.data.data?.provider_reference ?? ''}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Payment failed'),
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const selectedAccount = (accountsData ?? []).find((a: any) => String(a.account_id) === String(form.account_id));

  const handleSubmit = () => {
    const selectedAcc = (accountsData ?? []).find((a: any) => String(a.account_id) === String(form.account_id));
    payMutation.mutate({
      account_id: Number(form.account_id),
      customer_id: user?.linkedCustomerId,
      utility_type: form.utility_type,
      provider_name: form.provider_name,
      provider_account_number: form.provider_account_number,
      subscriber_name: form.subscriber_name,
      amount: Number(form.amount),
      currency_id: selectedAcc?.account?.currency_id ?? 1,
    });
  };

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Utility Payments</h1>
          <p className="page-subtitle">{meta ? `${meta.total.toLocaleString()} payments` : 'All utility payments'}</p>
        </div>
        <button onClick={() => { setModalOpen(true); setStep(1); setForm(emptyForm); }} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Pay a Bill
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className={inputClass + ' w-auto'}>
          <option value="">All Types</option>
          {UTILITY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass + ' w-auto'}>
          <option value="">All Statuses</option>
          {['PENDING', 'COMPLETED', 'FAILED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-muted-foreground">From</label>
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className={inputClass} />
          <label className="text-xs text-muted-foreground">To</label>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className={inputClass} />
        </div>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Reference', 'Type', 'Provider', 'Subscriber', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>)
                : items.length === 0
                  ? <tr><td colSpan={7} className="px-4 py-16 text-center"><FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" /><p className="text-muted-foreground text-sm">No payments found</p></td></tr>
                  : items.map((p: any) => (
                    <tr key={p.payment_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{p.reference_number}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2 text-muted-foreground">{utilityIcon(p.utility_type)}<span className="text-xs">{p.utility_type.replace(/_/g, ' ')}</span></div></td>
                      <td className="px-4 py-3 text-foreground text-xs">{p.provider_name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.subscriber_name ?? '—'}</td>
                      <td className="px-4 py-3 font-financial font-semibold whitespace-nowrap">{formatCurrency(Number(p.amount))}</td>
                      <td className="px-4 py-3"><span className={getStatusBadge(p.status)}>{p.status}</span></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(p.payment_date)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages} — {meta.total.toLocaleString()} total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPrev} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors"><ChevronLeft className="w-3.5 h-3.5" /> Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors">Next <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Pay a Bill Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setStep(1); }} title="Pay a Bill" description={step === 1 ? 'Step 1 of 2 — Bill Details' : 'Step 2 of 2 — Review & Confirm'} size="md">
        {step === 1 ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Utility Type <span className="text-red-500">*</span></label>
              <select value={form.utility_type} onChange={e => setForm(p => ({ ...p, utility_type: e.target.value }))} className={inputClass}>
                {UTILITY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            {[['provider_name', 'Provider Name'], ['provider_account_number', 'Provider Account / Meter Number'], ['subscriber_name', 'Subscriber Name'], ['amount', 'Amount']].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-medium text-foreground block mb-1">{label} <span className="text-red-500">*</span></label>
                <input type={key === 'amount' ? 'number' : 'text'} className={inputClass} value={form[key as keyof typeof emptyForm]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={label} min="0" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Source Account <span className="text-red-500">*</span></label>
              <select value={form.account_id} onChange={e => setForm(p => ({ ...p, account_id: e.target.value }))} className={inputClass}>
                <option value="">Select account…</option>
                {(accountsData ?? []).map((a: any) => (
                  <option key={a.account_id} value={a.account_id}>{a.account?.account_number} — {formatCurrency(Number(a.account?.available_balance))}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={() => setStep(2)} disabled={!form.provider_name || !form.provider_account_number || !form.amount || !form.account_id}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                Review
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
              {[['Type', form.utility_type.replace(/_/g, ' ')], ['Provider', form.provider_name], ['Account/Meter', form.provider_account_number], ['Subscriber', form.subscriber_name || '—'], ['Amount', formatCurrency(Number(form.amount))], ['From Account', selectedAccount?.account?.account_number ?? form.account_id]].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{val}</span>
                </div>
              ))}
            </div>
            {selectedAccount && Number(form.amount) > Number(selectedAccount?.account?.available_balance) && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                ⚠ Insufficient balance. Available: {formatCurrency(Number(selectedAccount?.account?.available_balance))}
              </div>
            )}
            <div className="flex justify-between gap-3 pt-1">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors">← Back</button>
              <button onClick={handleSubmit} disabled={payMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                {payMutation.isPending ? 'Processing…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
