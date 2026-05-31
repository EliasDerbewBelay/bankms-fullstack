'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatDate, formatDateTime, getStatusBadge } from '../../../lib/utils';
import {
  Shield, Users, Building2, Landmark, RefreshCw,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
} from 'lucide-react';

const AUDIT_ACTIONS = ['', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'CREATE', 'UPDATE',
  'TRANSACTION', 'LOAN_APPROVAL', 'CARD_BLOCK', 'PASSWORD_CHANGE', 'REFUND_APPROVAL'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'employees' | 'branches' | 'atm'>('audit');
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState('');
  const [suspicious, setSuspicious] = useState(false);

  const tabs = [
    { key: 'audit', label: 'Audit Logs', icon: Shield },
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'branches', label: 'Branches', icon: Building2 },
    { key: 'atm', label: 'ATM Network', icon: Landmark },
  ] as const;

  // Audit logs
  const { data: auditData, isLoading: auditLoading, refetch: refetchAudit, isFetching: auditFetching } = useQuery({
    queryKey: ['audit-logs', page, actionType, suspicious],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        ...(actionType && { action_type: actionType }),
        ...(suspicious && { suspicious: 'true' }),
      });
      const res = await api.get(`/admin/audit-logs?${params}`);
      return res.data;
    },
    enabled: activeTab === 'audit',
  });

  // Employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['admin-employees', page],
    queryFn: async () => {
      const res = await api.get(`/admin/employees?page=${page}&limit=15`);
      return res.data;
    },
    enabled: activeTab === 'employees',
  });

  // Branches
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => { const res = await api.get('/admin/branches'); return res.data.data; },
    enabled: activeTab === 'branches',
  });

  // ATM
  const { data: atmData, isLoading: atmLoading } = useQuery({
    queryKey: ['admin-atm'],
    queryFn: async () => { const res = await api.get('/admin/atm'); return res.data.data; },
    enabled: activeTab === 'atm',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">System management and audit controls</p>
        </div>
        <button
          onClick={() => refetchAudit()}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2
                     text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${auditFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${activeTab === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select value={actionType} onChange={(e) => { setActionType(e.target.value); setPage(1); }}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Actions</option>
              {AUDIT_ACTIONS.filter(Boolean).map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={suspicious} onChange={(e) => { setSuspicious(e.target.checked); setPage(1); }}
                className="rounded border-input" />
              Suspicious only
            </label>
          </div>

          <div className="data-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Action', 'Entity', 'Performed By', 'IP Address', 'Details', 'Timestamp', 'Flag'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                      ))}</tr>
                    ))
                    : (auditData?.data ?? []).map((log: any) => (
                      <tr key={log.log_id}
                        className={`hover:bg-muted/30 transition-colors ${log.is_suspicious ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                        <td className="px-4 py-3">
                          <span className="badge-neutral text-xs">{log.action_type.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          {log.performed_by?.username ?? <span className="text-muted-foreground italic">system</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip_address ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate" title={log.details}>{log.details ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                        <td className="px-4 py-3">
                          {log.is_suspicious
                            ? <span title="Suspicious"><AlertTriangle className="w-4 h-4 text-amber-500" /></span>
                            : <span title="Normal"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {auditData?.meta && auditData.meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Page {auditData.meta.page} of {auditData.meta.totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!auditData.meta.hasPrev}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={!auditData.meta.hasNext}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employees */}
      {activeTab === 'employees' && (
        <div className="data-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Employee', 'Code', 'Position', 'Branch', 'Department', 'Role', 'Last Login', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employeesLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                  : (employeesData?.data ?? []).map((e: any) => (
                    <tr key={e.employee_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{e.first_name} {e.last_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.employee_code}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.position}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.branch?.branch_name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.department?.department_name ?? '—'}</td>
                      <td className="px-4 py-3"><span className="badge-info text-xs">{e.online_user?.role ?? '—'}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{e.online_user?.last_login ? formatDateTime(e.online_user.last_login) : '—'}</td>
                      <td className="px-4 py-3">
                        {e.online_user?.account_locked
                          ? <span className="badge-danger">Locked</span>
                          : <span className="badge-success">Active</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Branches */}
      {activeTab === 'branches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branchesLoading
            ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 h-36 animate-pulse bg-muted" />
            ))
            : (branchesData ?? []).map((b: any) => (
              <div key={b.branch_id} className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{b.branch_name}</h3>
                  <span className={getStatusBadge(b.status)}>{b.status}</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{b.branch_code} · {b.city}</p>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
                  {[
                    { label: 'Staff', value: b._count?.employee ?? 0 },
                    { label: 'Accounts', value: b._count?.account ?? 0 },
                    { label: 'ATMs', value: b._count?.atm ?? 0 },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-lg font-bold font-financial text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ATM Network */}
      {activeTab === 'atm' && (
        <div className="data-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['ATM Code', 'Location', 'Branch', 'Status', 'Cash Balance', 'Threshold', 'Last Refill'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {atmLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                  : (atmData ?? []).map((atm: any) => {
                    const balance = Number(atm.cash_balance);
                    const threshold = Number(atm.low_cash_threshold);
                    const pct = Math.min(100, (balance / (threshold * 4)) * 100);
                    return (
                      <tr key={atm.atm_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground">{atm.atm_code}</td>
                        <td className="px-4 py-3 text-foreground">{atm.location}</td>
                        <td className="px-4 py-3 text-muted-foreground">{atm.branch?.branch_name ?? '—'}</td>
                        <td className="px-4 py-3"><span className={getStatusBadge(atm.status)}>{atm.status.replace(/_/g, ' ')}</span></td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className={`font-financial font-medium text-xs ${balance < threshold ? 'text-amber-600' : 'text-foreground'}`}>
                              {balance.toLocaleString()} ETB
                            </span>
                            <div className="h-1.5 bg-muted rounded-full w-24">
                              <div
                                className={`h-full rounded-full ${balance < threshold ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-financial text-xs text-muted-foreground">
                          {threshold.toLocaleString()} ETB
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {atm.last_refill_date ? formatDate(atm.last_refill_date) : '—'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
