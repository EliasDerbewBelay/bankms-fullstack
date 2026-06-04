'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, cn } from '../../../lib/utils';
import {
  ArrowLeftRight, Users, Wallet, Building2, ArrowRight,
  Loader2, CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';
import { useToast } from '../../../components/ui/toaster';

type Mode = 'internal' | 'beneficiary' | 'interbank';

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
  bank_code?: string;
  is_active: boolean;
}

interface Bank {
  bank_id: number;
  bank_name: string;
  bank_code: string;
  swift_code?: string;
  city?: string;
  country?: string;
}

const MODES = [
  { id: 'internal' as Mode, label: 'My Accounts', icon: Wallet, subtitle: 'Move between your own accounts' },
  { id: 'beneficiary' as Mode, label: 'Saved Beneficiary', icon: Users, subtitle: 'Pay a saved contact' },
  { id: 'interbank' as Mode, label: 'Other Bank', icon: Building2, subtitle: 'Transfer to any bank' },
];

export default function TransfersPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>('internal');
  const [step, setStep] = useState<1 | 2>(1);

  // Shared fields
  const [fromId, setFromId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Internal
  const [toId, setToId] = useState('');

  // Beneficiary
  const [beneficiaryId, setBeneficiaryId] = useState('');

  // Interbank
  const [toBankCode, setToBankCode] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [toAccountName, setToAccountName] = useState('');

  // ── Data fetching ──────────────────────────────────────────
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
    enabled: mode === 'beneficiary',
  });

  const { data: banks = [], isLoading: loadingBanks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const r = await api.get('/transactions/banks');
      return r.data.data as Bank[];
    },
    enabled: mode === 'interbank',
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived state ─────────────────────────────────────────
  const fromAccount = useMemo(() => accounts.find((a) => String(a.account_id) === fromId), [accounts, fromId]);
  const toAccount = useMemo(() => accounts.find((a) => String(a.account_id) === toId), [accounts, toId]);
  const beneficiary = useMemo(() => beneficiaries.find((b) => String(b.beneficiary_id) === beneficiaryId), [beneficiaries, beneficiaryId]);
  const selectedBank = useMemo(() => banks.find((b) => b.bank_code === toBankCode), [banks, toBankCode]);

  const available = Number(fromAccount?.account.available_balance ?? 0);
  const amountNum = Number(amount);
  const insufficient = amountNum > 0 && amountNum > available;

  const destinationReady = useMemo(() => {
    if (mode === 'internal') return !!toId && toId !== fromId;
    if (mode === 'beneficiary') return !!beneficiaryId;
    return !!toBankCode && toAccountNumber.length >= 5 && toAccountName.length >= 2;
  }, [mode, toId, fromId, beneficiaryId, toBankCode, toAccountNumber, toAccountName]);

  const canReview = !!fromId && destinationReady && amountNum > 0 && !insufficient;

  // ── Mutation ──────────────────────────────────────────────
  const reset = () => {
    setStep(1);
    setFromId(''); setToId(''); setBeneficiaryId('');
    setToBankCode(''); setToAccountNumber(''); setToAccountName('');
    setAmount(''); setDescription('');
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
      if (mode === 'beneficiary') {
        return api.post('/transactions/transfer/beneficiary', {
          from_account_id: Number(fromId),
          beneficiary_id: Number(beneficiaryId),
          amount: amountNum,
          description: description || undefined,
        });
      }
      // interbank
      return api.post('/transactions/transfer/interbank', {
        from_account_id: Number(fromId),
        to_bank_code: toBankCode,
        to_account_number: toAccountNumber,
        to_account_name: toAccountName,
        amount: amountNum,
        description: description || undefined,
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['my-accounts-transfer'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transfer submitted', `Reference: ${res.data.data?.reference_number ?? ''}`);
      reset();
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Transfer failed');
      setStep(1);
    },
  });

  const switchMode = (m: Mode) => {
    setMode(m); setStep(1);
    setToId(''); setBeneficiaryId('');
    setToBankCode(''); setToAccountNumber(''); setToAccountName('');
  };

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

  // ── Review summary rows ───────────────────────────────────
  const reviewRows: [string, string][] = (() => {
    const base: [string, string][] = [
      ['Amount', formatCurrency(amountNum, fromAccount?.account.currency?.currency_code, fromAccount?.account.currency?.symbol)],
      ['From account', fromAccount?.account.account_number ?? '—'],
    ];
    if (mode === 'internal') {
      base.push(['To account', toAccount?.account.account_number ?? '—']);
      base.push(['Transfer type', 'Internal (instant)']);
    } else if (mode === 'beneficiary' && beneficiary) {
      base.push(['Recipient', beneficiary.beneficiary_name]);
      base.push(['Account / IBAN', beneficiary.account_number_or_iban]);
      if (beneficiary.bank_name) base.push(['Bank', beneficiary.bank_name]);
      base.push(['Transfer type', 'To saved beneficiary']);
    } else if (mode === 'interbank') {
      base.push(['Recipient name', toAccountName]);
      base.push(['Recipient account', toAccountNumber]);
      base.push(['Destination bank', selectedBank?.bank_name ?? toBankCode]);
      if (selectedBank?.swift_code) base.push(['SWIFT / BIC', selectedBank.swift_code]);
      base.push(['Transfer type', 'Interbank transfer']);
    }
    if (description) base.push(['Note', description]);
    return base;
  })();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transfer Money</h1>
          <p className="page-subtitle">Move funds between accounts, pay a beneficiary, or send to any bank</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((t) => (
          <button
            key={t.id}
            onClick={() => switchMode(t.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3.5 text-left transition-all',
              mode === t.id
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-border bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <t.icon className="h-5 w-5" />
            <span className="text-xs font-semibold">{t.label}</span>
            <span className="text-[10px] text-center leading-tight opacity-70">{t.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {loadingAccounts ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-11 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : step === 1 ? (
          /* ── STEP 1: Form ─────────────────────────────────────── */
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

            {/* ── Internal: destination account ── */}
            {mode === 'internal' && (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">To account</label>
                <select value={toId} onChange={(e) => setToId(e.target.value)} className={inputClass}>
                  <option value="">Select destination account…</option>
                  {accounts.filter((a) => String(a.account_id) !== fromId).map((a) => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.account.account_number} — {a.account.account_type?.type_name ?? ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ── Beneficiary picker ── */}
            {mode === 'beneficiary' && (
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

            {/* ── Interbank fields ── */}
            {mode === 'interbank' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-900/20 flex items-start gap-2 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Interbank transfers are processed during banking hours and may take 1–3 business days to reflect at the recipient's bank.
                </div>

                {/* Bank selection */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Destination bank <span className="text-destructive">*</span></label>
                  {loadingBanks ? (
                    <div className="h-11 bg-muted rounded-lg animate-pulse" />
                  ) : (
                    <select value={toBankCode} onChange={(e) => setToBankCode(e.target.value)} className={inputClass}>
                      <option value="">Select destination bank…</option>
                      {banks.map((b) => (
                        <option key={b.bank_code} value={b.bank_code}>
                          {b.bank_name}{b.city ? ` — ${b.city}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedBank?.swift_code && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      SWIFT / BIC: <span className="font-mono font-medium text-foreground">{selectedBank.swift_code}</span>
                    </p>
                  )}
                </div>

                {/* Account number / IBAN */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">
                    Recipient account number / IBAN <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={toAccountNumber}
                    onChange={(e) => setToAccountNumber(e.target.value.replace(/\s/g, '').toUpperCase())}
                    placeholder="e.g. ET12345678901234"
                    className={cn(inputClass, 'font-mono')}
                    maxLength={34}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Minimum 5 characters · Max 34 characters (IBAN format)</p>
                </div>

                {/* Recipient name */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">
                    Recipient full name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={toAccountName}
                    onChange={(e) => setToAccountName(e.target.value)}
                    placeholder="e.g. Abebe Kebede"
                    className={inputClass}
                    maxLength={200}
                  />
                </div>
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
                className={cn(inputClass, insufficient && 'border-destructive focus:ring-destructive/40')}
              />
              {fromAccount && (
                <p className={cn('text-xs mt-1', insufficient ? 'text-destructive' : 'text-muted-foreground')}>
                  Available: {formatCurrency(available, fromAccount.account.currency?.currency_code, fromAccount.account.currency?.symbol)}
                  {insufficient ? ' — insufficient balance' : ''}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Invoice payment, tuition fee…"
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
          /* ── STEP 2: Review & Confirm ─────────────────────────── */
          <div className="space-y-5">
            {/* Visual summary header */}
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">From</p>
                <p className="font-mono text-sm font-semibold text-foreground mt-0.5">
                  {fromAccount?.account.account_number}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <ArrowLeftRight className="h-4 w-4 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">To</p>
                <p className="font-mono text-sm font-semibold text-foreground mt-0.5">
                  {mode === 'internal' && toAccount?.account.account_number}
                  {mode === 'beneficiary' && beneficiary?.beneficiary_name}
                  {mode === 'interbank' && (toAccountName || toAccountNumber)}
                </p>
              </div>
            </div>

            {/* Amount display */}
            <div className="text-center py-2">
              <p className="text-3xl font-bold font-financial tabular-nums text-foreground">
                {formatCurrency(amountNum, fromAccount?.account.currency?.currency_code, fromAccount?.account.currency?.symbol)}
              </p>
            </div>

            {/* Detail rows */}
            <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border">
              {reviewRows.map(([label, val]) => (
                <div key={label} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground text-right max-w-[55%] break-words">{val}</span>
                </div>
              ))}
            </div>

            {/* Warning for irreversible transfers */}
            {(mode === 'beneficiary' || mode === 'interbank') && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {mode === 'interbank'
                  ? 'Interbank transfers are final once submitted. Ensure the bank, account number, and recipient name are correct before confirming.'
                  : 'Transfers to external beneficiaries cannot be reversed once submitted. Please confirm all details are correct.'}
              </div>
            )}

            <div className="flex justify-between gap-3 pt-1">
              <button
                onClick={() => setStep(1)}
                disabled={transferMutation.isPending}
                className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                ← Back
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
