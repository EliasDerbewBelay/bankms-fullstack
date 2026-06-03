'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ElementType } from 'react';
import { api } from '../../../lib/api';
import { Bell, CheckCheck, RefreshCw, CreditCard, ArrowLeftRight, FileText, ShieldAlert, Info, Zap } from 'lucide-react';

const typeConfig: Record<string, { icon: ElementType; color: string }> = {
  TRANSACTION_ALERT: { icon: ArrowLeftRight, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10' },
  LOGIN_ALERT: { icon: ShieldAlert, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10' },
  LOAN_REMINDER: { icon: FileText, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10' },
  CARD_ALERT: { icon: CreditCard, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10' },
  ACCOUNT_ALERT: { icon: Zap, color: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-500/10' },
  SYSTEM: { icon: Info, color: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-500/10' },
  OTP: { icon: ShieldAlert, color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10' },
};

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data as any[];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">We'll notify you when something important happens</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif: any) => {
              const cfg = typeConfig[notif.notification_type] ?? typeConfig.SYSTEM;
              const Icon = cfg.icon;
              return (
                <div
                  key={notif.notification_id}
                  className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors ${!notif.is_read ? 'bg-primary/3' : ''}`}
                  onClick={() => !notif.is_read && markReadMutation.mutate(notif.notification_id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <p className={`text-xs font-medium uppercase tracking-wider ${!notif.is_read ? 'text-primary' : 'text-muted-foreground'}`}>
                        {notif.notification_type.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(notif.created_at)}</span>
                      </div>
                    </div>
                    {notif.subject && (
                      <p className="text-sm font-medium text-foreground mt-0.5">{notif.subject}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      via {notif.channel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
