'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../../lib/utils';
import { CreditCard, RefreshCw, ShieldOff, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';

export default function CardsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [blockingCardId, setBlockingCardId] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const res = await api.get('/cards');
      return res.data.data;
    },
  });

  const blockMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await api.patch(`/cards/${id}/block`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setBlockingCardId(null);
      setBlockReason('');
    },
  });

  const cards = data ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Card Management</h1>
          <p className="page-subtitle">View and manage your debit and credit cards</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))
        ) : cards.length === 0 ? (
          <div className="col-span-full py-16 text-center border rounded-xl bg-card">
            <CreditCard className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No cards found</p>
          </div>
        ) : (
          cards.map((card: any) => (
            <div key={card.card_id} className="relative rounded-xl border bg-card p-5 shadow-sm overflow-hidden flex flex-col justify-between min-h-[220px]">
              {/* Background styling for the card type */}
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 blur-2xl ${card.card_network === 'VISA' ? 'bg-blue-500' : card.card_network === 'MASTERCARD' ? 'bg-red-500' : 'bg-primary'}`} />
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-foreground tracking-widest">{card.card_network}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.card_type} CARD</p>
                </div>
                <span className={getStatusBadge(card.status)}>{card.status}</span>
              </div>

              <div className="relative z-10 my-6">
                <p className="font-mono text-xl tracking-widest text-foreground">{card.masked_number.match(/.{1,4}/g)?.join(' ')}</p>
                <div className="flex items-center gap-6 mt-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Valid Thru</p>
                    <p className="font-mono text-sm">{new Date(card.expiry_date).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Linked Account</p>
                    <p className="font-mono text-sm">{card.account?.account_number}</p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-4 border-t border-border flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Monthly Spend</span>
                  <span className="font-financial font-medium text-foreground">
                    {formatCurrency(Number(card.current_month_spend), card.account?.currency?.currency_code)} 
                    <span className="text-muted-foreground font-normal text-xs"> / {formatCurrency(Number(card.monthly_limit), card.account?.currency?.currency_code)}</span>
                  </span>
                </div>

                {card.status === 'ACTIVE' && (
                  <button 
                    onClick={() => setBlockingCardId(card.card_id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    <ShieldOff className="w-3.5 h-3.5" /> Block
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Block Card Modal */}
      {blockingCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in px-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-3 bg-red-500/10">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h2 className="font-bold text-lg text-foreground">Block Card</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to block this card? This action will immediately prevent any further transactions. You will need to contact the branch to unblock or replace it.
              </p>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Reason for blocking <span className="text-red-500">*</span></label>
                <textarea 
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Lost card, Suspicious activity..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                />
              </div>
            </div>
            <div className="p-4 border-t border-border bg-muted/40 flex justify-end gap-3">
              <button 
                onClick={() => { setBlockingCardId(null); setBlockReason(''); }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => blockMutation.mutate({ id: blockingCardId, reason: blockReason })}
                disabled={blockReason.length < 5 || blockMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {blockMutation.isPending ? 'Blocking...' : 'Confirm Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
