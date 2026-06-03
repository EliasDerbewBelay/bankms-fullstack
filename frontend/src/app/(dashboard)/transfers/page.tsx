'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, cn } from '../../../lib/utils';
import { ArrowLeftRight, Users, Wallet, ArrowRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../components/ui/toaster';

type Mode = 'internal' | 'beneficiary';

interface OwnedAccount {
  account_id: number;
  account: {
    account_number: string;
    available_balance: string | number;
    currency_id: number;
    currency?: { currency_code: string; symbol: string };
    account_type?: { type_name: string };
  };
}

interface Beneficiary {
  beneficiary_id: number;
  beneficiary_name: string;
  account_number_or_iban: string;
  bank_name?: string;
  is_active: boolean;
}

export default function TransfersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('internal');
  const [step, setStep] = useState<1 | 2>(1);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['my-accounts-transfer'],
    queryFn: async () => {
      const r = await api.get('/accounts/my');
      return r.data.data as OwnedAccount[];
    },
  });

  const { data: beneficiaries = [] } = useQuery({
    queryKey: ['beneficiaries-transfer'],
    queryFn: async () => {
      const r = await api.get('/beneficiaries');
      return (r.data.data as Beneficiary[]).filter((b) => b.is_active);
    },
  });

  const fromAccount = useMemo(
    () => accounts.find((a) => String(a.account_id) === fromId),
    [accounts, fromId]
  );
  const toAccount = useMemo(
    () => accounts.find((a) => String(a.account_id) === toId),
    [accounts, toId]
  );
  const beneficiary = useMemo(
    () => beneficiaries.find((b) => String(b.beneficiary_id) === beneficiaryId),
    [beneficiaries, beneficiaryId]
  );

  const available = Number(fromAccount?.account.available_balance ?? 0);
  const amountNum = Number(amount);
  const insufficient = amountNum > available;

  const destinationReady = mode === 'internal' ? !!toId && toId !== fromId : !!beneficiaryId;
  const canReview = !!fromId && destinationReady && amountNum > 0 && !insufficient;

  const reset = () => {
    setStep(1);
    setFromId('');
    setToId('');
    setBeneficiaryId('');
    setAmount('');
    setDescription('');
  };

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'internal') {
        return api.post('/transactions/transfer', {
          from_account_id: Number(fromId),
          to_account_id: Number(toId),
          amount: amountNum,
          currency_id: fromAccount!.account.currency_id,
          description: description || undefined,
        });
      }
      return api.post('/transactions/transfer/beneficiary', {
        from_account_id: Number(fromId),
        beneficiary_id: Number(beneficiaryId),
        amount: amountNum,
        description: description || undefined,
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['my-accounts-transfer'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transfer successful', `Reference: ${res.data.data?.reference_number ?? ''}`);
      reset();
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Transfer failed');
      setStep(1);
    },
  });

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep(1);
    setToId('');
    setBeneficiaryId('');
  };

  const inputClass =
    'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transfer Money</h1>
          <p className="page-subtitle">Move funds between your accounts or pay a saved beneficiary</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
        {([
          { id: 'internal', label: 'Between my accounts', icon: Wallet },
          { id: 'beneficiary', label: 'To a beneficiary', icon: Users },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => switchMode(t.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              mode === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {loadingAccounts ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-11 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            {/* From */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">From account</label>
              <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={inputClass}>
                <option value="">Select your account…</option>
                {accounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>
                    {a.account.account_number} — {formatCurrency(Number(a.account.available_balance), a.account.currency?.currency_code, a.account.currency?.symbol)}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination */}
            {mode === 'internal' ? (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">To account</label>
                <select value={toId} onChange={(e) => setToId(e.target.value)} className={inputClass}>
                  <option value="">Select destination account…</option>
                  {accounts
                    .filter((a) => String(a.account_id) !== fromId)
                    .map((a) => (
                      <option key={a.account_id} value={a.account_id}>
                        {a.account.account_number} — {a.account.account_type?.type_name ?? ''}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Beneficiary</label>
                {beneficiaries.length === 0 ? (
                  <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border px-3 py-4 text-center">
                    No active beneficiaries. Add one from the Beneficiaries page first.
                  </p>
                ) : (
                  <select value={beneficiaryId} onChange={(e) => setBeneficiaryId(e.target.value)} className={inputClass}>
                    <option value="">Select beneficiary…</option>
                    {beneficiaries.map((b) => (
                      <option key={b.beneficiary_id} value={b.beneficiary_id}>
                        {b.beneficiary_name} — {b.account_number_or_iban}{b.bank_name ? ` (${b.bank_name})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={cn(inputClass, insufficient && amount && 'border-destructive')}
              />
              {fromAccount && (
                <p className={cn('text-xs mt-1', insufficient && amount ? 'text-destructive' : 'text-muted-foreground')}>
                  Available: {formatCurrency(available, fromAccount.account.currency?.currency_code, fromAccount.account.currency?.symbol)}
                  {insufficient && amount ? ' — insufficient balance' : ''}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Rent payment"
                maxLength={255}
                className={inputClass}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setStep(2)}
                disabled={!canReview}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Review transfer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Review step */
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-mono text-sm font-medium text-foreground">{fromAccount?.account.account_number}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <ArrowLeftRight className="h-4 w-4 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-mono text-sm font-medium text-foreground">
                  {mode === 'internal' ? toAccount?.account.account_number : beneficiary?.beneficiary_name}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              {[
                ['Amount', formatCurrency(amountNum, fromAccount?.account.currency?.currency_code, fromAccount?.account.currency?.symbol)],
                ['Type', mode === 'internal' ? 'Internal transfer' : 'Transfer to beneficiary'],
                ...(mode === 'beneficiary' && beneficiary
                  ? [['Destination', `${beneficiary.account_number_or_iban}${beneficiary.bank_name ? ` · ${beneficiary.bank_name}` : ''}`] as [string, string]]
                  : []),
                ['Description', description || '—'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground text-right">{val}</span>
                </div>
              ))}
            </div>

            {mode === 'beneficiary' && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Transfers to external beneficiaries cannot be reversed once submitted. Please confirm the details are correct.
              </div>
            )}

            <div className="flex justify-between gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={transferMutation.isPending}
                className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => transferMutation.mutate()}
                disabled={transferMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {transferMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Confirm transfer</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
