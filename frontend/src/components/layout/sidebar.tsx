'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight,
  FileText, Landmark, Building2,
  Shield, Banknote, BarChart3,
  ChevronLeft, ChevronRight, Briefcase, MessageSquareWarning,
  Zap, UserPlus, RotateCcw, Send, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { useMobileNavStore } from '../../store/mobile-nav.store';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['CUSTOMER', 'TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/accounts', icon: Banknote, label: 'Accounts', roles: ['CUSTOMER', 'TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions', roles: ['CUSTOMER', 'TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/transfers', icon: Send, label: 'Transfer Money', roles: ['CUSTOMER'] },
  { href: '/beneficiaries', icon: UserPlus, label: 'Beneficiaries', roles: ['CUSTOMER'] },
  { href: '/utility-payments', icon: Zap, label: 'Utility Payments', roles: ['CUSTOMER', 'TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/loans', icon: FileText, label: 'Loans', roles: ['CUSTOMER', 'TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/cards', icon: CreditCard, label: 'Cards', roles: ['CUSTOMER', 'TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/customers', icon: Users, label: 'Customers', roles: ['TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/atm', icon: Landmark, label: 'ATM Network', roles: ['SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/teller', icon: Briefcase, label: 'Teller Ops', roles: ['TELLER', 'SUPERVISOR'] },
  { href: '/supervisor', icon: Shield, label: 'Supervisor Ops', roles: ['SUPERVISOR', 'BRANCH_MANAGER'] },
  { href: '/branch-manager', icon: Briefcase, label: 'Branch Manager Ops', roles: ['BRANCH_MANAGER'] },
  { href: '/disputes', icon: MessageSquareWarning, label: 'Disputes', roles: ['CUSTOMER', 'SUPERVISOR', 'BRANCH_MANAGER'] },
  { href: '/refunds', icon: RotateCcw, label: 'Refunds', roles: ['CUSTOMER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/reports', icon: BarChart3, label: 'Reports', roles: ['BRANCH_MANAGER', 'ADMIN'] },
  { href: '/admin', icon: Shield, label: 'Admin', roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { open: mobileOpen, close: closeMobile } = useMobileNavStore();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={closeMobile}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'flex h-full flex-col bg-sidebar border-sidebar-border',
          'transition-[transform,width] duration-300 ease-in-out',
          // Mobile: off-canvas drawer
          'fixed inset-y-0 left-0 z-50 h-[100dvh] w-[min(100vw-3rem,280px)] max-w-[85vw] border-r shadow-xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: in-flow sidebar
          'lg:relative lg:z-auto lg:h-screen lg:max-w-none lg:translate-x-0 lg:shadow-none lg:flex-shrink-0',
          collapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 border-b border-sidebar-border px-4 py-4 lg:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0 overflow-hidden">
                <p className="truncate text-sm font-bold leading-none text-sidebar-foreground">
                  CoreBank MS
                </p>
                <p className="mt-0.5 truncate text-xs text-sidebar-foreground/40">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3 lg:py-4">
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const showLabel = !collapsed || mobileOpen;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!showLabel ? item.label : undefined}
                className={cn(
                  'sidebar-item min-h-[44px]',
                  isActive && 'sidebar-item-active',
                  collapsed && !mobileOpen && 'lg:justify-center lg:px-0'
                )}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                {showLabel && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 shadow-sm transition-colors hover:text-sidebar-foreground lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>
    </>
  );
}
