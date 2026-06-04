'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight,
  FileText, Landmark, Building2,
  Shield, Banknote, BarChart3,
  ChevronLeft, ChevronRight, Briefcase, MessageSquareWarning,
  Zap, UserPlus, RotateCcw, Send
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';

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
  { href: '/disputes', icon: MessageSquareWarning, label: 'Disputes', roles: ['CUSTOMER', 'SUPERVISOR', 'BRANCH_MANAGER'] },
  { href: '/refunds', icon: RotateCcw, label: 'Refunds', roles: ['CUSTOMER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'] },
  { href: '/reports', icon: BarChart3, label: 'Reports', roles: ['BRANCH_MANAGER', 'ADMIN'] },
  { href: '/admin', icon: Shield, label: 'Admin', roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

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
