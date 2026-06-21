'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { useAuthStore } from '../../../store/auth.store';
import { useToast } from '../../../components/ui/toaster';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Users, Banknote,
  ArrowLeftRight, FileText, CreditCard, Landmark, Search,
  Plus, AlertTriangle, CheckCircle2, Clock, RefreshCw,
  ChevronRight, UserCheck, Shield, Eye,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'deposit' | 'withdrawal' | 'customers' | 'accounts' | 'transactions' | 'loans' | 'cards' | 'atm';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',      label: 'Overview',      icon: Wallet },
  { id: 'deposit',       label: 'Deposit',        icon: ArrowDownCircle },
  { id: 'withdrawal',    label: 'Withdrawal',     icon: ArrowUpCircle },
  { id: 'customers',     label: 'Customers',      icon: Users },
  { id: 'accounts',      label: 'Accounts',       icon: Banknote },
  { id: 'transactions',  label: 'Transactions',   icon: ArrowLeftRight },
  { id: 'loans',         label: 'Loans',          icon: FileText },
  { id: 'cards',         label: 'Cards',          icon: CreditCard },
  { id: 'atm',           label: 'ATM Status',     icon: Landmark },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    PENDING:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    FAILED:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    ACTIVE:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    INACTIVE:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    OPEN:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    ONLINE:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    OFFLINE:   'bg-slate-100 text-slate-600',
    LOW_CASH:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    OUT_OF_CASH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    VERIFIED:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    PENDING_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    UNDER_REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card shadow-sm ${className}`}>{children}</div>
  );
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function FormInput({
  label, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <input
        {...props}
        className={`w-full px-3 py-2 rounded-lg border text-sm bg-background text-foreground
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors
          ${error ? 'border-red-400' : 'border-border'} ${props.className ?? ''}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function FormSelect({
  label, error, children, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <select
        {...props}
        className={`w-full px-3 py-2 rounded-lg border text-sm bg-background text-foreground
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors
          ${error ? 'border-red-400' : 'border-border'}`}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ employeeId }: { employeeId: number }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['teller-dashboard', employeeId],
    queryFn: async () => {
      const res = await api.get(`/teller-drawers/employee/${employeeId}/dashboard`);
      return res.data.data as {
        drawer: any;
        daily: { deposits: { count: number; total: number }; withdrawals: { count: number; total: number } };
        recentTransactions: any[];
      };
    },
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>;

  const drawer = data?.drawer;
  const daily = data?.daily;

  return (
    <div className="p-5 space-y-5">
      {/* Drawer status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cash Drawer</p>
                  <p className="text-sm font-semibold text-foreground">Today's Shift</p>
                </div>
              </div>
              <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            {drawer ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={drawer.status} />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Opening Balance</span>
                  <span className="font-financial font-semibold text-foreground">{formatCurrency(Number(drawer.opening_balance))}</span>
                </div>
                <div className="flex justify-between items-center rounded-lg bg-teal-50 dark:bg-teal-900/20 px-3 py-2">
                  <span className="text-sm font-medium text-teal-700 dark:text-teal-300">Current Balance</span>
                  <span className="text-lg font-bold font-financial text-teal-700 dark:text-teal-300">{formatCurrency(Number(drawer.current_balance))}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Opened: {new Date(drawer.opened_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No Active Drawer</p>
                <p className="text-xs text-muted-foreground mt-1">Ask a Supervisor to open your drawer</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Daily stats */}
        <div className="grid grid-rows-2 gap-4">
          <SectionCard>
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <ArrowDownCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Deposits Today</p>
                <p className="text-lg font-bold font-financial text-foreground">{formatCurrency(daily?.deposits.total ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{daily?.deposits.count ?? 0} transactions</p>
              </div>
            </div>
          </SectionCard>
          <SectionCard>
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <ArrowUpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Withdrawals Today</p>
                <p className="text-lg font-bold font-financial text-foreground">{formatCurrency(daily?.withdrawals.total ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{daily?.withdrawals.count ?? 0} transactions</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Recent transactions today */}
      <SectionCard>
        <SectionHeader title="Today's Transactions" sub="Processed by you this shift" />
        {(data?.recentTransactions ?? []).length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No transactions processed today</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Reference</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.recentTransactions ?? []).map((txn: any) => (
                  <tr key={txn.transaction_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{txn.reference_number}</td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{txn.transaction_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-right font-financial font-semibold text-foreground">
                      {txn.currency?.symbol ?? 'ETB'} {Number(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={txn.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(txn.transaction_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Deposit Tab ──────────────────────────────────────────────────────────────
function DepositTab({ employeeId }: { employeeId: number }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const { data: accounts } = useQuery({
    queryKey: ['accounts-search', accountSearch],
    queryFn: async () => {
      if (accountSearch.length < 3) return [];
      const res = await api.get(`/accounts?search=${accountSearch}&limit=10`);
      return res.data.data;
    },
    enabled: accountSearch.length >= 3,
  });

  const depositMutation = useMutation({
    mutationFn: (data: any) => api.post('/transactions/deposit', data),
    onSuccess: () => {
      toast('Deposit processed successfully', 'success');
      reset();
      setSelectedAccount(null);
      setAccountSearch('');
      queryClient.invalidateQueries({ queryKey: ['teller-dashboard'] });
    },
    onError: (err: any) => toast(err.response?.data?.message ?? 'Deposit failed', 'error'),
  });

  const onSubmit = (data: any) => {
    if (!selectedAccount) return toast('Select an account first', 'error');
    depositMutation.mutate({
      account_id: selectedAccount.account_id,
      amount: parseFloat(data.amount),
      description: data.description || 'Cash deposit',
      processed_by_employee_id: employeeId,
    });
  };

  return (
    <div className="p-5 max-w-xl space-y-5">
      <SectionCard>
        <SectionHeader title="Process Cash Deposit" sub="Deposit cash into any active account" />
        <div className="p-5 space-y-4">
          {/* Account search */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Search Account</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Account number or IBAN…"
                value={accountSearch}
                onChange={(e) => { setAccountSearch(e.target.value); setSelectedAccount(null); }}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            {(accounts ?? []).length > 0 && !selectedAccount && (
              <div className="rounded-lg border border-border bg-card shadow-md divide-y divide-border mt-1">
                {(accounts as any[]).map((acc: any) => (
                  <button
                    key={acc.account_id}
                    onClick={() => { setSelectedAccount(acc); setAccountSearch(acc.account_number); }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 text-left transition-colors"
                  >
                    <div>
                      <p className="text-sm font-mono font-medium text-foreground">{acc.account_number}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{acc.account_type?.type_name} · {acc.currency?.currency_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-financial font-semibold text-foreground">{formatCurrency(Number(acc.balance))}</p>
                      <StatusBadge status={acc.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedAccount && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Selected Account</p>
                <p className="text-sm font-mono font-bold text-emerald-900 dark:text-emerald-200">{selectedAccount.account_number}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Balance: {formatCurrency(Number(selectedAccount.balance))} · {selectedAccount.status}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              label="Amount (ETB)"
              type="number"
              step="0.01"
              min="1"
              placeholder="0.00"
              error={errors.amount?.message as string}
              {...register('amount', { required: 'Amount is required', min: { value: 1, message: 'Minimum 1 ETB' } })}
            />
            <FormInput
              label="Description (optional)"
              type="text"
              placeholder="Cash deposit"
              {...register('description')}
            />
            <button
              type="submit"
              disabled={!selectedAccount || depositMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <ArrowDownCircle className="w-4 h-4" />
              {depositMutation.isPending ? 'Processing…' : 'Process Deposit'}
            </button>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Withdrawal Tab ───────────────────────────────────────────────────────────
function WithdrawalTab({ employeeId }: { employeeId: number }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const { data: accounts } = useQuery({
    queryKey: ['accounts-search-w', accountSearch],
    queryFn: async () => {
      if (accountSearch.length < 3) return [];
      const res = await api.get(`/accounts?search=${accountSearch}&limit=10`);
      return res.data.data;
    },
    enabled: accountSearch.length >= 3,
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: any) => api.post('/transactions/withdraw', data),
    onSuccess: () => {
      toast('Withdrawal processed successfully', 'success');
      reset();
      setSelectedAccount(null);
      setAccountSearch('');
      queryClient.invalidateQueries({ queryKey: ['teller-dashboard'] });
    },
    onError: (err: any) => toast(err.response?.data?.message ?? 'Withdrawal failed', 'error'),
  });

  const onSubmit = (data: any) => {
    if (!selectedAccount) return toast('Select an account first', 'error');
    withdrawMutation.mutate({
      account_id: selectedAccount.account_id,
      amount: parseFloat(data.amount),
      description: data.description || 'Cash withdrawal',
      processed_by_employee_id: employeeId,
    });
  };

  return (
    <div className="p-5 max-w-xl space-y-5">
      <SectionCard>
        <SectionHeader title="Process Cash Withdrawal" sub="Withdraw cash from an active account" />
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Search Account</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Account number or IBAN…"
                value={accountSearch}
                onChange={(e) => { setAccountSearch(e.target.value); setSelectedAccount(null); }}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            {(accounts ?? []).length > 0 && !selectedAccount && (
              <div className="rounded-lg border border-border bg-card shadow-md divide-y divide-border mt-1">
                {(accounts as any[]).map((acc: any) => (
                  <button
                    key={acc.account_id}
                    onClick={() => { setSelectedAccount(acc); setAccountSearch(acc.account_number); }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 text-left transition-colors"
                  >
                    <div>
                      <p className="text-sm font-mono font-medium text-foreground">{acc.account_number}</p>
                      <p className="text-xs text-muted-foreground">{acc.account_type?.type_name} · {acc.currency?.currency_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-financial font-semibold text-foreground">{formatCurrency(Number(acc.balance))}</p>
                      <StatusBadge status={acc.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedAccount && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Selected Account</p>
                <p className="text-sm font-mono font-bold text-amber-900 dark:text-amber-200">{selectedAccount.account_number}</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Available: {formatCurrency(Number(selectedAccount.available_balance))}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              label="Amount (ETB)"
              type="number"
              step="0.01"
              min="1"
              placeholder="0.00"
              error={errors.amount?.message as string}
              {...register('amount', { required: 'Amount is required', min: { value: 1, message: 'Minimum 1 ETB' } })}
            />
            <FormInput
              label="Description (optional)"
              type="text"
              placeholder="Cash withdrawal"
              {...register('description')}
            />
            <button
              type="submit"
              disabled={!selectedAccount || withdrawMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <ArrowUpCircle className="w-4 h-4" />
              {withdrawMutation.isPending ? 'Processing…' : 'Process Withdrawal'}
            </button>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Customers Tab ─────────────────────────────────────────────────────────────
function CustomersTab() {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<any>({ defaultValues: { customer_type: 'INDIVIDUAL' } });
  const customerType = watch('customer_type');

  const { data, isLoading } = useQuery({
    queryKey: ['teller-customers', search],
    queryFn: async () => {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/customers?limit=20${q}`);
      return res.data.data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/customers', d),
    onSuccess: () => {
      toast('Customer created successfully', 'success');
      reset();
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['teller-customers'] });
    },
    onError: (err: any) => toast(err.response?.data?.message ?? 'Failed to create customer', 'error'),
  });

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, phone, email, national ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Customer
        </button>
      </div>

      {showCreate && (
        <SectionCard>
          <SectionHeader title="Register New Customer" />
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect label="Customer Type" error={errors.customer_type?.message as string} {...register('customer_type', { required: true })}>
              <option value="INDIVIDUAL">Individual</option>
              <option value="CORPORATE">Corporate</option>
              <option value="JOINT">Joint</option>
            </FormSelect>
            {customerType === 'INDIVIDUAL' || customerType === 'JOINT' ? (
              <>
                <FormInput label="First Name" {...register('first_name', { required: 'Required' })} error={errors.first_name?.message as string} />
                <FormInput label="Last Name" {...register('last_name', { required: 'Required' })} error={errors.last_name?.message as string} />
                <FormInput label="Date of Birth" type="date" {...register('date_of_birth')} />
                <FormInput label="National ID" {...register('national_id')} />
              </>
            ) : (
              <>
                <FormInput label="Company Name" {...register('company_name', { required: 'Required' })} error={errors.company_name?.message as string} />
                <FormInput label="Tax ID" {...register('tax_id')} />
                <FormInput label="Incorporation Date" type="date" {...register('incorporation_date')} />
              </>
            )}
            <FormInput label="Phone Number" {...register('phone_number', { required: 'Required' })} error={errors.phone_number?.message as string} />
            <FormInput label="Email" type="email" {...register('email')} />
            <FormInput label="Address" {...register('address', { required: 'Required' })} error={errors.address?.message as string} />
            <FormInput label="City" {...register('city', { required: 'Required' })} error={errors.city?.message as string} />
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); reset(); }} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {createMutation.isPending ? 'Creating…' : 'Create Customer'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard>
            <SectionHeader title="Customer List" sub={isLoading ? 'Loading…' : `${data?.length ?? 0} results`} />
            {isLoading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
            ) : (data ?? []).length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No customers found</div>
            ) : (
              <div className="divide-y divide-border">
                {(data ?? []).map((c: any) => (
                  <button
                    key={c.customer_id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-muted/40 text-left transition-colors ${selectedCustomer?.customer_id === c.customer_id ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {c.customer_type === 'CORPORATE' ? c.company_name : `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.phone_number} · {c.customer_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.kyc_status} />
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {selectedCustomer && (
          <SectionCard>
            <SectionHeader title="Customer Details" action={
              <button onClick={() => setSelectedCustomer(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            } />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedCustomer.customer_type === 'CORPORATE' ? selectedCustomer.company_name : `${selectedCustomer.first_name ?? ''} ${selectedCustomer.last_name ?? ''}`}
                  </p>
                  <StatusBadge status={selectedCustomer.kyc_status} />
                </div>
              </div>
              {[
                { label: 'Customer ID', value: `#${selectedCustomer.customer_id}` },
                { label: 'Type', value: selectedCustomer.customer_type },
                { label: 'Phone', value: selectedCustomer.phone_number },
                { label: 'Email', value: selectedCustomer.email ?? '—' },
                { label: 'City', value: selectedCustomer.city ?? '—' },
                { label: 'National ID', value: selectedCustomer.national_id ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground text-right max-w-[60%] break-all">{value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  KYC changes require Supervisor access
                </p>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

// ─── Accounts Tab ──────────────────────────────────────────────────────────────
function AccountsTab({ employeeId }: { employeeId: number }) {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const { data, isLoading } = useQuery({
    queryKey: ['teller-accounts', search],
    queryFn: async () => {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/accounts?limit=20${q}`);
      return res.data.data as any[];
    },
  });

  const { data: accountTypes } = useQuery({
    queryKey: ['account-types'],
    queryFn: async () => {
      const res = await api.get('/accounts/types');
      return res.data.data;
    },
  });

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const res = await api.get('/accounts/currencies');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/accounts', d),
    onSuccess: () => {
      toast('Account opened successfully', 'success');
      reset();
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['teller-accounts'] });
    },
    onError: (err: any) => toast(err.response?.data?.message ?? 'Failed to open account', 'error'),
  });

  const onSubmit = (d: any) => {
    createMutation.mutate({
      account_type_id: parseInt(d.account_type_id),
      currency_id: parseInt(d.currency_id),
      branch_id: parseInt(d.branch_id),
      customer_ids: [parseInt(d.customer_id)],
      opened_by_employee_id: employeeId,
      initial_deposit: d.initial_deposit ? parseFloat(d.initial_deposit) : undefined,
    });
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by account number or IBAN…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />Open Account
        </button>
      </div>

      {showCreate && (
        <SectionCard>
          <SectionHeader title="Open New Account" />
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Customer ID" type="number" {...register('customer_id', { required: 'Required' })} error={errors.customer_id?.message as string} />
            <FormSelect label="Account Type" {...register('account_type_id', { required: 'Required' })} error={errors.account_type_id?.message as string}>
              <option value="">Select type</option>
              {(accountTypes ?? []).map((t: any) => <option key={t.account_type_id} value={t.account_type_id}>{t.type_name}</option>)}
            </FormSelect>
            <FormSelect label="Currency" {...register('currency_id', { required: 'Required' })} error={errors.currency_id?.message as string}>
              <option value="">Select currency</option>
              {(currencies ?? []).map((c: any) => <option key={c.currency_id} value={c.currency_id}>{c.currency_code} - {c.currency_name}</option>)}
            </FormSelect>
            <FormInput label="Branch ID" type="number" {...register('branch_id', { required: 'Required' })} error={errors.branch_id?.message as string} />
            <FormInput label="Initial Deposit (optional)" type="number" step="0.01" min="0" {...register('initial_deposit')} />
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); reset(); }} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {createMutation.isPending ? 'Opening…' : 'Open Account'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard>
        <SectionHeader title="All Accounts" sub={isLoading ? 'Loading…' : `${data?.length ?? 0} results`} />
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
        ) : (data ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No accounts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {['Account Number', 'Type', 'Currency', 'Balance', 'Branch', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data ?? []).map((acc: any) => (
                  <tr key={acc.account_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{acc.account_number}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{acc.account_type?.type_name}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{acc.currency?.currency_code}</td>
                    <td className="px-4 py-3 font-financial font-semibold text-foreground text-sm">{formatCurrency(Number(acc.balance))}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{acc.branch?.branch_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={acc.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
function TransactionsTab() {
  const [filters, setFilters] = useState({ search: '', type: '', status: '', from: '', to: '' });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading } = useQuery({
    queryKey: ['teller-txns', applied],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (applied.search) params.set('search', applied.search);
      if (applied.type) params.set('transaction_type', applied.type);
      if (applied.status) params.set('status', applied.status);
      if (applied.from) params.set('from_date', applied.from);
      if (applied.to) params.set('to_date', applied.to);
      params.set('limit', '30');
      const res = await api.get(`/transactions?${params}`);
      return res.data.data as any[];
    },
  });

  return (
    <div className="p-5 space-y-4">
      <SectionCard>
        <SectionHeader title="Transaction Lookup" />
        <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <input type="text" placeholder="Reference / Account…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="col-span-2 md:col-span-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Types</option>
            {['DEPOSIT', 'WITHDRAWAL', 'INTERNAL_TRANSFER', 'INTERBANK_TRANSFER', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'UTILITY_PAYMENT', 'SERVICE_CHARGE'].map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Status</option>
            {['COMPLETED', 'PENDING', 'FAILED', 'REVERSED'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={() => setApplied(filters)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader title="Results" sub={isLoading ? 'Loading…' : `${data?.length ?? 0} transactions`} />
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
        ) : (data ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {['Reference', 'Type', 'Channel', 'Account', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className={`text-left px-4 py-2.5 text-xs font-medium text-muted-foreground ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data ?? []).map((txn: any) => (
                  <tr key={txn.transaction_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{txn.reference_number}</td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{txn.transaction_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{txn.channel?.toLowerCase()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{txn.from_account?.account_number ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-financial font-semibold text-foreground">
                      {txn.currency?.symbol ?? 'ETB'} {Number(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={txn.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(txn.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Loans Tab ────────────────────────────────────────────────────────────────
function LoansTab() {
  const [view, setView] = useState<'applications' | 'loans'>('applications');

  const { data: applications, isLoading: appLoading } = useQuery({
    queryKey: ['teller-applications'],
    queryFn: async () => {
      const res = await api.get('/loans/applications?limit=30');
      return res.data.data as any[];
    },
    enabled: view === 'applications',
  });

  const { data: loans, isLoading: loanLoading } = useQuery({
    queryKey: ['teller-loans'],
    queryFn: async () => {
      const res = await api.get('/loans?limit=30');
      return res.data.data as any[];
    },
    enabled: view === 'loans',
  });

  const isLoading = view === 'applications' ? appLoading : loanLoading;
  const rows = view === 'applications' ? (applications ?? []) : (loans ?? []);

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        {(['applications', 'loans'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${view === v ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {v}
          </button>
        ))}
        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <Eye className="w-3 h-3" /> Read-only — approvals require Supervisor+
        </span>
      </div>

      <SectionCard>
        <SectionHeader title={view === 'applications' ? 'Loan Applications' : 'Active Loans'} sub={`${rows.length} records`} />
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No records found</div>
        ) : view === 'applications' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {['ID', 'Customer', 'Type', 'Amount', 'Status', 'Applied'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((app: any) => (
                  <tr key={app.application_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{app.application_id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {app.customer?.first_name ? `${app.customer.first_name} ${app.customer.last_name}` : app.customer?.company_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{app.loan_type?.type_name ?? '—'}</td>
                    <td className="px-4 py-3 font-financial font-semibold text-foreground">{formatCurrency(Number(app.applied_amount))}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(new Date(app.application_date))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {['Loan ID', 'Customer', 'Principal', 'Outstanding', 'Status', 'Due Date'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((loan: any) => (
                  <tr key={loan.loan_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{loan.loan_id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {loan.customer?.first_name ? `${loan.customer.first_name} ${loan.customer.last_name}` : loan.customer?.company_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-financial font-semibold text-foreground">{formatCurrency(Number(loan.principal_amount))}</td>
                    <td className="px-4 py-3 font-financial text-foreground">{formatCurrency(Number(loan.outstanding_balance))}</td>
                    <td className="px-4 py-3"><StatusBadge status={loan.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{loan.maturity_date ? formatDate(new Date(loan.maturity_date)) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Cards Tab ────────────────────────────────────────────────────────────────
function CardsTab() {
  const [showIssue, setShowIssue] = useState(false);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const { data, isLoading } = useQuery({
    queryKey: ['teller-cards', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '20' });
      if (search) params.set('search', search);
      const res = await api.get(`/cards?${params}`);
      return res.data.data as any[];
    },
  });

  const issueMutation = useMutation({
    mutationFn: (d: any) => api.post('/cards', d),
    onSuccess: () => {
      toast('Card issued successfully', 'success');
      reset();
      setShowIssue(false);
      queryClient.invalidateQueries({ queryKey: ['teller-cards'] });
    },
    onError: (err: any) => toast(err.response?.data?.message ?? 'Failed to issue card', 'error'),
  });

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by card number or account…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <button onClick={() => setShowIssue(!showIssue)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />Issue Card
        </button>
      </div>

      {showIssue && (
        <SectionCard>
          <SectionHeader title="Issue New Card" />
          <form onSubmit={handleSubmit((d) => issueMutation.mutate({
            account_id: parseInt(d.account_id),
            card_type: d.card_type,
            network: d.network,
            daily_limit: d.daily_limit ? parseFloat(d.daily_limit) : undefined,
          }))} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Account ID" type="number" {...register('account_id', { required: 'Required' })} error={errors.account_id?.message as string} />
            <FormSelect label="Card Type" {...register('card_type', { required: 'Required' })} error={errors.card_type?.message as string}>
              <option value="">Select type</option>
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Credit</option>
              <option value="PREPAID">Prepaid</option>
            </FormSelect>
            <FormSelect label="Network" {...register('network', { required: 'Required' })} error={errors.network?.message as string}>
              <option value="">Select network</option>
              <option value="VISA">Visa</option>
              <option value="MASTERCARD">Mastercard</option>
              <option value="UNIONPAY">UnionPay</option>
            </FormSelect>
            <FormInput label="Daily Limit (optional)" type="number" step="0.01" placeholder="5000.00" {...register('daily_limit')} />
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowIssue(false); reset(); }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">Cancel</button>
              <button type="submit" disabled={issueMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {issueMutation.isPending ? 'Issuing…' : 'Issue Card'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard>
        <SectionHeader title="Card Registry" sub={`${data?.length ?? 0} cards`} />
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
        ) : (data ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No cards found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {['Card Number', 'Type', 'Network', 'Account', 'Expiry', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data ?? []).map((card: any) => (
                  <tr key={card.card_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      **** **** **** {card.card_number?.slice(-4) ?? '????'}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground capitalize">{card.card_type?.toLowerCase()}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{card.network}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{card.account?.account_number ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={card.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── ATM Tab ──────────────────────────────────────────────────────────────────
function AtmTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['teller-atm'],
    queryFn: async () => {
      const res = await api.get('/atm');
      return res.data.data as any[];
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
        <Eye className="w-3 h-3" /> Read-only view — modifications require Branch Manager+
      </div>
      <SectionCard>
        <SectionHeader title="ATM Network Status" sub="Live view — auto-refreshes every 60s" />
        {isLoading ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No ATMs found</div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data ?? []).map((atm: any) => (
              <div key={atm.atm_id}
                className={`rounded-xl border p-4 space-y-2 ${atm.status === 'ONLINE' ? 'border-emerald-200 dark:border-emerald-800/40' : atm.status === 'LOW_CASH' ? 'border-amber-200 dark:border-amber-800/40' : 'border-red-200 dark:border-red-800/40'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{atm.atm_code}</span>
                  </div>
                  <StatusBadge status={atm.status} />
                </div>
                <p className="text-xs text-muted-foreground">{atm.location}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Cash Level</span>
                  <span className={`font-financial font-semibold ${atm.status === 'LOW_CASH' || atm.status === 'OUT_OF_CASH' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                    {formatCurrency(Number(atm.current_cash ?? 0))}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${atm.status === 'ONLINE' ? 'bg-emerald-500' : atm.status === 'LOW_CASH' ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${atm.max_capacity > 0 ? Math.min(100, (Number(atm.current_cash ?? 0) / Number(atm.max_capacity)) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TellerPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (user?.role !== 'TELLER' && user?.role !== 'SUPERVISOR') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Shield className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground">Access restricted to Tellers and Supervisors.</p>
      </div>
    );
  }

  const employeeId = user?.linkedEmployeeId ?? 0;

  const tabProps: Record<Tab, React.ReactNode> = {
    overview:     <OverviewTab employeeId={employeeId} />,
    deposit:      <DepositTab employeeId={employeeId} />,
    withdrawal:   <WithdrawalTab employeeId={employeeId} />,
    customers:    <CustomersTab />,
    accounts:     <AccountsTab employeeId={employeeId} />,
    transactions: <TransactionsTab />,
    loans:        <LoansTab />,
    cards:        <CardsTab />,
    atm:          <AtmTab />,
  };

  return (
    <div className="space-y-0 animate-fade-in">
      {/* Page header */}
      <div className="page-header mb-0 pb-5">
        <div>
          <h1 className="page-title">Teller Operations</h1>
          <p className="page-subtitle">
            Front-office banking — {formatDate(new Date())} ·{' '}
            <span className="font-medium text-foreground">{user?.username}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Level 1 — Front-office
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="tabs-scroll border-b border-border -mx-1 px-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-0">
        {tabProps[activeTab]}
      </div>
    </div>
  );
}
