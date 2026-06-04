'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { useAuthStore } from '../../../store/auth.store';
import { useToast } from '../../../components/ui/toaster';
import {
  Shield, UserCheck, FileText, RotateCcw, Lock, TrendingDown,
  Briefcase, Search, CheckCircle2, XCircle, Clock, AlertTriangle,
  RefreshCw, ChevronRight, BarChart3, Ban, Snowflake, Unlock,
  Users, CreditCard, Eye, AlertCircle, Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab =
  | 'overview'
  | 'kyc'
  | 'loans'
  | 'refunds'
  | 'accounts'
  | 'cards'
  | 'override';

const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'overview',  label: 'Overview',           icon: BarChart3 },
  { id: 'kyc',       label: 'KYC Queue',          icon: UserCheck },
  { id: 'loans',     label: 'Loan Review',        icon: FileText },
  { id: 'refunds',   label: 'Refund Approval',    icon: RotateCcw },
  { id: 'accounts',  label: 'Account Control',    icon: Lock },
  { id: 'cards',     label: 'Card Blocking',      icon: CreditCard },
  { id: 'override',  label: 'Withdrawal Override', icon: TrendingDown },
];

// ─── Helper components ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:         'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    UNDER_REVIEW:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    VERIFIED:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    REJECTED:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    EXPIRED:         'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    PENDING_APPROVAL:'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    APPROVED:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    SUBMITTED:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ACTIVE:          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    FROZEN:          'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    BLOCKED:         'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    COMPLETED:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    INACTIVE:        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card shadow-sm ${className}`}>{children}</div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-6 py-4 border-b">
      <h2 className="font-semibold text-base text-card-foreground">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ActionBtn({
  onClick, loading, variant = 'primary', children, disabled,
}: {
  onClick: () => void;
  loading?: boolean;
  variant?: 'primary' | 'success' | 'danger' | 'secondary';
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50';
  const variants = {
    primary:   'bg-blue-600 text-white hover:bg-blue-700',
    success:   'bg-emerald-600 text-white hover:bg-emerald-700',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-muted text-muted-foreground hover:bg-muted/80',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]}`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      {children}
    </button>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { user } = useAuthStore();
  const employeeId = user?.linkedEmployeeId ?? 0;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['supervisor-overview', employeeId],
    queryFn: () => api.get('/supervisor/overview').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const queues = data?.queues ?? {};
  const kpiCards = [
    { label: 'Pending KYC',       value: queues.pendingKyc       ?? 0, tab: 'kyc'       as Tab, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10', icon: UserCheck },
    { label: 'Loan Applications', value: queues.pendingLoanApps  ?? 0, tab: 'loans'     as Tab, color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-900/10',  icon: FileText },
    { label: 'Refund Approvals',  value: queues.pendingRefunds   ?? 0, tab: 'refunds'   as Tab, color: 'text-violet-600',bg: 'bg-violet-50 dark:bg-violet-900/10',icon: RotateCcw },
    { label: 'Frozen Today',      value: queues.frozenToday      ?? 0, tab: 'accounts'  as Tab, color: 'text-sky-600',   bg: 'bg-sky-50 dark:bg-sky-900/10',    icon: Snowflake },
    { label: 'Cards Blocked Today',value: queues.blockedCardsToday ?? 0,tab: 'cards'   as Tab, color: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-900/10',    icon: Ban },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map(({ label, value, tab, color, bg, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className={`${bg} rounded-xl p-4 text-left border border-transparent hover:border-current/20 transition-colors group`}
          >
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1 group-hover:underline">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Loan Applications */}
        <Card>
          <SectionTitle title="Pending Loan Applications" subtitle="Most urgent first — oldest submission" />
          <div className="divide-y">
            {(data?.pendingLoanAppsList ?? []).length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground text-center">No pending applications</p>
            ) : (
              (data?.pendingLoanAppsList ?? []).map((app: any) => (
                <div key={app.application_id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {app.customer?.first_name} {app.customer?.last_name || app.customer?.company_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.loan_type.replace(/_/g, ' ')} · {formatCurrency(app.requested_amount)} · {app.requested_term_months}mo
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} />
                    <button onClick={() => onNavigate('loans')} className="text-blue-600 hover:text-blue-700">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Pending Refunds */}
        <Card>
          <SectionTitle title="Refunds Awaiting Approval" subtitle="Four-eyes principle — cannot approve own requests" />
          <div className="divide-y">
            {(data?.pendingRefundsList ?? []).length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground text-center">No pending refunds</p>
            ) : (
              (data?.pendingRefundsList ?? []).map((r: any) => (
                <div key={r.refund_id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {r.account?.account_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(r.amount)} · ref: {r.original_transaction?.reference_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested by: {r.requested_by?.first_name} {r.requested_by?.last_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <button onClick={() => onNavigate('refunds')} className="text-blue-600 hover:text-blue-700">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Role permissions reminder */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-teal-400" />
            <h3 className="font-semibold text-white">Supervisor Permissions</h3>
            <span className="ml-auto bg-teal-500/20 text-teal-300 text-xs px-2 py-0.5 rounded-full">Level 2 — Mid Office</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: UserCheck, text: 'KYC Updates', sub: 'PENDING → VERIFIED / REJECTED / EXPIRED' },
              { icon: Lock, text: 'Account Control', sub: 'Freeze & unfreeze with audit trail' },
              { icon: FileText, text: 'Loan Review', sub: 'Approve / reject up to $50,000' },
              { icon: RotateCcw, text: 'Refund Approval', sub: 'Cannot approve own-initiated refunds' },
              { icon: Ban, text: 'Card Blocking', sub: 'Document reason in card record' },
              { icon: TrendingDown, text: 'Withdrawal Override', sub: 'Override minimum-balance restrictions' },
              { icon: Briefcase, text: 'All Teller Functions', sub: 'Deposits, withdrawals, account opening' },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-white">{text}</p>
                  <p className="text-[10px] text-slate-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Cannot Do</p>
            <div className="flex flex-wrap gap-2">
              {['Disburse loans', 'Create / modify employees', 'View audit logs', 'Change exchange rates', 'System configuration', 'Admin dashboard'].map(c => (
                <span key={c} className="flex items-center gap-1 text-[10px] text-slate-400">
                  <XCircle className="w-3 h-3 text-red-400" />{c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── KYC Queue Tab ───────────────────────────────────────────────────────────
function KycQueueTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['kyc-queue', search],
    queryFn: () =>
      api.get(`/customers?kyc_status=PENDING,UNDER_REVIEW&search=${search}&limit=50`).then(r => r.data.data),
  });

  const updateKyc = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) =>
      api.patch(`/customers/${id}/kyc`, { kyc_status: status, notes: note }),
    onSuccess: () => {
      toast('KYC status updated successfully', 'success');
      qc.invalidateQueries({ queryKey: ['kyc-queue'] });
      setSelectedId(null);
      setNewStatus('');
      setRejectionNote('');
    },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed to update KYC', 'error'),
  });

  const customers: any[] = data?.customers ?? [];
  const TRANSITIONS = [
    { value: 'UNDER_REVIEW', label: 'Move to Under Review' },
    { value: 'VERIFIED',     label: 'Verify (Approve)' },
    { value: 'REJECTED',     label: 'Reject' },
    { value: 'EXPIRED',      label: 'Mark Expired' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle title="KYC Review Queue" subtitle="PENDING → UNDER_REVIEW → VERIFIED / REJECTED / EXPIRED" />
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or ID…"
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="font-medium">KYC queue is clear</p>
            <p className="text-xs">No customers are awaiting review</p>
          </div>
        ) : (
          <div className="divide-y">
            {customers.map((c: any) => (
              <div key={c.customer_id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-card-foreground">
                        {c.first_name} {c.last_name || c.company_name}
                      </p>
                      <StatusBadge status={c.kyc_status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ID: {c.customer_id} · {c.customer_type} · {c.email ?? 'No email'}
                    </p>
                    {c.date_of_birth && (
                      <p className="text-xs text-muted-foreground">DOB: {formatDate(c.date_of_birth)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedId(selectedId === c.customer_id ? null : c.customer_id)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {selectedId === c.customer_id ? 'Collapse' : 'Review'}
                  </button>
                </div>

                {selectedId === c.customer_id && (
                  <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-3">
                    <p className="text-xs font-semibold text-card-foreground uppercase tracking-wider">Update KYC Status</p>
                    <div className="flex flex-wrap gap-2">
                      {TRANSITIONS.map(t => (
                        <button
                          key={t.value}
                          onClick={() => setNewStatus(t.value)}
                          className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                            newStatus === t.value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-background border-border hover:bg-muted'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    {(newStatus === 'REJECTED' || newStatus === 'EXPIRED') && (
                      <textarea
                        value={rejectionNote}
                        onChange={e => setRejectionNote(e.target.value)}
                        placeholder="Notes / rejection reason (required)…"
                        rows={2}
                        className="w-full text-sm p-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}
                    <div className="flex gap-2">
                      <ActionBtn
                        onClick={() => {
                          if (!newStatus) return toast('Select a new status first', 'error');
                          if ((newStatus === 'REJECTED' || newStatus === 'EXPIRED') && !rejectionNote.trim()) {
                            return toast('Notes are required for rejection/expiry', 'error');
                          }
                          updateKyc.mutate({ id: c.customer_id, status: newStatus, note: rejectionNote });
                        }}
                        loading={updateKyc.isPending}
                        variant="primary"
                      >
                        Confirm Update
                      </ActionBtn>
                      <ActionBtn onClick={() => { setSelectedId(null); setNewStatus(''); setRejectionNote(''); }} variant="secondary">
                        Cancel
                      </ActionBtn>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Loan Review Tab ─────────────────────────────────────────────────────────
function LoanReviewTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState<number | null>(null);
  const { register: regReject, handleSubmit: handleReject, reset: resetReject } = useForm<{ rejection_reason: string; notes: string }>();
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['supervisor-loan-apps'],
    queryFn: () => api.get('/loans/applications?status=SUBMITTED,UNDER_REVIEW&limit=50').then(r => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/loans/applications/${id}/review`, {
        status: 'APPROVED',
        reviewed_by_id: user?.linkedEmployeeId,
        reviewer_role: user?.role,
      }),
    onSuccess: () => { toast('Application approved', 'success'); qc.invalidateQueries({ queryKey: ['supervisor-loan-apps'] }); setExpanded(null); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed to approve', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason, notes }: { id: number; reason: string; notes?: string }) =>
      api.patch(`/loans/applications/${id}/review`, {
        status: 'REJECTED',
        rejection_reason: reason,
        notes,
        reviewed_by_id: user?.linkedEmployeeId,
        reviewer_role: user?.role,
      }),
    onSuccess: () => { toast('Application rejected', 'success'); qc.invalidateQueries({ queryKey: ['supervisor-loan-apps'] }); setRejectingId(null); resetReject(); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed to reject', 'error'),
  });

  const applications: any[] = data?.applications ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Loan Application Review"
          subtitle="SUPERVISOR can approve loans up to $50,000. Branch Manager required for larger amounts."
        />
        <div className="px-6 py-3 border-b flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Must supply rejection_reason when rejecting — enforced by DB constraint
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="font-medium">No pending applications</p>
          </div>
        ) : (
          <div className="divide-y">
            {applications.map((app: any) => (
              <div key={app.application_id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-card-foreground">
                        {app.customer?.first_name} {app.customer?.last_name || app.customer?.company_name}
                      </p>
                      <StatusBadge status={app.status} />
                      {Number(app.requested_amount) > 50000 && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                          BM Required (&gt;$50k)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {app.loan_type?.replace(/_/g, ' ')} · {formatCurrency(app.requested_amount)} · {app.requested_term_months} months
                    </p>
                    <p className="text-xs text-muted-foreground">Applied: {formatDate(app.submitted_at ?? app.created_at)}</p>
                    {app.purpose && <p className="text-xs text-muted-foreground italic">"{app.purpose}"</p>}
                  </div>
                  <button
                    onClick={() => setExpanded(expanded === app.application_id ? null : app.application_id)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {expanded === app.application_id ? 'Collapse' : 'Review'}
                  </button>
                </div>

                {expanded === app.application_id && (
                  <div className="mt-4 space-y-3">
                    {rejectingId !== app.application_id ? (
                      <div className="flex gap-2">
                        <ActionBtn
                          onClick={() => approveMutation.mutate(app.application_id)}
                          loading={approveMutation.isPending}
                          variant="success"
                          disabled={Number(app.requested_amount) > 50000}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Application
                        </ActionBtn>
                        <ActionBtn onClick={() => setRejectingId(app.application_id)} variant="danger">
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Application
                        </ActionBtn>
                        <ActionBtn onClick={() => setExpanded(null)} variant="secondary">Cancel</ActionBtn>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleReject(d =>
                          rejectMutation.mutate({ id: app.application_id, reason: d.rejection_reason, notes: d.notes })
                        )}
                        className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 space-y-3"
                      >
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400">Rejection Details</p>
                        <div>
                          <label className="text-xs text-muted-foreground">Rejection Reason *</label>
                          <input
                            {...regReject('rejection_reason', { required: true })}
                            placeholder="e.g. Insufficient income documentation"
                            className="mt-1 w-full text-sm p-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Additional Notes</label>
                          <textarea
                            {...regReject('notes')}
                            rows={2}
                            placeholder="Optional additional notes…"
                            className="mt-1 w-full text-sm p-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={rejectMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {rejectMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                            Confirm Rejection
                          </button>
                          <ActionBtn onClick={() => { setRejectingId(null); resetReject(); }} variant="secondary">Cancel</ActionBtn>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Refund Approval Tab ──────────────────────────────────────────────────────
function RefundApprovalTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pending-refunds'],
    queryFn: () => api.get('/refunds?status=PENDING_APPROVAL&limit=50').then(r => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/refunds/${id}/approve`),
    onSuccess: () => { toast('Refund approved — balance credited', 'success'); qc.invalidateQueries({ queryKey: ['pending-refunds'] }); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed to approve refund', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.patch(`/refunds/${id}/reject`, { rejection_reason: reason }),
    onSuccess: () => { toast('Refund rejected', 'success'); qc.invalidateQueries({ queryKey: ['pending-refunds'] }); setRejectingId(null); setRejectionReason(''); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed to reject refund', 'error'),
  });

  const refunds: any[] = data?.data ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-semibold text-base text-card-foreground">Refund Approval Queue</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Four-eyes principle — cannot approve refunds you requested</p>
          </div>
          <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-6 py-3 border-b flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Approving a refund credits the customer account and creates a DEPOSIT transaction automatically
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : refunds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="font-medium">All refunds processed</p>
          </div>
        ) : (
          <div className="divide-y">
            {refunds.map((r: any) => (
              <div key={r.refund_id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-card-foreground">{formatCurrency(r.amount)}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Account: {r.account?.account_number} · Txn Ref: {r.original_transaction?.reference_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested by: {r.requested_by?.first_name} {r.requested_by?.last_name ?? '(Customer)'} · {formatDate(r.created_at)}
                    </p>
                    <p className="text-xs italic text-muted-foreground">"{r.reason}"</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <ActionBtn
                      onClick={() => approveMutation.mutate(r.refund_id)}
                      loading={approveMutation.isPending}
                      variant="success"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </ActionBtn>
                    <ActionBtn onClick={() => setRejectingId(r.refund_id)} variant="danger">
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </ActionBtn>
                  </div>
                </div>

                {rejectingId === r.refund_id && (
                  <div className="mt-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 space-y-3">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">Rejection Reason *</p>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      rows={2}
                      placeholder="Why is this refund being rejected?…"
                      className="w-full text-sm p-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex gap-2">
                      <ActionBtn
                        onClick={() => {
                          if (!rejectionReason.trim()) return toast('Rejection reason is required', 'error');
                          rejectMutation.mutate({ id: r.refund_id, reason: rejectionReason });
                        }}
                        loading={rejectMutation.isPending}
                        variant="danger"
                      >
                        Confirm Rejection
                      </ActionBtn>
                      <ActionBtn onClick={() => { setRejectingId(null); setRejectionReason(''); }} variant="secondary">Cancel</ActionBtn>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Account Control Tab ──────────────────────────────────────────────────────
function AccountControlTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [searched, setSearched] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['accounts-control', searched],
    queryFn: () => api.get(`/accounts?search=${searched}&limit=30`).then(r => r.data.data),
    enabled: !!searched || true,
  });

  const freezeMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/accounts/${id}/freeze`),
    onSuccess: () => { toast('Account frozen — audit log created', 'success'); qc.invalidateQueries({ queryKey: ['accounts-control'] }); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed to freeze', 'error'),
  });

  const unfreezeMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/accounts/${id}/unfreeze`),
    onSuccess: () => { toast('Account unfrozen — audit log created', 'success'); qc.invalidateQueries({ queryKey: ['accounts-control'] }); },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed to unfreeze', 'error'),
  });

  const accounts: any[] = data?.accounts ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Account Freeze / Unfreeze"
          subtitle="Every action is written to audit_log with employee ID and timestamp"
        />
        <div className="px-6 py-3 border-b">
          <form onSubmit={e => { e.preventDefault(); setSearched(search); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search account number or customer name…"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              Search
            </button>
          </form>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['Account Number', 'Type', 'Balance', 'Status', 'Customer', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {accounts.map((a: any) => {
                  const owner = a.customer_account?.find((ca: any) => ca.is_primary_owner)?.customer;
                  return (
                    <tr key={a.account_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{a.account_number}</td>
                      <td className="px-4 py-3 text-xs">{a.account_type?.type_name}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(a.available_balance)}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {owner ? `${owner.first_name} ${owner.last_name || owner.company_name}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {a.status === 'FROZEN' ? (
                          <ActionBtn
                            onClick={() => unfreezeMutation.mutate(a.account_id)}
                            loading={unfreezeMutation.isPending}
                            variant="success"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Unfreeze
                          </ActionBtn>
                        ) : a.status === 'ACTIVE' ? (
                          <ActionBtn
                            onClick={() => freezeMutation.mutate(a.account_id)}
                            loading={freezeMutation.isPending}
                            variant="secondary"
                          >
                            <Snowflake className="w-3.5 h-3.5" />
                            Freeze
                          </ActionBtn>
                        ) : (
                          <span className="text-xs text-muted-foreground">{a.status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {accounts.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No accounts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Card Blocking Tab ───────────────────────────────────────────────────────
function CardBlockingTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [searched, setSearched] = useState('');
  const [blockingId, setBlockingId] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cards-admin', searched],
    queryFn: () => api.get(`/cards?search=${searched}&limit=30`).then(r => r.data.data),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.patch(`/cards/${id}/block`, { reason }),
    onSuccess: () => {
      toast('Card blocked — reason recorded in card.block_reason', 'success');
      qc.invalidateQueries({ queryKey: ['cards-admin'] });
      setBlockingId(null);
      setBlockReason('');
    },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed to block card', 'error'),
  });

  const cards: any[] = Array.isArray(data) ? data : (data?.cards ?? []);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Card Blocking"
          subtitle="Block a card with a documented reason. Stored in card.block_reason and card.blocked_by_id"
        />
        <div className="px-6 py-3 border-b">
          <form onSubmit={e => { e.preventDefault(); setSearched(search); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by account number or card holder…"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              Search
            </button>
          </form>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['Card Number', 'Type', 'Account', 'Expiry', 'Status', 'Block Reason', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {cards.map((c: any) => (
                  <tr key={c.card_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{c.card_number}</td>
                    <td className="px-4 py-3 text-xs">{c.card_type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.account?.account_number}</td>
                    <td className="px-4 py-3 text-xs">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{c.block_reason ?? '—'}</td>
                    <td className="px-4 py-3">
                      {c.status !== 'BLOCKED' ? (
                        <ActionBtn
                          onClick={() => setBlockingId(c.card_id)}
                          variant="danger"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Block
                        </ActionBtn>
                      ) : (
                        <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Blocked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {cards.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No cards found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Block Card Modal */}
      {blockingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Block Card</h3>
                <p className="text-xs text-muted-foreground">This action will be recorded with your employee ID</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground">Block Reason *</label>
              <textarea
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                rows={3}
                placeholder="e.g. Suspicious activity reported by customer, fraudulent transaction detected…"
                className="mt-1.5 w-full text-sm p-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Stored in card.block_reason — required by policy</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!blockReason.trim()) return toast('Block reason is required', 'error');
                  blockMutation.mutate({ id: blockingId, reason: blockReason });
                }}
                disabled={blockMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                {blockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Block Card
              </button>
              <button
                onClick={() => { setBlockingId(null); setBlockReason(''); }}
                className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Withdrawal Override Tab ──────────────────────────────────────────────────
function WithdrawalOverrideTab() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    amount: string;
    override_reason: string;
  }>();

  const { data: accountData, isLoading: accountLoading } = useQuery({
    queryKey: ['accounts-override-search', accountSearch],
    queryFn: () => api.get(`/accounts?search=${accountSearch}&limit=10`).then(r => r.data.data),
    enabled: accountSearch.length >= 3,
  });

  const overrideMutation = useMutation({
    mutationFn: (d: { amount: string; override_reason: string }) =>
      api.post('/supervisor/withdraw-override', {
        account_id: selectedAccount.account_id,
        amount: parseFloat(d.amount),
        override_reason: d.override_reason,
      }),
    onSuccess: (res) => {
      toast(`Override withdrawal processed. Ref: ${res.data.data?.reference_number ?? ''}`, 'success');
      reset();
      setSelectedAccount(null);
      setAccountSearch('');
    },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Override failed', 'error'),
  });

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Supervisor Withdrawal Override</p>
          <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
            This bypasses the <strong>minimum balance restriction</strong> for branch-policy exceptions.
            Available balance is still enforced — insufficient funds cannot be overridden.
            Every override is recorded in the audit log with your employee ID, the reason, and a timestamp.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Search */}
        <Card>
          <SectionTitle title="Step 1: Select Account" />
          <div className="p-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={accountSearch}
                onChange={e => { setAccountSearch(e.target.value); setSelectedAccount(null); }}
                placeholder="Search account number (min 3 chars)…"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {accountLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
            {(accountData?.accounts ?? []).map((a: any) => {
              const owner = a.customer_account?.find((ca: any) => ca.is_primary_owner)?.customer;
              return (
                <button
                  key={a.account_id}
                  onClick={() => setSelectedAccount(a)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedAccount?.account_id === a.account_id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <p className="font-mono text-sm font-medium text-card-foreground">{a.account_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {owner ? `${owner.first_name} ${owner.last_name || owner.company_name}` : 'Unknown'} ·{' '}
                    {a.account_type?.type_name} · Balance: {formatCurrency(a.available_balance)}
                  </p>
                  <p className="mt-1"><StatusBadge status={a.status} /></p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Override Form */}
        <Card>
          <SectionTitle title="Step 2: Override Details" />
          <div className="p-6">
            {!selectedAccount ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <TrendingDown className="w-10 h-10 opacity-30" />
                <p className="text-sm">Select an account first</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(d => overrideMutation.mutate(d))} className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-medium text-card-foreground">Selected Account</p>
                  <p className="font-mono text-sm mt-0.5">{selectedAccount.account_number}</p>
                  <p className="text-xs text-muted-foreground">
                    Available Balance: <strong className="text-card-foreground">{formatCurrency(selectedAccount.available_balance)}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min. Balance: <strong className="text-card-foreground">{formatCurrency(selectedAccount.account_type?.minimum_balance ?? 0)}</strong>
                    {' '}(will be overridden)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-card-foreground">Withdrawal Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { required: 'Amount is required', min: { value: 1, message: 'Must be greater than 0' } })}
                    placeholder="0.00"
                    className="mt-1.5 w-full text-sm p-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-card-foreground">Override Reason *</label>
                  <textarea
                    {...register('override_reason', { required: 'Reason is required', minLength: { value: 10, message: 'Minimum 10 characters' } })}
                    rows={3}
                    placeholder="Explain why this override is within branch policy (minimum 10 characters)…"
                    className="mt-1.5 w-full text-sm p-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.override_reason && <p className="text-xs text-red-500 mt-1">{errors.override_reason.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">Audit logged with your employee ID and timestamp</p>
                </div>

                <button
                  type="submit"
                  disabled={overrideMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium disabled:opacity-50"
                >
                  {overrideMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
                  Process Override Withdrawal
                </button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SupervisorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-card-foreground">Supervisor Operations Center</h1>
              <p className="text-xs text-muted-foreground">
                {user?.email} — Level 2 Mid-Office · Approvals &amp; Overrides
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-3 py-1.5 rounded-full font-medium">
                <Shield className="w-3.5 h-3.5" />
                SUPERVISOR
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-background border border-b-background text-foreground -mb-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview'  && <OverviewTab onNavigate={setActiveTab} />}
        {activeTab === 'kyc'       && <KycQueueTab />}
        {activeTab === 'loans'     && <LoanReviewTab />}
        {activeTab === 'refunds'   && <RefundApprovalTab />}
        {activeTab === 'accounts'  && <AccountControlTab />}
        {activeTab === 'cards'     && <CardBlockingTab />}
        {activeTab === 'override'  && <WithdrawalOverrideTab />}
      </div>
    </div>
  );
}
