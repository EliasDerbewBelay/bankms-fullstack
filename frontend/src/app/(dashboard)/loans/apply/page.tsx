'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuthStore } from '../../../../store/auth.store';
import { useToast } from '../../../../components/ui/toaster';
import { ArrowLeft, FileText, Loader2, Send } from 'lucide-react';

const LOAN_TYPES = ['PERSONAL', 'HOME', 'AUTO', 'CORPORATE', 'EDUCATION', 'AGRICULTURE', 'EMERGENCY'];

const TERM_PRESETS = [6, 12, 24, 36, 48, 60];

export default function LoanApplyPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuthStore();
  const isCustomer = user?.role === 'CUSTOMER';

  const [loanType, setLoanType] = useState('PERSONAL');
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('12');
  const [purpose, setPurpose] = useState('');
  const [customerId, setCustomerId] = useState('');

  const resolvedCustomerId = isCustomer ? user?.linkedCustomerId : Number(customerId) || undefined;

  const amountNum = Number(amount);
  const termNum = Number(term);
  const canSubmit =
    !!resolvedCustomerId &&
    !!loanType &&
    amountNum > 0 &&
    termNum > 0 &&
    purpose.trim().length >= 5;

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/loans/applications', {
        customer_id: resolvedCustomerId,
        loan_type: loanType,
        requested_amount: amountNum,
        requested_term_months: termNum,
        purpose: purpose.trim(),
      }),
    onSuccess: (res) => {
      toast.success(
        'Application submitted',
        `Reference: ${res.data.data?.application_number ?? ''}`
      );
      router.push('/loans');
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Failed to submit application'),
  });

  // Rough monthly estimate for guidance only (indicative 12% p.a.).
  const indicativeMonthly =
    amountNum > 0 && termNum > 0
      ? (amountNum * (0.12 / 12) * Math.pow(1 + 0.12 / 12, termNum)) /
        (Math.pow(1 + 0.12 / 12, termNum) - 1)
      : 0;

  const inputClass =
    'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <Link
          href="/loans"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Loans
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Apply for a Loan</h1>
            <p className="page-subtitle">Submit a new loan application for review</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        {!isCustomer && (
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Customer ID <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Enter the applicant's customer ID"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-foreground block mb-1.5">
            Loan type <span className="text-destructive">*</span>
          </label>
          <select value={loanType} onChange={(e) => setLoanType(e.target.value)} className={inputClass}>
            {LOAN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground block mb-1.5">
            Requested amount <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground block mb-1.5">
            Term (months) <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {TERM_PRESETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTerm(String(t))}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  term === String(t)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent'
                )}
              >
                {t} mo
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground block mb-1.5">
            Purpose <span className="text-destructive">*</span>
          </label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={3}
            placeholder="Describe what this loan will be used for (min. 5 characters)"
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        {amountNum > 0 && termNum > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Indicative monthly payment</span>
              <span className="font-financial font-medium text-foreground">
                {formatCurrency(indicativeMonthly)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Estimate only (assumes ~12% p.a.). The final rate is set on approval.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Link
            href="/loans"
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
            ) : (
              <><Send className="h-4 w-4" /> Submit application</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
