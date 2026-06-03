'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../../lib/utils';
import { Landmark, RefreshCw, Droplets, Wrench, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/modal';
import { useToast } from '../../../components/ui/toaster';
import { useAuthStore } from '../../../store/auth.store';

export default function AtmPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  const isManagerPlus = ['BRANCH_MANAGER', 'ADMIN'].includes(user?.role ?? '');
  const isAdmin = user?.role === 'ADMIN';

  const [refillTarget, setRefillTarget] = useState<any>(null);
  const [statusTarget, setStatusTarget] = useState<any>(null);
  const [refillAmount, setRefillAmount] = useState('');
  const [newStatus, setNewStatus] = useState('ONLINE');

  const { data: statsData } = useQuery({
    queryKey: ['atm-stats'],
    queryFn: async () => { const r = await api.get('/atm'); const d = r.data.data as any[]; return { total: d.length, online: d.filter(a => a.status === 'ONLINE').length, lowCash: d.filter(a => a.status === 'LOW_CASH').length, offline: d.filter(a => a.status === 'OFFLINE').length, outOfCash: d.filter(a => a.status === 'OUT_OF_CASH').length }; },
    refetchInterval: 60_000,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['atms'],
    queryFn: async () => { const r = await api.get('/atm'); return r.data.data; },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const refillMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => api.patch(`/atm/${id}/refill`, { amount }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['atms'] }); qc.invalidateQueries({ queryKey: ['atm-stats'] }); setRefillTarget(null); setRefillAmount(''); toast.success('ATM refilled successfully'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Refill failed'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/atm/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['atms'] }); qc.invalidateQueries({ queryKey: ['atm-stats'] }); setStatusTarget(null); toast.success('ATM status updated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Status update failed'),
  });

  const atms: any[] = data ?? [];
  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  const stats = [
    { label: 'Total ATMs', value: statsData?.total ?? 0, color: 'text-foreground', bg: 'bg-muted' },
    { label: 'Online', value: statsData?.online ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Low Cash', value: statsData?.lowCash ?? 0, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Out of Cash', value: statsData?.outOfCash ?? 0, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Offline', value: statsData?.offline ?? 0, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">ATM Network</h1>
          <p className="page-subtitle">{statsData?.online ?? 0} online of {statsData?.total ?? 0} total ATMs</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold font-financial ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="data-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['ATM Code', 'Location', 'Branch', 'Status', 'Cash Balance', 'Threshold', 'Last Refill', ...(isManagerPlus ? ['Actions'] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <tr key={i}>{Array.from({ length: isManagerPlus ? 8 : 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>)
                : atms.length === 0
                  ? <tr><td colSpan={isManagerPlus ? 8 : 7} className="px-4 py-16 text-center"><Landmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" /><p className="text-muted-foreground text-sm">No ATMs found</p></td></tr>
                  : atms.map((atm: any) => {
                    const balance = Number(atm.cash_balance);
                    const threshold = Number(atm.low_cash_threshold);
                    const pct = Math.min(100, (balance / Math.max(threshold * 4, 1)) * 100);
                    const barColor = balance === 0 ? 'bg-red-500' : balance <= threshold ? 'bg-amber-400' : 'bg-emerald-500';
                    return (
                      <tr key={atm.atm_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground">{atm.atm_code}</td>
                        <td className="px-4 py-3 text-foreground text-sm">{atm.location}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{atm.branch?.branch_name ?? '—'}</td>
                        <td className="px-4 py-3"><span className={getStatusBadge(atm.status)}>{atm.status.replace(/_/g, ' ')}</span></td>
                        <td className="px-4 py-3">
                          <div className="space-y-1 min-w-[120px]">
                            <span className={`font-financial font-medium text-xs tabular-nums ${balance <= threshold ? 'text-amber-600' : 'text-foreground'}`}>{formatCurrency(balance)}</span>
                            <div className="h-1.5 bg-muted rounded-full w-24"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} /></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-financial text-xs text-muted-foreground tabular-nums">{formatCurrency(threshold)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{atm.last_refill_date ? formatDate(atm.last_refill_date) : '—'}</td>
                        {isManagerPlus && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setRefillTarget(atm); setRefillAmount(''); }} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors whitespace-nowrap">
                                <Droplets className="w-3.5 h-3.5" /> Refill
                              </button>
                              {isAdmin && (
                                <button onClick={() => { setStatusTarget(atm); setNewStatus(atm.status); }} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap">
                                  <Wrench className="w-3.5 h-3.5" /> Status
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refill Modal */}
      <Modal open={!!refillTarget} onClose={() => { setRefillTarget(null); setRefillAmount(''); }} title="Refill ATM" description={refillTarget ? `${refillTarget.atm_code} — ${refillTarget.location}` : ''} size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="font-financial font-semibold text-foreground tabular-nums">{refillTarget ? formatCurrency(Number(refillTarget.cash_balance)) : '—'}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <p className="text-xs text-muted-foreground">After Refill</p>
              <p className="font-financial font-semibold text-emerald-600 tabular-nums">{refillTarget && refillAmount ? formatCurrency(Number(refillTarget.cash_balance) + Number(refillAmount)) : '—'}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Refill Amount (Br) <span className="text-red-500">*</span></label>
            <input type="number" min="1" className={inputClass} value={refillAmount} onChange={e => setRefillAmount(e.target.value)} placeholder="e.g. 500000" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setRefillTarget(null); setRefillAmount(''); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={() => refillMutation.mutate({ id: refillTarget.atm_id, amount: Number(refillAmount) })} disabled={!refillAmount || Number(refillAmount) <= 0 || refillMutation.isPending}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {refillMutation.isPending ? 'Refilling...' : 'Confirm Refill'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Set Status Modal (Admin) */}
      <Modal open={!!statusTarget} onClose={() => setStatusTarget(null)} title="Update ATM Status" description={statusTarget ? `${statusTarget.atm_code} — ${statusTarget.location}` : ''} size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">New Status</label>
            <select className={inputClass} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {['ONLINE', 'OFFLINE', 'UNDER_MAINTENANCE'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setStatusTarget(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={() => statusMutation.mutate({ id: statusTarget.atm_id, status: newStatus })} disabled={statusMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {statusMutation.isPending ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
