'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { ArrowLeftRight, FileText, Users, Landmark, Download, BarChart3, ShieldAlert } from 'lucide-react';
import { useToast } from '../../../components/ui/toaster';
import { useAuthStore } from '../../../store/auth.store';

interface ReportConfig {
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  endpoint: string;
}

const REPORTS: ReportConfig[] = [
  { key: 'transactions', title: 'Transaction Summary', description: 'Daily transaction counts, volumes, and channel breakdown.', icon: ArrowLeftRight, endpoint: '/reports/transactions' },
  { key: 'loans', title: 'Loan Portfolio Aging', description: 'Loan status breakdown, NPL ratio, and overdue installments.', icon: FileText, endpoint: '/reports/loans' },
  { key: 'customers', title: 'Customer KYC Status', description: 'KYC verification rates, pending reviews, and risk profiles.', icon: Users, endpoint: '/reports/customers' },
  { key: 'atm', title: 'ATM Performance', description: 'Cash levels, refill history, and uptime per ATM.', icon: Landmark, endpoint: '/reports/atm' },
];

export default function ReportsPage() {
  const { user } = useAuthStore();
  const toast = useToast();
  const isManagerPlus = ['BRANCH_MANAGER', 'ADMIN'].includes(user?.role ?? '');

  if (!isManagerPlus) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldAlert className="w-12 h-12 text-red-400" />
        <p className="text-lg font-semibold text-foreground">Access Denied</p>
        <p className="text-muted-foreground text-sm">Reports are available to Branch Managers and above.</p>
      </div>
    );
  }

  const { data: branches } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => { const r = await api.get('/admin/branches'); return r.data.data; },
  });

  // Per-report state
  const [states, setStates] = useState<Record<string, { fromDate: string; toDate: string; branchId: string; loading: string | null }>>(() =>
    Object.fromEntries(REPORTS.map(r => [r.key, { fromDate: '', toDate: '', branchId: '', loading: null }]))
  );

  const updateState = (key: string, field: string, value: string) => {
    setStates(p => ({ ...p, [key]: { ...p[key], [field]: value } }));
  };

  const downloadReport = async (report: ReportConfig, format: 'pdf' | 'xlsx') => {
    updateState(report.key, 'loading', format);
    const s = states[report.key];
    try {
      const response = await api.get(report.endpoint, {
        params: { format, ...(s.fromDate && { from_date: s.fromDate }), ...(s.toDate && { to_date: s.toDate }), ...(s.branchId && { branch_id: s.branchId }) },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.key}-report.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded', `${report.title}.${format}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? `Failed to download ${format.toUpperCase()}`);
    } finally {
      updateState(report.key, 'loading', '');
    }
  };

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports &amp; Exports</h1>
          <p className="page-subtitle">Generate and download financial reports</p>
        </div>
        <BarChart3 className="w-6 h-6 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {REPORTS.map(report => {
          const s = states[report.key];
          const isLoading = !!s.loading;
          return (
            <div key={report.key} className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <report.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{report.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">From Date</label>
                  <input type="date" className={inputClass} value={s.fromDate} onChange={e => updateState(report.key, 'fromDate', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">To Date</label>
                  <input type="date" className={inputClass} value={s.toDate} onChange={e => updateState(report.key, 'toDate', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Branch</label>
                <select className={inputClass} value={s.branchId} onChange={e => updateState(report.key, 'branchId', e.target.value)}>
                  <option value="">All Branches</option>
                  {(branches ?? []).map((b: any) => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
                </select>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-3">
                {(['pdf', 'xlsx'] as const).map(fmt => (
                  <button key={fmt} onClick={() => downloadReport(report, fmt)} disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50">
                    {s.loading === fmt ? (
                      <><Download className="w-4 h-4 animate-bounce" /> Downloading…</>
                    ) : (
                      <><Download className="w-4 h-4" /> Export {fmt.toUpperCase()}</>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
