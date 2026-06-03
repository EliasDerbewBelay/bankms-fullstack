'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Building2, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { cn } from '../../../lib/utils';
import { ThemeToggle } from '../../../components/ui/theme-toggle';

const loginSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      await login(data.username, data.password);
      router.replace('/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'An error occurred. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 left-1/2 w-64 h-64 rounded-full bg-teal-500/10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">AASTU Bank</p>
              <p className="text-white/50 text-xs">Management System</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Enterprise Banking
              <br />
              <span className="text-teal-400">Made Efficient.</span>
            </h1>
            <p className="mt-4 text-white/60 text-sm leading-relaxed max-w-sm">
              A fully normalized, BCNF-compliant bank management platform supporting
              multi-branch operations, digital banking, and real-time transaction
              processing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tables', value: '34' },
              { label: 'Modules', value: '12+' },
              { label: 'Accounts', value: 'Multi-currency' },
              { label: 'Security', value: 'BCNF + 2FA' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/5 border border-white/10 p-4"
              >
                <p className="text-teal-400 font-bold text-xl">{item.value}</p>
                <p className="text-white/50 text-xs mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-white/30 text-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>Secured with Argon2id + JWT + TOTP 2FA</span>
        </div>
      </div>

      {/* Right login form */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
          <ThemeToggle variant="icon" />
        </div>
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground">AASTU Bank MS</p>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="e.g. abebe.girma"
                {...register('username')}
                className={cn(
                  'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm',
                  'placeholder:text-muted-foreground outline-none transition-all',
                  'focus:ring-2 focus:ring-ring focus:border-ring',
                  errors.username ? 'border-destructive' : 'border-input'
                )}
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={cn(
                    'w-full rounded-lg border bg-background px-3.5 py-2.5 pr-10 text-sm',
                    'placeholder:text-muted-foreground outline-none transition-all',
                    'focus:ring-2 focus:ring-ring focus:border-ring',
                    errors.password ? 'border-destructive' : 'border-input'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5',
                'bg-primary text-primary-foreground text-sm font-medium',
                'transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Role hints for development */}
          <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Dev credentials
            </p>
            {[
              { role: 'Admin', user: 'abebe.girma' },
              { role: 'Manager', user: 'tigist.alemu' },
              { role: 'Supervisor', user: 'dawit.kebede' },
              { role: 'Teller', user: 'yonas.bekele' },
              { role: 'Customer', user: 'meron.tadesse' },
            ].map((c) => (
              <div key={c.role} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.role}</span>
                <span className="font-mono text-foreground">{c.user}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Password: <span className="font-mono">placeholder123</span> (update in DB)
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            AASTU Bank Management System © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
