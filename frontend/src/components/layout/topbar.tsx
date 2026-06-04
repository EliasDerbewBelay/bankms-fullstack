'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn, getInitials } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { ThemeToggle } from '../ui/theme-toggle';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/accounts': 'Accounts',
  '/transactions': 'Transactions',
  '/transfers': 'Transfer Money',
  '/loans': 'Loans',
  '/cards': 'Cards',
  '/customers': 'Customers',
  '/atm': 'ATM Network',
  '/teller': 'Teller Operations',
  '/supervisor': 'Supervisor Operations',
  '/branch-manager': 'Branch Manager Operations',
  '/disputes': 'Disputes',
  '/reports': 'Reports',
  '/admin': 'Administration',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/beneficiaries': 'Beneficiaries',
  '/refunds': 'Refunds',
  '/utility-payments': 'Utility Payments',
};

function resolveTitle(pathname: string): string {
  const match = Object.keys(PAGE_TITLES)
    .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : 'CoreBank MS';
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.profile
    ? 'first_name' in (user.profile as any)
      ? `${(user.profile as any).first_name} ${(user.profile as any).last_name}`.trim()
      : (user.profile as any).company_name ?? user.username
    : user?.username ?? '';

  const roleLabel = user?.role?.replace(/_/g, ' ') ?? '';
  const isNotificationsActive =
    pathname === '/notifications' || pathname.startsWith('/notifications/');

  // Close the menu on outside click or Escape.
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Close the menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace('/login');
  };

  const iconButton =
    'relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border ' +
    'bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ' +
    'focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      {/* Current page context */}
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-foreground">
          {resolveTitle(pathname)}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <ThemeToggle variant="icon" />

        <Link
          href="/notifications"
          aria-label="Notifications"
          title="Notifications"
          className={cn(
            iconButton,
            isNotificationsActive && 'border-primary/30 bg-primary/10 text-primary'
          )}
        >
          <Bell className="h-4 w-4" />
        </Link>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        {/* User profile dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-transparent px-1.5 py-1 transition-colors',
              'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring',
              menuOpen && 'bg-accent'
            )}
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary">
              <span className="text-xs font-bold text-primary-foreground">
                {getInitials(displayName || user?.username || '?')}
              </span>
            </span>
            <span className="hidden min-w-0 text-left lg:block">
              <span className="block truncate text-sm font-medium leading-tight text-foreground">
                {displayName || user?.username}
              </span>
              <span className="block truncate text-xs leading-tight text-muted-foreground">
                {roleLabel}
              </span>
            </span>
            <ChevronDown
              className={cn(
                'hidden h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform lg:block',
                menuOpen && 'rotate-180'
              )}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg animate-fade-in"
            >
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                  <span className="text-xs font-bold text-primary-foreground">
                    {getInitials(displayName || user?.username || '?')}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {displayName || user?.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">@{user?.username}</p>
                </div>
              </div>

              <div className="p-1.5">
                <Link
                  href="/settings"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-border p-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
