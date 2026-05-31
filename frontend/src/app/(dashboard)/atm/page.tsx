'use client';

import { useState, type ElementType } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { Landmark, RefreshCw, Droplets, Wrench, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';

const statusConfig: Record<string, { label: string; color: string; icon: ElementType }> = {
  ONLINE: { label: 'Online', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: Wifi },
  OFFLINE: { label: 'Offline', color: 'text-gray-600 bg-gray-100 border-gray-200', icon: WifiOff },
  LOW_CASH: { label: 'Low Cash', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: AlertTriangle },
  OUT_OF_CASH: { label: 'Out of Cash', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
  UNDER_MAINTENANCE: { label: 'Maintenance', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Wrench },
};

export default function AtmPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['atm-stats'],
    queryFn: async () => {
      const res = await api.get('/atm/stats');
      return res.data.data;
    },
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['atms'],
    queryFn: async () => {
      const res = await api.get('/atm');
      return res.data.data;
    },
  });

  const refillMutation = useMutation({
    mutationFn: (atmId: number) => api.patch(`/atm/${atmId}/refill`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atms'] });
      queryClient.invalidateQueries({ queryKey: ['atm-stats'] });
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: (atmId: number) => api.patch(`/atm/${atmId}/maintenance`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['atms'] }),
  });

  const atms: any[] = data ?? [];
  const canManage = user?.role === 'BRANCH_MANAGER' || user?.role === 'ADMIN';

  const statCards = [
    { label: 'Total ATMs', value: statsData?.total ?? 0, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Online', value: statsData?.online ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Low Cash', value: statsData?.lowCash ?? 0, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Out of Cash', value: statsData?.outOfCash ?? 0, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Offline', value: statsData?.offline ?? 0, color: 'text-gray-500', bg: 'bg-gray-100' },
    { label: 'Maintenance', value: statsData?.maintenance ?? 0, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">ATM Network</h1>
          <p className="page-subtitle">Monitor and manage all ATM terminals across branches</p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="stat-card text-center py-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ATM Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-muted rounded-xl animate-pulse" />
          ))
        ) : atms.length === 0 ? (
          <div className="col-span-full py-16 text-center border rounded-xl bg-card">
            <Landmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No ATMs found</p>
          </div>
        ) : (
          atms.map((atm: any) => {
            const cfg = statusConfig[atm.status] ?? statusConfig.OFFLINE;
            const StatusIcon = cfg.icon;
            const cashPct = atm.low_cash_threshold > 0
              ? Math.min(100, (Number(atm.cash_balance) / (Number(atm.low_cash_threshold) * 10)) * 100)
              : 100;

            return (
              <div key={atm.atm_id} className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{atm.atm_code}</p>
                    <h3 className="font-semibold text-sm text-foreground mt-0.5">{atm.location}</h3>
                    <p className="text-xs text-muted-foreground">{atm.branch?.branch_name} — {atm.branch?.city}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Cash level bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Cash Balance</span>
                    <span className="font-financial font-medium">{formatCurrency(Number(atm.cash_balance))}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${cashPct < 20 ? 'bg-red-500' : cashPct < 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${cashPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Threshold: {formatCurrency(Number(atm.low_cash_threshold))}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  {atm.last_refill_date && (
                    <p>Last refill: {formatDate(atm.last_refill_date)} by {atm.last_refill_by ? `${atm.last_refill_by.first_name} ${atm.last_refill_by.last_name}` : 'System'}</p>
                  )}
                  <p>Transactions: {atm._count?.atm_transaction ?? 0}</p>
                </div>

                {canManage && (
                  <div className="flex gap-2 pt-1 border-t border-border">
                    <button
                      onClick={() => refillMutation.mutate(atm.atm_id)}
                      disabled={refillMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Droplets className="w-3.5 h-3.5" /> Log Refill
                    </button>
                    {atm.status !== 'UNDER_MAINTENANCE' && (
                      <button
                        onClick={() => maintenanceMutation.mutate(atm.atm_id)}
                        disabled={maintenanceMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" /> Maintenance
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
