'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useToast } from '../../../../components/ui/toaster';
import { ArrowLeft, ChevronRight, User, Building2, Users, Save } from 'lucide-react';

type CustomerType = 'INDIVIDUAL' | 'CORPORATE' | 'JOINT';

function FormField({
  label, error, required, children,
}: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full px-3 py-2 rounded-lg border text-sm bg-background text-foreground
   focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors
   ${err ? 'border-red-400' : 'border-border'}`;

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customerType, setCustomerType] = useState<CustomerType>('INDIVIDUAL');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<any>({
    defaultValues: { customer_type: 'INDIVIDUAL' },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/customers', data),
    onSuccess: (res) => {
      toast('Customer created successfully', 'success');
      router.push(`/customers/${res.data.data.customer_id}`);
    },
    onError: (err: any) => toast(err.response?.data?.message ?? 'Failed to create customer', 'error'),
  });

  const onSubmit = (data: any) => {
    const payload: any = {
      customer_type: customerType,
      phone_number: data.phone_number,
      address: data.address,
      city: data.city,
      ...(data.email && { email: data.email }),
    };
    if (customerType === 'INDIVIDUAL' || customerType === 'JOINT') {
      payload.first_name = data.first_name;
      payload.last_name = data.last_name;
      if (data.date_of_birth) payload.date_of_birth = data.date_of_birth;
      if (data.national_id) payload.national_id = data.national_id;
    } else {
      payload.company_name = data.company_name;
      if (data.tax_id) payload.tax_id = data.tax_id;
      if (data.incorporation_date) payload.incorporation_date = data.incorporation_date;
    }
    createMutation.mutate(payload);
  };

  const TYPE_OPTIONS: { value: CustomerType; label: string; sub: string; icon: React.ElementType }[] = [
    { value: 'INDIVIDUAL', label: 'Individual', sub: 'Personal banking customer', icon: User },
    { value: 'CORPORATE', label: 'Corporate', sub: 'Business / company account', icon: Building2 },
    { value: 'JOINT', label: 'Joint', sub: 'Shared account holders', icon: Users },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/customers" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Customers
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">New Customer</span>
      </div>

      <div>
        <h1 className="page-title">Register New Customer</h1>
        <p className="page-subtitle">Create a new customer record in the system</p>
      </div>

      {/* Customer type selector */}
      <div className="rounded-xl border bg-card shadow-sm p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Customer Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TYPE_OPTIONS.map(({ value, label, sub, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCustomerType(value)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
                ${customerType === value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:border-primary/40'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                ${customerType === value ? 'bg-primary/10' : 'bg-muted'}`}>
                <Icon className={`w-5 h-5 ${customerType === value ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${customerType === value ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Individual / Joint fields */}
        {(customerType === 'INDIVIDUAL' || customerType === 'JOINT') && (
          <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="First Name" required error={errors.first_name?.message as string}>
                <input {...register('first_name', { required: 'First name is required' })}
                  className={inputCls(errors.first_name?.message as string)} placeholder="e.g. Yonas" />
              </FormField>
              <FormField label="Last Name" required error={errors.last_name?.message as string}>
                <input {...register('last_name', { required: 'Last name is required' })}
                  className={inputCls(errors.last_name?.message as string)} placeholder="e.g. Bekele" />
              </FormField>
              <FormField label="Date of Birth">
                <input type="date" {...register('date_of_birth')} className={inputCls()} />
              </FormField>
              <FormField label="National ID">
                <input {...register('national_id')} className={inputCls()} placeholder="ETH/1234/5678" />
              </FormField>
            </div>
          </div>
        )}

        {/* Corporate fields */}
        {customerType === 'CORPORATE' && (
          <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Company Name" required error={errors.company_name?.message as string} >
                <input {...register('company_name', { required: 'Company name is required' })}
                  className={inputCls(errors.company_name?.message as string)} placeholder="e.g. Acme PLC" />
              </FormField>
              <FormField label="Tax ID">
                <input {...register('tax_id')} className={inputCls()} placeholder="TIN / VAT number" />
              </FormField>
              <FormField label="Incorporation Date">
                <input type="date" {...register('incorporation_date')} className={inputCls()} />
              </FormField>
            </div>
          </div>
        )}

        {/* Contact & Location */}
        <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Contact & Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone Number" required error={errors.phone_number?.message as string}>
              <input {...register('phone_number', { required: 'Phone number is required', minLength: { value: 10, message: 'Min 10 digits' } })}
                className={inputCls(errors.phone_number?.message as string)} placeholder="+251 9XX XXX XXX" />
            </FormField>
            <FormField label="Email Address">
              <input type="email" {...register('email')}
                className={inputCls()} placeholder="email@example.com" />
            </FormField>
            <FormField label="Address" required error={errors.address?.message as string}>
              <input {...register('address', { required: 'Address is required', minLength: { value: 5, message: 'Too short' } })}
                className={inputCls(errors.address?.message as string)} placeholder="Street / Kebele / Woreda" />
            </FormField>
            <FormField label="City" required error={errors.city?.message as string}>
              <input {...register('city', { required: 'City is required' })}
                className={inputCls(errors.city?.message as string)} placeholder="e.g. Addis Ababa" />
            </FormField>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/customers"
            className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold
                       hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Creating…' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
