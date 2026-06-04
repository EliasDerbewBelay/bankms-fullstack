'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../../../lib/utils';
import { useAuthStore } from '../../../../store/auth.store';
import { useToast } from '../../../../components/ui/toaster';
import {
  ArrowLeft, User, Building2, Phone, Mail, MapPin, Shield,
  Banknote, FileText, ChevronRight, AlertTriangle, RefreshCw,
  CheckCircle2, Clock, UserCheck,
} from 'lucide-react';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0 gap-4">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right break-all">{value ?? '—'}</span>
    </div>
  );
}

function KycBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    VERIFIED:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    PENDING:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    UNDER_REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    REJECTED:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    EXPIRED:      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  const icons: Record<string, React.ElementType> = {
    VERIFIED: CheckCircle2,
    PENDING: Clock,
    UNDER_REVIEW: Clock,
    REJECTED: AlertTriangle,
    EXPIRED: AlertTriangle,
  };
  const Icon = icons[status] ?? Shield;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${styles[status] ?? 'bg-muted text-muted-foreground'}`}>
      <Icon className="w-3.5 h-3.5" />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'loans'>('overview');

  const canUpdateKyc = user?.role === 'SUPERVISOR' || user?.role === 'BRANCH_MANAGER' || user?.role === 'ADMIN';

  const { data: customer, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer-detail', id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}`);
      return res.data.data;
    },
  });

  const kycMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/customers/${id}/kyc`, { kyc_status: status }),
    onSuccess: () => {
      toast('KYC status updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['customer-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => toast(err.response?.data?.message ?? 'Failed to update KYC', 'error'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
          <div className="lg:col-span-2 h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-muted-foreground">Customer not found or access denied.</p>
        <Link href="/customers" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to customers
        </Link>
      </div>
    );
  }

  const displayName = customer.customer_type === 'CORPORATE'
    ? customer.company_name
    : `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() || '—';

  const initials = customer.customer_type === 'CORPORATE'
    ? (customer.company_name ?? 'C').slice(0, 2).toUpperCase()
    : `${(customer.first_name ?? '')[0] ?? ''}${(customer.last_name ?? '')[0] ?? ''}`.toUpperCase() || 'C';

  const accounts = customer.customer_account ?? [];
  const loans = customer.loan ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/customers" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Customers
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">{displayName}</span>
      </div>

      {/* Profile header */}
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{customer.customer_code}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <KycBadge status={customer.kyc_status} />
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {customer.customer_type}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  customer.risk_profile === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  customer.risk_profile === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {customer.risk_profile} Risk
                </span>
              </div>
            </div>

            {/* Contact strip */}
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              {customer.phone_number && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {customer.phone_number}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {customer.email}
                </span>
              )}
              {customer.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {customer.city}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {canUpdateKyc && (
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Shield className="w-3.5 h-3.5" /> Update KYC
                </button>
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-card shadow-lg z-10 hidden group-hover:block py-1">
                  {['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'].map((s) => (
                    <button key={s} onClick={() => kycMutation.mutate(s)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${customer.kyc_status === s ? 'text-primary font-medium' : 'text-foreground'}`}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          { id: 'overview', label: 'Overview', icon: UserCheck },
          { id: 'accounts', label: `Accounts (${accounts.length})`, icon: Banknote },
          { id: 'loans', label: `Loans (${loans.length})`, icon: FileText },
        ] as const).map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setActiveTab(tabId as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal / Company details */}
          <div className="rounded-xl border bg-card shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              {customer.customer_type === 'CORPORATE'
                ? <Building2 className="w-4 h-4 text-primary" />
                : <User className="w-4 h-4 text-primary" />}
              <h3 className="text-sm font-semibold text-foreground">
                {customer.customer_type === 'CORPORATE' ? 'Company Details' : 'Personal Details'}
              </h3>
            </div>
            {customer.customer_type === 'CORPORATE' ? (
              <>
                <InfoRow label="Company Name" value={customer.company_name} />
                <InfoRow label="Tax ID" value={customer.tax_id} />
                <InfoRow label="Incorporation Date" value={customer.incorporation_date ? formatDate(new Date(customer.incorporation_date)) : null} />
              </>
            ) : (
              <>
                <InfoRow label="First Name" value={customer.first_name} />
                <InfoRow label="Last Name" value={customer.last_name} />
                <InfoRow label="Date of Birth" value={customer.date_of_birth ? formatDate(new Date(customer.date_of_birth)) : null} />
                <InfoRow label="National ID" value={customer.national_id} />
              </>
            )}
            <InfoRow label="Address" value={customer.address} />
            <InfoRow label="City" value={customer.city} />
            <InfoRow label="Phone" value={customer.phone_number} />
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="Registered" value={customer.registration_date ? formatDate(new Date(customer.registration_date)) : null} />
          </div>

          {/* KYC & Risk */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">KYC & Compliance</h3>
              </div>
              <InfoRow label="KYC Status" value={<KycBadge status={customer.kyc_status} />} />
              <InfoRow label="Risk Profile" value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  customer.risk_profile === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  customer.risk_profile === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>{customer.risk_profile} Risk</span>
              } />
              <InfoRow label="KYC Verified At" value={customer.kyc_verified_at ? formatDate(new Date(customer.kyc_verified_at)) : 'Not verified'} />
              <InfoRow label="KYC Expiry" value={customer.kyc_expiry_date ? formatDate(new Date(customer.kyc_expiry_date)) : 'N/A'} />
              {!canUpdateKyc && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> KYC changes require Supervisor access
                </p>
              )}
            </div>

            {/* Relationship manager */}
            {customer.relationship_manager && (
              <div className="rounded-xl border bg-card shadow-sm p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Relationship Manager</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {customer.relationship_manager.first_name} {customer.relationship_manager.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{customer.relationship_manager.position}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Online access */}
            {customer.online_user && (
              <div className="rounded-xl border bg-card shadow-sm p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Online Banking</h3>
                <InfoRow label="Username" value={<span className="font-mono">{customer.online_user.username}</span>} />
                <InfoRow label="Role" value={customer.online_user.role} />
                <InfoRow label="Last Login" value={customer.online_user.last_login ? formatDate(new Date(customer.online_user.last_login)) : 'Never'} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Accounts */}
      {activeTab === 'accounts' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Linked Accounts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{accounts.length} account(s)</p>
          </div>
          {accounts.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">No accounts linked</div>
          ) : (
            <div className="divide-y divide-border">
              {accounts.map((ca: any) => {
                const acc = ca.account;
                if (!acc) return null;
                return (
                  <Link key={ca.account_id} href={`/accounts/${acc.account_id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-mono font-medium text-foreground">{acc.account_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {acc.account_type?.type_name} · {acc.currency?.currency_code} ·{' '}
                          {ca.is_primary_owner ? 'Primary Owner' : 'Co-owner'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-sm font-financial font-bold text-foreground">
                          {formatCurrency(Number(acc.balance), acc.currency?.currency_code, acc.currency?.symbol)}
                        </p>
                        <span className={getStatusBadge(acc.status)}>{acc.status}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Loans */}
      {activeTab === 'loans' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Active Loans</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{loans.length} loan(s)</p>
          </div>
          {loans.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">No active loans</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {['Loan #', 'Type', 'Principal', 'Outstanding', 'Status', 'Maturity'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loans.map((loan: any) => (
                    <tr key={loan.loan_id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{loan.loan_number}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{loan.loan_type?.type_name ?? '—'}</td>
                      <td className="px-4 py-3 font-financial font-semibold text-foreground">
                        {formatCurrency(Number(loan.principal_amount))}
                      </td>
                      <td className="px-4 py-3 font-financial text-foreground">
                        {formatCurrency(Number(loan.outstanding_balance))}
                      </td>
                      <td className="px-4 py-3">
                        <span className={getStatusBadge(loan.status)}>{loan.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {loan.maturity_date ? formatDate(new Date(loan.maturity_date)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
