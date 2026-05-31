'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight,
  FileText, Landmark, Settings, LogOut, Building2,
  Shield, Banknote, Bell, BarChart3,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn, getInitials } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['CUSTOMER', 'TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/accounts', icon: Banknote, label: 'Accounts', roles: ['CUSTOMER', 'TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions', roles: ['TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/loans', icon: FileText, label: 'Loans', roles: ['CUSTOMER', 'TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/cards', icon: CreditCard, label: 'Cards', roles: ['CUSTOMER', 'TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/customers', icon: Users, label: 'Customers', roles: ['TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/atm', icon: Landmark, label: 'ATM Network', roles: ['SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/reports', icon: BarChart3, label: 'Reports', roles: ['BRANCH_MANAGER', 'ADMIN'] },
  { href: '/admin', icon: Shield, label: 'Admin', roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const displayName = user?.profile
    ? 'first_name' in (user.profile as any)
      ? `${(user.profile as any).first_name} ${(user.profile as any).last_name}`
      : (user.profile as any).company_name ?? user.username
    : user?.username ?? '';

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace('/login');
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border',
        'transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-sidebar-foreground leading-none truncate">
              AASTU Bank MS
            </p>
            <p className="text-xs text-sidebar-foreground/40 mt-0.5 truncate">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'sidebar-item',
                isActive && 'sidebar-item-active',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <Link
          href="/notifications"
          className={cn('sidebar-item', collapsed && 'justify-center px-0')}
        >
          <Bell className="w-4.5 h-4.5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Notifications</span>}
        </Link>
        <Link
          href="/settings"
          className={cn('sidebar-item', collapsed && 'justify-center px-0')}
        >
          <Settings className="w-4.5 h-4.5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Settings</span>}
        </Link>

        {/* User profile */}
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 mt-2',
            collapsed && 'justify-center px-0'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-foreground">
              {getInitials(displayName)}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-sidebar-foreground/40 truncate">
                @{user?.username}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            'sidebar-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-400',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
          {!collapsed && <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border
                   flex items-center justify-center text-sidebar-foreground/60
                   hover:text-sidebar-foreground transition-colors z-10 shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
