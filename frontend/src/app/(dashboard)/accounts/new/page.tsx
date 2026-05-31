'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { useRouter } from 'next/navigation';
import { Banknote, Building, Users, Save, ArrowLeft, Coins } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '../../../../store/auth.store';

type AccountFormData = {
  account_type_id: string;
  currency_id: string;
  branch_id: string;
  customer_ids: string[];
  initial_deposit: number;
};

export default function NewAccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AccountFormData>({
    defaultValues: {
      customer_ids: [],
      initial_deposit: 0,
    }
  });

  const { data: lookups, isLoading: loadingLookups } = useQuery({
    queryKey: ['settings-lookups'],
    queryFn: async () => {
      const res = await api.get('/settings/lookups');
      return res.data.data;
    },
  });

  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await api.get('/customers?limit=100');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        account_type_id: parseInt(data.account_type_id),
        currency_id: parseInt(data.currency_id),
        branch_id: parseInt(data.branch_id),
        customer_ids: data.customer_ids.map((id: string) => parseInt(id)),
        initial_deposit: parseFloat(data.initial_deposit),
      };
      const res = await api.post('/accounts', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      router.push('/accounts');
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to open account');
    },
  });

  const onSubmit = (data: AccountFormData) => {
    setErrorMsg('');
    if (!data.customer_ids || data.customer_ids.length === 0) {
      setErrorMsg('Please select at least one customer');
      return;
    }
    createMutation.mutate(data);
  };

  if (loadingLookups || loadingCustomers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { accountTypes = [], currencies = [], branches = [] } = lookups || {};
  const customers = customersData || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 page-header">
        <Link href="/accounts" className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Open New Account</h1>
          <p className="page-subtitle">Create a new bank account for a customer</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <Banknote className="w-4 h-4 text-muted-foreground" />
                  Account Type
                </label>
                <select
                  {...register('account_type_id', { required: 'Account type is required' })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select account type...</option>
                  {accountTypes.map((type: any) => (
                    <option key={type.account_type_id} value={type.account_type_id}>
                      {type.type_name}
                    </option>
                  ))}
                </select>
                {errors.account_type_id && <p className="text-xs text-destructive">{errors.account_type_id.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  Currency
                </label>
                <select
                  {...register('currency_id', { required: 'Currency is required' })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select currency...</option>
                  {currencies.map((curr: any) => (
                    <option key={curr.currency_id} value={curr.currency_id}>
                      {curr.currency_code} ({curr.symbol})
                    </option>
                  ))}
                </select>
                {errors.currency_id && <p className="text-xs text-destructive">{errors.currency_id.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Customer(s)
                </label>
                <p className="text-xs text-muted-foreground mb-2">Hold Ctrl/Cmd to select multiple customers for a joint account</p>
                <select
                  multiple
                  {...register('customer_ids', { required: 'At least one customer is required' })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                >
                  {customers.map((c: any) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_code} - {c.customer_type === 'CORPORATE' ? c.company_name : `${c.first_name} ${c.last_name}`}
                    </option>
                  ))}
                </select>
                {errors.customer_ids && <p className="text-xs text-destructive">{errors.customer_ids.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  Branch
                </label>
                <select
                  {...register('branch_id', { required: 'Branch is required' })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select branch...</option>
                  {branches.map((b: any) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.branch_name} ({b.branch_code})
                    </option>
                  ))}
                </select>
                {errors.branch_id && <p className="text-xs text-destructive">{errors.branch_id.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  Initial Deposit
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('initial_deposit', { required: 'Initial deposit is required', min: 0 })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
                {errors.initial_deposit && <p className="text-xs text-destructive">{errors.initial_deposit.message}</p>}
              </div>

            </div>

            <div className="pt-6 mt-6 border-t border-border flex justify-end gap-3">
              <Link href="/accounts"
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSubmitting ? 'Creating...' : 'Open Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
