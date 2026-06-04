'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../../../lib/utils';
import {
  ArrowLeft, Banknote, User, CreditCard, ArrowLeftRight,
  Building2, AlertTriangle, RefreshCw, ChevronRight,
} from 'lucide-react';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: account, isLoading, isError, refetch } = useQuery({
    queryKey: ['account-detail', id],
    queryFn: async () => {
      const res = await api.get(`/accounts/${id}`);
      return res.data.data;
    },
  });

  const { data: txns, isLoading: txnsLoading } = useQuery({
    queryKey: ['account-transactions', id],
    queryFn: async () => {
      const res = await api.get(`/accounts/${id}/transactions?limit=20`);
      return res.data.data as any[];
    },
    enabled: !!account,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-80 bg-muted rounded-xl animate-pulse" />
          <div className="lg:col-span-2 h-80 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-muted-foreground">Account not found or you don't have access.</p>
        <Link href="/accounts" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to accounts
        </Link>
      </div>
    );
  }

  const primaryOwner = account.customer_account?.find((ca: any) => ca.is_primary_owner);
  const owner = primaryOwner?.customer;
  const ownerName = owner
    ? owner.customer_type === 'CORPORATE'
      ? owner.company_name
      : `${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim()
    : '—';

  const balancePct = account.balance > 0
    ? Math.min(100, (Number(account.available_balance) / Number(account.balance)) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/accounts"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Accounts
        </Link>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-mono text-foreground">{account.account_number}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title font-mono">{account.account_number}</h1>
          <p className="page-subtitle">
            {account.account_type?.type_name} · {account.currency?.currency_code} · {account.branch?.branch_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={getStatusBadge(account.status)}>{account.status}</span>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Balance hero */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Balance</p>
            <p className="text-4xl font-bold font-financial text-foreground">
              {formatCurrency(Number(account.balance), account.currency?.currency_code, account.currency?.symbol)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Available:{' '}
              <span className="font-financial font-semibold text-foreground">
                {formatCurrency(Number(account.available_balance), account.currency?.currency_code, account.currency?.symbol)}
              </span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Banknote className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available funds</span>
            <span>{balancePct.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${balancePct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Account details + Owner + Cards */}
        <div className="space-y-4">
          {/* Account details */}
          <div className="rounded-xl border bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Account Details</h3>
            <div>
              <InfoRow label="Account Number" value={<span className="font-mono">{account.account_number}</span>} />
              <InfoRow label="IBAN" value={<span className="font-mono text-xs">{account.iban ?? '—'}</span>} />
              <InfoRow label="Type" value={account.account_type?.type_name} />
              <InfoRow label="Currency" value={`${account.currency?.currency_code} (${account.currency?.symbol})`} />
              <InfoRow label="Branch" value={account.branch?.branch_name} />
              <InfoRow label="Interest Rate" value={`${account.account_type?.interest_rate ?? 0}%`} />
              <InfoRow label="Opened" value={formatDate(account.open_date)} />
              <InfoRow label="Total Transactions" value={account._count?.transaction_from?.toLocaleString() ?? '0'} />
            </div>
          </div>

          {/* Primary owner */}
          {owner && (
            <div className="rounded-xl border bg-card shadow-sm p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Primary Owner</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {owner.customer_type === 'CORPORATE'
                    ? <Building2 className="w-5 h-5 text-primary" />
                    : <User className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{ownerName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{owner.customer_code}</p>
                </div>
              </div>
              <InfoRow label="Phone" value={owner.phone_number ?? '—'} />
              <InfoRow label="Type" value={owner.customer_type} />
              <div className="pt-2">
                <Link href={`/customers/${owner.customer_id}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  View customer profile <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Linked cards */}
          {account.card?.length > 0 && (
            <div className="rounded-xl border bg-card shadow-sm p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Active Cards</h3>
              <div className="space-y-2">
                {account.card.map((card: any) => (
                  <div key={card.card_id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-mono text-foreground">
                          **** {card.masked_number?.slice(-4) ?? '????'}
                        </p>
                        <p className="text-xs text-muted-foreground">{card.card_type} · {card.card_network}</p>
                      </div>
                    </div>
                    <span className={getStatusBadge(card.status)}>{card.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Transactions */}
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Transaction History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 20 transactions</p>
            </div>
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </div>

          {txnsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (txns ?? []).length === 0 ? (
            <div className="py-16 text-center">
              <ArrowLeftRight className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {['Reference', 'Type', 'Channel', 'Amount', 'Status', 'Date'].map((h) => (
                      <th key={h} className={`text-left px-4 py-2.5 text-xs font-medium text-muted-foreground ${h === 'Amount' ? 'text-right' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(txns ?? []).map((txn: any) => {
                    const isCredit = ['DEPOSIT', 'LOAN_DISBURSEMENT'].includes(txn.transaction_type);
                    return (
                      <tr key={txn.transaction_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{txn.reference_number}</td>
                        <td className="px-4 py-3 text-xs font-medium text-foreground">
                          {txn.transaction_type.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                          {txn.channel?.toLowerCase() ?? '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-financial font-semibold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                          {isCredit ? '+' : '−'}{account.currency?.symbol ?? 'ETB'}{' '}
                          {Number(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            txn.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            txn.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(txn.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
