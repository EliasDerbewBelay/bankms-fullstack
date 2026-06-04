'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../../../lib/utils';
import { useAuthStore } from '../../../../store/auth.store';
import {
  ArrowLeft, FileText, User, ChevronRight, AlertTriangle,
  RefreshCw, Calendar, TrendingDown, CheckCircle2, Clock,
  Shield, Banknote, BarChart3,
} from 'lucide-react';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0 gap-4">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value ?? '—'}</span>
    </div>
  );
}

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'collateral' | 'guarantors'>('overview');

  const isSupervisorPlus = ['SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'].includes(user?.role ?? '');

  const { data: loan, isLoading, isError, refetch } = useQuery({
    queryKey: ['loan-detail', id],
    queryFn: async () => {
      const res = await api.get(`/loans/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-80 bg-muted rounded-xl animate-pulse" />
          <div className="lg:col-span-2 h-80 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !loan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-muted-foreground">Loan not found or access denied.</p>
        <Link href="/loans" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to loans
        </Link>
      </div>
    );
  }

  const customer = loan.customer;
  const customerName = customer?.customer_type === 'CORPORATE'
    ? customer.company_name
    : `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim() || '—';

  const paidPct = loan.principal_amount > 0
    ? Math.min(100, ((Number(loan.principal_amount) - Number(loan.outstanding_balance)) / Number(loan.principal_amount)) * 100)
    : 0;

  const schedule: any[] = loan.repayment_schedule ?? [];
  const paidInstallments = schedule.filter((s) => s.status === 'PAID').length;
  const overdueInstallments = schedule.filter((s) => s.status === 'OVERDUE').length;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'schedule', label: `Repayment Schedule (${schedule.length})`, icon: Calendar },
    { id: 'collateral', label: `Collateral (${loan.collateral?.length ?? 0})`, icon: Shield },
    { id: 'guarantors', label: `Guarantors (${loan.guarantor?.length ?? 0})`, icon: User },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/loans" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Loans
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-mono font-medium">{loan.loan_number}</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title font-mono">{loan.loan_number}</h1>
          <p className="page-subtitle">
            {loan.loan_type?.replace(/_/g, ' ')} Loan · {customerName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={getStatusBadge(loan.status)}>{loan.status.replace(/_/g, ' ')}</span>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueInstallments > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">
            {overdueInstallments} overdue installment{overdueInstallments > 1 ? 's' : ''} — immediate attention required
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Principal Amount',
            value: formatCurrency(Number(loan.principal_amount)),
            icon: Banknote,
            color: 'bg-primary/10 text-primary',
          },
          {
            label: 'Outstanding Balance',
            value: formatCurrency(Number(loan.outstanding_balance)),
            icon: TrendingDown,
            color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          },
          {
            label: 'Interest Rate',
            value: `${loan.interest_rate}% p.a.`,
            icon: BarChart3,
            color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
          },
          {
            label: 'Installments Paid',
            value: `${paidInstallments} / ${schedule.length}`,
            icon: CheckCircle2,
            color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          },
        ].map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                <p className="text-xl font-bold text-foreground font-financial">{card.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border bg-card shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Repayment Progress</span>
          <span className="text-sm font-financial font-bold text-primary">{paidPct.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Paid: {formatCurrency(Number(loan.principal_amount) - Number(loan.outstanding_balance))}</span>
          <span>Remaining: {formatCurrency(Number(loan.outstanding_balance))}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setActiveTab(tabId as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loan details */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Loan Details</h3>
              </div>
              <InfoRow label="Loan Number" value={<span className="font-mono text-xs">{loan.loan_number}</span>} />
              <InfoRow label="Loan Type" value={loan.loan_type?.replace(/_/g, ' ')} />
              <InfoRow label="Status" value={<span className={getStatusBadge(loan.status)}>{loan.status.replace(/_/g, ' ')}</span>} />
              <InfoRow label="Principal" value={formatCurrency(Number(loan.principal_amount))} />
              <InfoRow label="Interest Rate" value={`${loan.interest_rate}%`} />
              <InfoRow label="Term" value={`${loan.term_months} months`} />
              <InfoRow label="Disbursement Date" value={loan.disbursement_date ? formatDate(new Date(loan.disbursement_date)) : null} />
              <InfoRow label="Maturity Date" value={loan.maturity_date ? formatDate(new Date(loan.maturity_date)) : null} />
              <InfoRow label="Disbursement Account" value={
                <span className="font-mono text-xs">{loan.disbursement_account?.account_number ?? '—'}</span>
              } />
            </div>

            <div className="rounded-xl border bg-card shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Authorisation</h3>
              </div>
              <InfoRow label="Approved By" value={
                loan.approved_by
                  ? `${loan.approved_by.first_name} ${loan.approved_by.last_name}`
                  : null
              } />
              <InfoRow label="Disbursed By" value={
                loan.disbursed_by
                  ? `${loan.disbursed_by.first_name} ${loan.disbursed_by.last_name}`
                  : null
              } />
              {!isSupervisorPlus && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Approvals require Supervisor+
                </p>
              )}
            </div>
          </div>

          {/* Customer details */}
          <div className="lg:col-span-2 space-y-4">
            {customer && (
              <div className="rounded-xl border bg-card shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Borrower</h3>
                  </div>
                  <Link href={`/customers/${customer.customer_id}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    View profile <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {customerName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{customerName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{customer.customer_code}</p>
                  </div>
                  <span className={`ml-auto ${getStatusBadge(customer.kyc_status)}`}>
                    {customer.kyc_status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-0">
                  <InfoRow label="Phone" value={customer.phone_number} />
                  <InfoRow label="Email" value={customer.email} />
                  <InfoRow label="City" value={customer.city} />
                  <InfoRow label="National ID" value={customer.national_id} />
                </div>
              </div>
            )}

            {/* Application info */}
            {loan.application && (
              <div className="rounded-xl border bg-card shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Original Application</h3>
                </div>
                <div className="grid grid-cols-2 gap-0">
                  <InfoRow label="Application #" value={<span className="font-mono text-xs">{loan.application.application_number}</span>} />
                  <InfoRow label="Applied Amount" value={formatCurrency(Number(loan.application.applied_amount ?? loan.application.requested_amount))} />
                  <InfoRow label="Applied On" value={loan.application.application_date ? formatDate(new Date(loan.application.application_date)) : null} />
                  <InfoRow label="Purpose" value={loan.application.purpose} />
                </div>
                {loan.application.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Notes: </span>{loan.application.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Repayment Schedule */}
      {activeTab === 'schedule' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Repayment Schedule</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {paidInstallments} paid · {overdueInstallments > 0 ? `${overdueInstallments} overdue · ` : ''}{schedule.length - paidInstallments - overdueInstallments} upcoming
              </p>
            </div>
          </div>
          {schedule.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">No schedule generated yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {['#', 'Due Date', 'Principal', 'Interest', 'Total Due', 'Paid Amount', 'Status'].map((h) => (
                      <th key={h} className={`px-4 py-2.5 text-xs font-medium text-muted-foreground ${['Principal', 'Interest', 'Total Due', 'Paid Amount'].includes(h) ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schedule.map((s: any) => {
                    const isOverdue = s.status === 'OVERDUE';
                    const isPaid = s.status === 'PAID';
                    const paidAmt = Number(s.principal_paid ?? 0) + Number(s.interest_paid ?? 0);
                    return (
                      <tr key={s.repayment_id}
                        className={`hover:bg-muted/30 transition-colors ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{s.installment_number}</td>
                        <td className={`px-4 py-3 text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-foreground'}`}>
                          {formatDate(new Date(s.due_date))}
                        </td>
                        <td className="px-4 py-3 text-right font-financial text-foreground">{formatCurrency(Number(s.principal_due))}</td>
                        <td className="px-4 py-3 text-right font-financial text-muted-foreground">{formatCurrency(Number(s.interest_due))}</td>
                        <td className="px-4 py-3 text-right font-financial font-semibold text-foreground">{formatCurrency(Number(s.total_due))}</td>
                        <td className="px-4 py-3 text-right font-financial text-emerald-600 dark:text-emerald-400">
                          {paidAmt > 0 ? formatCurrency(paidAmt) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isPaid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {isPaid ? <CheckCircle2 className="w-3 h-3" /> : isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40 border-t-2 border-border font-semibold">
                    <td className="px-4 py-3 text-xs text-muted-foreground" colSpan={2}>Totals</td>
                    <td className="px-4 py-3 text-right font-financial text-foreground">
                      {formatCurrency(schedule.reduce((sum: number, s: any) => sum + Number(s.principal_due ?? 0), 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-financial text-muted-foreground">
                      {formatCurrency(schedule.reduce((sum: number, s: any) => sum + Number(s.interest_due ?? 0), 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-financial text-foreground">
                      {formatCurrency(schedule.reduce((sum: number, s: any) => sum + Number(s.total_due ?? 0), 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-financial text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(schedule.reduce((sum: number, s: any) => sum + Number(s.principal_paid ?? 0) + Number(s.interest_paid ?? 0), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Collateral */}
      {activeTab === 'collateral' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Collateral</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{loan.collateral?.length ?? 0} item(s) pledged</p>
          </div>
          {(loan.collateral ?? []).length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">No collateral recorded</div>
          ) : (
            <div className="divide-y divide-border">
              {(loan.collateral ?? []).map((col: any) => {
                const latestRevaluation = col.collateral_revaluation?.[0];
                return (
                  <div key={col.collateral_id} className="px-5 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{col.description}</p>
                        <p className="text-xs text-muted-foreground capitalize">{col.collateral_type?.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={getStatusBadge(col.status)}>{col.status}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-lg bg-muted/40 p-2.5">
                        <p className="text-muted-foreground">Estimated Value</p>
                        <p className="font-financial font-semibold text-foreground mt-0.5">{formatCurrency(Number(col.estimated_value))}</p>
                      </div>
                      {latestRevaluation && (
                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <p className="text-muted-foreground">Latest Revaluation</p>
                          <p className="font-financial font-semibold text-foreground mt-0.5">{formatCurrency(Number(latestRevaluation.new_value))}</p>
                        </div>
                      )}
                      {col.insurance_value && (
                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <p className="text-muted-foreground">Insurance Value</p>
                          <p className="font-financial font-semibold text-foreground mt-0.5">{formatCurrency(Number(col.insurance_value))}</p>
                        </div>
                      )}
                      {col.insurance_expiry && (
                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <p className="text-muted-foreground">Insurance Expiry</p>
                          <p className="font-semibold text-foreground mt-0.5">{formatDate(new Date(col.insurance_expiry))}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Guarantors */}
      {activeTab === 'guarantors' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Guarantors</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{loan.guarantor?.length ?? 0} guarantor(s)</p>
          </div>
          {(loan.guarantor ?? []).length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">No guarantors recorded</div>
          ) : (
            <div className="divide-y divide-border">
              {(loan.guarantor ?? []).map((g: any) => (
                <div key={g.guarantor_id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {g.customer
                          ? `${g.customer.first_name ?? ''} ${g.customer.last_name ?? ''}`.trim()
                          : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">{g.guarantor_type} · {g.notes ?? ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Guaranteed Amount</p>
                    <p className="text-sm font-financial font-semibold text-foreground">
                      {g.guaranteed_amount ? formatCurrency(Number(g.guaranteed_amount)) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
