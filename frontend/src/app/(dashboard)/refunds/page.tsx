'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDateTime, getStatusBadge, truncate } from '../../../lib/utils';
import { RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Plus, RotateCcw, ShieldAlert } from 'lucide-react';
import { Modal } from '../../../components/ui/modal';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useToast } from '../../../components/ui/toaster';
import { useAuthStore } from '../../../store/auth.store';
import { useRouter } from 'next/navigation';

const TABS = ['ALL', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSED', 'REJECTED'] as const;

export default function RefundsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();

  const isSupervisorPlus = ['SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'].includes(user?.role ?? '');
  const isTellerPlus = ['TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'].includes(user?.role ?? '');
  const isCustomer = user?.role === 'CUSTOMER';

  const [tab, setTab] = useState<typeof TABS[number]>('ALL');
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ original_transaction_id: '', account_id: '', amount: '', reason: '' });

  const endpoint = isCustomer ? '/refunds/my' : '/refunds';

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['refunds', tab, page, isCustomer],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...(tab !== 'ALL' && { status: tab }) });
      const r = await api.get(`${endpoint}?${params}`);
      return r.data;
    },
    staleTime: 30_000,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ['refunds-pending-count'],
    queryFn: async () => { const r = await api.get('/refunds?status=PENDING_APPROVAL&limit=1'); return r.data.meta?.total ?? 0; },
    refetchInterval: 60_000,
    enabled: !isCustomer,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/refunds/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['refunds'] }); setApproveTarget(null); toast.success('Refund approved successfully'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.patch(`/refunds/${id}/reject`, { rejection_reason: reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['refunds'] }); setRejectTarget(null); setRejectReason(''); toast.warning('Refund rejected'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Rejection failed'),
  });

  const requestMutation = useMutation({
    mutationFn: (payload: any) => api.post('/refunds', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['refunds'] }); setRequestOpen(false); setRequestForm({ original_transaction_id: '', account_id: '', amount: '', reason: '' }); toast.info('Refund request submitted for approval'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Request failed'),
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="page-title">Refund Requests</h1>
            <p className="page-subtitle">{meta ? `${meta.total.toLocaleString()} total` : 'Manage refund requests'}</p>
          </div>
          {(pendingCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              {pendingCount} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {isTellerPlus && !isCustomer && (
            <button onClick={() => setRequestOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Request Refund
            </button>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="data-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Refund ID', 'Transaction Ref', 'Account', 'Amount', 'Reason', ...(!isCustomer ? ['Requested By'] : []), 'Status', 'Requested At', ...(!isCustomer && isSupervisorPlus ? ['Actions'] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => <tr key={i}>{Array.from({ length: isCustomer ? 7 : (isSupervisorPlus ? 9 : 8) }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>)
                : items.length === 0
                  ? <tr><td colSpan={isCustomer ? 7 : (isSupervisorPlus ? 9 : 8)} className="px-4 py-16 text-center"><RotateCcw className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" /><p className="text-muted-foreground text-sm">No refunds found</p></td></tr>
                  : items.map((r: any) => {
                    const isSelfRequested = r.requested_by_id === user?.linkedEmployeeId;
                    const colCount = isCustomer ? 7 : (isSupervisorPlus ? 9 : 8);
                    return (
                      <tr key={r.refund_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground">#{r.refund_id}</td>
                        <td className="px-4 py-3 font-mono text-xs text-primary">{r.original_transaction?.reference_number ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.account?.account_number ?? '—'}</td>
                        <td className="px-4 py-3 font-financial font-semibold whitespace-nowrap tabular-nums">{formatCurrency(Number(r.amount))}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px]" title={r.reason}>{truncate(r.reason ?? '', 40)}</td>
                        {!isCustomer && <td className="px-4 py-3 text-xs text-foreground">{r.requested_by ? `${r.requested_by.first_name} ${r.requested_by.last_name}` : '—'}</td>}
                        <td className="px-4 py-3"><span className={getStatusBadge(r.status)}>{r.status.replace(/_/g, ' ')}</span></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(r.requested_at)}</td>
                        {!isCustomer && isSupervisorPlus && (
                          <td className="px-4 py-3">
                            {r.status === 'PENDING_APPROVAL' && (
                              <div className="flex items-center gap-1">
                                <div title={isSelfRequested ? 'You cannot approve a refund you requested' : undefined}>
                                  <button onClick={() => !isSelfRequested && setApproveTarget(r)} disabled={isSelfRequested}
                                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                  </button>
                                </div>
                                <div title={isSelfRequested ? 'You cannot reject a refund you requested' : undefined}>
                                  <button onClick={() => !isSelfRequested && setRejectTarget(r)} disabled={isSelfRequested}
                                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap">
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPrev} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors"><ChevronLeft className="w-3.5 h-3.5" /> Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors">Next <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Approve Confirm */}
      <ConfirmDialog open={!!approveTarget} onClose={() => setApproveTarget(null)} onConfirm={() => approveTarget && approveMutation.mutate(approveTarget.refund_id)}
        title="Approve Refund" message={approveTarget ? `Approve refund of ${formatCurrency(Number(approveTarget.amount))} to account ${approveTarget.account?.account_number ?? ''}?` : ''}
        confirmLabel="Approve" loading={approveMutation.isPending} />

      {/* Reject Modal */}
      <Modal open={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason(''); }} title="Reject Refund" size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Rejection Reason <span className="text-red-500">*</span></label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Please provide the reason for rejection…" className={'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-none'} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={() => rejectMutation.mutate({ id: rejectTarget.refund_id, reason: rejectReason })} disabled={rejectReason.length < 5 || rejectMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Refund'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Request Refund Modal */}
      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request Refund" description="This will create a refund request pending supervisor approval." size="md">
        <div className="space-y-3">
          {([['original_transaction_id', 'Original Transaction ID', 'text'], ['account_id', 'Credit to Account ID', 'text'], ['amount', 'Refund Amount', 'number'], ['reason', 'Reason', 'textarea']] as const).map(([key, label, type]) => (
            <div key={key}>
              <label className="text-xs font-medium text-foreground block mb-1">{label} <span className="text-red-500">*</span></label>
              {type === 'textarea'
                ? <textarea className={'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none'} value={requestForm[key as keyof typeof requestForm]} onChange={e => setRequestForm(p => ({ ...p, [key]: e.target.value }))} placeholder={label} />
                : <input type={type} className={inputClass} value={requestForm[key as keyof typeof requestForm]} onChange={e => setRequestForm(p => ({ ...p, [key]: e.target.value }))} placeholder={label} />}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setRequestOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={() => requestMutation.mutate({ original_transaction_id: Number(requestForm.original_transaction_id), account_id: Number(requestForm.account_id), amount: Number(requestForm.amount), reason: requestForm.reason })}
              disabled={requestMutation.isPending || !requestForm.original_transaction_id || !requestForm.account_id || !requestForm.amount || !requestForm.reason}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
