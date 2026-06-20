'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  /** Pass `{ type, title }` or shorthand `(title, type)`. */
  toast: (opts: Omit<Toast, 'id'> | string, type?: ToastType) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within Toaster');
  return ctx;
}

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/20',
  error: 'border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20',
  info: 'border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20',
};

const iconStyles: Record<ToastType, string> = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-blue-600',
};

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
    setTimeout(() => remove(id), 4500);
  }, [remove]);

  const toast = useCallback((titleOrOpts: Omit<Toast, 'id'> | string, type?: ToastType) => {
    if (typeof titleOrOpts === 'string') {
      add({ type: type ?? 'info', title: titleOrOpts });
      return;
    }
    add(titleOrOpts);
  }, [add]);

  const value: ToastContextValue = {
    toast,
    success: (title, description) => add({ type: 'success', title, description }),
    error: (title, description) => add({ type: 'error', title, description }),
    warning: (title, description) => add({ type: 'warning', title, description }),
    info: (title, description) => add({ type: 'info', title, description }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-slide-in-right',
                styles[toast.type]
              )}
            >
              <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', iconStyles[toast.type])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => remove(toast.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
