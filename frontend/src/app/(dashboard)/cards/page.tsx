'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge, cn } from '../../../lib/utils';
import { CreditCard, Plus, ShieldOff, Settings2, Snowflake } from 'lucide-react';
import { Modal } from '../../../components/ui/modal';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useToast } from '../../../components/ui/toaster';
import { useAuthStore } from '../../../store/auth.store';

const networkColors: Record<string, string> = {
  VISA: 'from-blue-900 to-blue-700',
  MASTERCARD: 'from-red-900 to-orange-700',
  AMEX: 'from-teal-900 to-teal-700',
  UNIONPAY: 'from-red-800 to-red-600',
  LOCAL: 'from-slate-800 to-slate-600',
};

export default function CardsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  const isCustomer = user?.role === 'CUSTOMER';
  const isTellerPlus = ['TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'].includes(user?.role ?? '');
  const isSupervisorPlus = ['SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'].includes(user?.role ?? '');

  // Modals state
  const [issueOpen, setIssueOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<any>(null);
  const [limitsTarget, setLimitsTarget] = useState<any>(null);
  const [freezeTarget, setFreezeTarget] = useState<any>(null);
  const [blockReason, setBlockReason] = useState('');
  const [limitsForm, setLimitsForm] = useState({ daily_limit: '', monthly_limit: '' });
  const [issueForm, setIssueForm] = useState({ account_id: '', card_type: 'DEBIT', card_network: 'VISA' });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cards', isCustomer, statusFilter, typeFilter],
    queryFn: async () => {
      if (isCustomer) {
        const r = await api.get('/cards/my'); return r.data.data;
      }
      const params = new URLSearchParams({ ...(statusFilter && { status: statusFilter }), ...(typeFilter && { card_type: typeFilter }) });
      const r = await api.get(`/cards?${params}`); return r.data.data;
    },
    staleTime: 30_000,
  });

  const issueMutation = useMutation({
    mutationFn: (p: any) => api.post('/cards', p),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['cards'] }); setIssueOpen(false); setIssueForm({ account_id: '', card_type: 'DEBIT', card_network: 'VISA' }); toast.success('Card issued', res.data.data?.masked_number); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to issue card'),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.patch(`/cards/${id}/block`, { block_reason: reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cards'] }); setBlockTarget(null); setBlockReason(''); toast.success('Card blocked'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to block card'),
  });

  const limitsMutation = useMutation({
    mutationFn: ({ id, daily_limit, monthly_limit }: { id: number; daily_limit: number; monthly_limit: number }) => api.patch(`/cards/${id}/limits`, { daily_limit, monthly_limit }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cards'] }); setLimitsTarget(null); toast.success('Card limits updated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update limits'),
  });

  const freezeMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/cards/${id}/freeze`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cards'] }); setFreezeTarget(null); toast.success('Card frozen successfully'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to freeze card'),
  });

  const cards = data ?? [];
  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cards</h1>
          <p className="page-subtitle">{cards.length} card{cards.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
            <CreditCard className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {isTellerPlus && (
            <button onClick={() => setIssueOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Issue Card
            </button>
          )}
        </div>
      </div>

      {/* Filters (staff only) */}
      {!isCustomer && (
        <div className="flex flex-wrap items-center gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputClass + ' w-auto'}>
            <option value="">All Statuses</option>
            {['ACTIVE', 'FROZEN', 'BLOCKED', 'EXPIRED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={inputClass + ' w-auto'}>
            <option value="">All Types</option>
            {['DEBIT', 'CREDIT', 'PREPAID'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-56 bg-muted rounded-2xl animate-pulse" />)
          : cards.length === 0
            ? <div className="col-span-full py-20 text-center border rounded-xl bg-card"><CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No cards found</p></div>
            : cards.map((card: any) => {
              const gradientClass = networkColors[card.card_network] ?? 'from-slate-800 to-slate-600';
              const last4 = card.masked_number?.slice(-4);
              const expiryFormatted = card.expiry_date ? new Date(card.expiry_date).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }) : '??/??';
              return (
                <div key={card.card_id} className="rounded-2xl shadow-lg overflow-hidden">
                  {/* Visual card face */}
                  <div className={cn('bg-gradient-to-br p-5 space-y-6 relative overflow-hidden', gradientClass)}>
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-8 -mb-8" />
                    <div className="relative flex items-center justify-between">
                      <span className="text-white/70 text-sm font-bold tracking-widest">{card.card_network}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-white/20 text-white font-medium">{card.card_type}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded font-medium', card.status === 'ACTIVE' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-red-500/30 text-red-200')}>{card.status}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="font-mono text-white text-xl tracking-[0.3em]">**** **** **** {last4}</p>
                    </div>
                    <div className="relative flex items-center justify-between text-white/70">
                      <div><p className="text-[10px] uppercase">Expires</p><p className="font-mono text-sm text-white">{expiryFormatted}</p></div>
                      <div className="text-right"><p className="text-[10px] uppercase">Account</p><p className="font-mono text-xs text-white">{card.account?.account_number?.slice(-8)}</p></div>
                    </div>
                  </div>

                  {/* Card info & actions */}
                  <div className="border border-t-0 rounded-b-2xl bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Daily Limit</span>
                      <span className="font-financial font-medium text-foreground tabular-nums">{formatCurrency(Number(card.daily_limit))}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Monthly Limit</span>
                      <span className="font-financial font-medium text-foreground tabular-nums">{formatCurrency(Number(card.monthly_limit))}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
                      {/* Customer freeze */}
                      {isCustomer && card.status === 'ACTIVE' && (
                        <button onClick={() => setFreezeTarget(card)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors">
                          <Snowflake className="w-3.5 h-3.5" /> Freeze
                        </button>
                      )}
                      {/* Supervisor+ block & limits */}
                      {isSupervisorPlus && card.status === 'ACTIVE' && (
                        <>
                          <button onClick={() => setBlockTarget(card)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
                            <ShieldOff className="w-3.5 h-3.5" /> Block
                          </button>
                          <button onClick={() => { setLimitsTarget(card); setLimitsForm({ daily_limit: String(card.daily_limit ?? ''), monthly_limit: String(card.monthly_limit ?? '') }); }} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Settings2 className="w-3.5 h-3.5" /> Limits
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Issue Card Modal */}
      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} title="Issue New Card" size="sm">
        <div className="space-y-3">
          {[['account_id', 'Account Number', 'text'], ['card_type', null, null], ['card_network', null, null]].map(([key]) => (
            <div key={key as string}>
              <label className="text-xs font-medium text-foreground block mb-1">
                {key === 'account_id' ? 'Account ID' : key === 'card_type' ? 'Card Type' : 'Card Network'}
              </label>
              {key === 'account_id' ? (
                <input className={inputClass} value={issueForm.account_id} onChange={e => setIssueForm(p => ({ ...p, account_id: e.target.value }))} placeholder="Account ID" />
              ) : key === 'card_type' ? (
                <select className={inputClass} value={issueForm.card_type} onChange={e => setIssueForm(p => ({ ...p, card_type: e.target.value }))}>
                  {['DEBIT', 'CREDIT', 'PREPAID'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <select className={inputClass} value={issueForm.card_network} onChange={e => setIssueForm(p => ({ ...p, card_network: e.target.value }))}>
                  {['VISA', 'MASTERCARD', 'AMEX', 'UNIONPAY', 'LOCAL'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIssueOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={() => issueMutation.mutate({ account_id: Number(issueForm.account_id), card_type: issueForm.card_type, card_network: issueForm.card_network })}
              disabled={issueMutation.isPending || !issueForm.account_id}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {issueMutation.isPending ? 'Issuing...' : 'Issue Card'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Block Card Modal */}
      <Modal open={!!blockTarget} onClose={() => { setBlockTarget(null); setBlockReason(''); }} title="Block Card" description="This will immediately block all transactions on this card." size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Block Reason <span className="text-red-500">*</span></label>
            <textarea value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="e.g. Lost card, Suspicious activity…" className={inputClass + ' min-h-[80px] resize-none'} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => { setBlockTarget(null); setBlockReason(''); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={() => blockMutation.mutate({ id: blockTarget.card_id, reason: blockReason })} disabled={blockReason.length < 5 || blockMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              {blockMutation.isPending ? 'Blocking...' : 'Block Card'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Update Limits Modal */}
      <Modal open={!!limitsTarget} onClose={() => setLimitsTarget(null)} title="Update Card Limits" size="sm">
        <div className="space-y-3">
          {[['daily_limit', 'Daily Limit (Br)'], ['monthly_limit', 'Monthly Limit (Br)']].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-medium text-foreground block mb-1">{label}</label>
              <input type="number" min="0" className={inputClass} value={limitsForm[key as keyof typeof limitsForm]} onChange={e => setLimitsForm(p => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
          {Number(limitsForm.monthly_limit) < Number(limitsForm.daily_limit) && (
            <p className="text-xs text-red-500">Monthly limit must be ≥ daily limit</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setLimitsTarget(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={() => limitsMutation.mutate({ id: limitsTarget.card_id, daily_limit: Number(limitsForm.daily_limit), monthly_limit: Number(limitsForm.monthly_limit) })}
              disabled={limitsMutation.isPending || Number(limitsForm.monthly_limit) < Number(limitsForm.daily_limit)}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {limitsMutation.isPending ? 'Updating...' : 'Update Limits'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Freeze Confirm Dialog */}
      <ConfirmDialog open={!!freezeTarget} onClose={() => setFreezeTarget(null)} onConfirm={() => freezeTarget && freezeMutation.mutate(freezeTarget.card_id)}
        title="Freeze Card" message="Are you sure you want to freeze this card? All transactions will be blocked until you unfreeze it."
        confirmLabel="Freeze Card" variant="danger" loading={freezeMutation.isPending} />
    </div>
  );
}
