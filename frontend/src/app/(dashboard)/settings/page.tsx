'use client';

import { useState, type ElementType } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { Settings, Lock, Monitor, User, ChevronRight, CheckCircle2, AlertCircle, Eye, EyeOff, LogOut, Palette } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { cn } from '../../../lib/utils';
import { ThemeToggle } from '../../../components/ui/theme-toggle';

type SettingsTab = 'profile' | 'security' | 'sessions' | 'appearance';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('profile');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['settings-profile'],
    queryFn: async () => {
      const res = await api.get('/settings/profile');
      return res.data.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const pwMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.post('/settings/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      setPwSuccess('Password changed successfully!');
      setPwError('');
      reset();
      setTimeout(() => setPwSuccess(''), 4000);
    },
    onError: (e: any) => {
      setPwError(e?.response?.data?.message ?? 'Failed to change password');
      setPwSuccess('');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: number) => api.delete(`/settings/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings-profile'] }),
  });

  const tabs: { id: SettingsTab; label: string; icon: ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'sessions', label: 'Active Sessions', icon: Monitor },
  ];

  const infoRow = (label: string, value?: string | null) => (
    <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? '—'}</span>
    </div>
  );

  const linked = profile?.linked_customer ?? profile?.linked_employee;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account, security, and preferences</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    tab === t.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}>
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {tab !== t.id && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden">

          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <div>
              <div className="px-6 py-5 border-b border-border flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-foreground">
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{user?.username}</p>
                  <p className="text-sm text-muted-foreground">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account</h3>
                  {infoRow('Username', profile?.username)}
                  {infoRow('Role', profile?.role?.replace('_', ' '))}
                  {infoRow('Two-Factor Auth', profile?.two_factor_enabled ? 'Enabled' : 'Disabled')}
                  {infoRow('Account Locked', profile?.account_locked ? 'Yes' : 'No')}
                  {infoRow('Member Since', profile?.created_at ? formatDate(profile.created_at) : undefined)}
                  {infoRow('Last Login', profile?.last_login ? formatDate(profile.last_login) : undefined)}
                  {infoRow('Last Login IP', profile?.last_login_ip)}
                </div>

                {linked && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {profile?.linked_customer ? 'Customer Profile' : 'Employee Profile'}
                    </h3>
                    {isLoading ? (
                      <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-4 bg-muted rounded animate-pulse" />)}</div>
                    ) : profile?.linked_customer ? (
                      <>
                        {infoRow('Name', `${linked.first_name ?? ''} ${linked.last_name ?? ''}`.trim() || linked.company_name)}
                        {infoRow('Phone', linked.phone_number)}
                        {infoRow('Email', linked.email)}
                        {infoRow('City', linked.city)}
                        {infoRow('KYC Status', linked.kyc_status)}
                        {infoRow('Risk Profile', linked.risk_profile)}
                      </>
                    ) : (
                      <>
                        {infoRow('Name', `${linked.first_name} ${linked.last_name}`)}
                        {infoRow('Position', linked.position)}
                        {infoRow('Email', linked.email)}
                        {infoRow('Phone', linked.phone_number)}
                        {infoRow('Branch', linked.branch?.branch_name)}
                        {infoRow('Department', linked.department?.department_name)}
                        {infoRow('Employee Type', linked.employee_type)}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {tab === 'security' && (
            <div className="p-6">
              <h3 className="text-sm font-semibold mb-5">Change Password</h3>
              <form onSubmit={handleSubmit(d => pwMutation.mutate(d))} className="space-y-4 max-w-md">
                {pwSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400 px-4 py-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {pwSuccess}
                  </div>
                )}
                {pwError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400 px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {pwError}
                  </div>
                )}

                {[
                  { name: 'currentPassword' as const, label: 'Current Password', show: showCurrent, toggle: () => setShowCurrent(s => !s) },
                  { name: 'newPassword' as const, label: 'New Password', show: showNew, toggle: () => setShowNew(s => !s) },
                  { name: 'confirmPassword' as const, label: 'Confirm New Password', show: showNew, toggle: () => setShowNew(s => !s) },
                ].map(field => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{field.label}</label>
                    <div className="relative">
                      <input
                        type={field.show ? 'text' : 'password'}
                        {...register(field.name)}
                        className={cn(
                          'w-full rounded-lg border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-ring',
                          errors[field.name] ? 'border-destructive' : 'border-input'
                        )}
                      />
                      <button type="button" onClick={field.toggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors[field.name] && <p className="text-xs text-destructive">{errors[field.name]?.message}</p>}
                  </div>
                ))}

                <button type="submit" disabled={pwMutation.isPending}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
                  {pwMutation.isPending ? 'Changing…' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {tab === 'appearance' && (
            <div>
              <div className="px-6 py-5 border-b border-border">
                <h3 className="text-sm font-semibold">Appearance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customise how the dashboard looks on this device
                </p>
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Theme</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose a light or dark theme, or follow your system setting.
                    </p>
                  </div>
                  <ThemeToggle variant="segmented" />
                </div>
              </div>
            </div>
          )}

          {/* SESSIONS TAB */}
          {tab === 'sessions' && (
            <div>
              <div className="px-6 py-5 border-b border-border">
                <h3 className="text-sm font-semibold">Active Sessions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Revoke any sessions you don't recognise</p>
              </div>
              <div className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                    </div>
                  ))
                ) : (profile?.session ?? []).length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">No active sessions</p>
                ) : (
                  (profile?.session ?? []).map((s: any) => (
                    <div key={s.session_id} className="flex items-center justify-between px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {s.device_name ?? 'Unknown Device'}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.ip_address}</p>
                        <p className="text-xs text-muted-foreground">
                          Active {formatDate(s.last_active_at)} · Started {formatDate(s.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => revokeMutation.mutate(s.session_id)}
                        disabled={revokeMutation.isPending}
                        className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-md transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Revoke
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
