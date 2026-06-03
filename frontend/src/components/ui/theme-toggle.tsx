'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '../../lib/utils';

type Variant = 'icon' | 'segmented' | 'sidebar';

const options = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export function ThemeToggle({
  variant = 'icon',
  collapsed = false,
  className,
}: {
  variant?: Variant;
  collapsed?: boolean;
  className?: string;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch: render a neutral placeholder until mounted.
  if (!mounted) {
    return (
      <div
        aria-hidden
        className={cn(
          variant === 'segmented'
            ? 'h-9 w-[132px] rounded-lg bg-muted'
            : 'h-9 w-9 rounded-lg bg-muted',
          className
        )}
      />
    );
  }

  // Segmented control: Light / Dark / System
  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Theme"
        className={cn(
          'inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1',
          className
        )}
      >
        {options.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={opt.label}
              title={opt.label}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <opt.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const next = isDark ? 'light' : 'dark';

  // Sidebar variant: full-width row matching `.sidebar-item` styling.
  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        title={collapsed ? `Switch to ${next} mode` : undefined}
        aria-label={`Switch to ${next} mode`}
        className={cn('sidebar-item w-full', collapsed && 'justify-center px-0', className)}
      >
        {isDark ? (
          <Sun className="h-4.5 w-4.5 flex-shrink-0" />
        ) : (
          <Moon className="h-4.5 w-4.5 flex-shrink-0" />
        )}
        {!collapsed && <span className="truncate">{isDark ? 'Light mode' : 'Dark mode'}</span>}
      </button>
    );
  }

  // Default icon button.
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border',
        'bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
