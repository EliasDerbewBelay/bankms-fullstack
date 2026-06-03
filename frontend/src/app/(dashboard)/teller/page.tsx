'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import { Building2, Wallet, History, AlertCircle } from 'lucide-react';

export default function TellerPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: drawer, isLoading: isDrawerLoading } = useQuery({
    queryKey: ['teller-drawer', user?.linkedEmployeeId],
    queryFn: async () => {
      if (!user?.linkedEmployeeId) return null;
      try {
        const res = await api.get(`/teller-drawers/employee/${user.linkedEmployeeId}`);
        return res.data.data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!user?.linkedEmployeeId && user?.role === 'TELLER',
  });

  if (user?.role !== 'TELLER' && user?.role !== 'SUPERVISOR') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-foreground">Teller Operations</h1>
        <p className="text-muted-foreground mt-2">Access restricted to tellers and supervisors.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Teller Operations</h1>
        <p className="text-muted-foreground mt-2">Manage your active cash drawer and daily shifts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-card-foreground">Drawer Status</h2>
              <p className="text-sm text-muted-foreground">Current shift cash balance</p>
            </div>
          </div>

          {isDrawerLoading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ) : drawer ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold tracking-wide">
                  {drawer.status}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                <span className="text-sm font-medium text-muted-foreground">Opening Balance</span>
                <span className="text-lg font-bold text-foreground">${Number(drawer.opening_balance).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                <span className="text-sm font-bold text-teal-600 dark:text-teal-400">Current Balance</span>
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                  ${Number(drawer.current_balance).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-foreground">Drawer is Closed</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                You do not have an active drawer for this shift. Please ask a Supervisor to open your drawer to begin processing cash transactions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
