'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import { ShieldAlert, AlertTriangle, FileText, Send, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function DisputesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDispute, setNewDispute] = useState({ transaction_id: '', description: '' });

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: async () => {
      const endpoint = user?.role === 'CUSTOMER' ? '/disputes/my' : '/disputes';
      const res = await api.get(endpoint);
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/disputes', {
        transaction_id: parseInt(newDispute.transaction_id),
        description: newDispute.description,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setIsModalOpen(false);
      setNewDispute({ transaction_id: '', description: '' });
    },
  });

  return (
    <div className="space-y-6 animate-fade-in sm:space-y-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispute Resolution</h1>
          <p className="page-subtitle">
            {user?.role === 'CUSTOMER' ? 'Track and manage your transaction disputes.' : 'Review and resolve customer disputes.'}
          </p>
        </div>
        {user?.role === 'CUSTOMER' && (
          <div className="page-actions">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary gap-2 bg-rose-600 hover:bg-rose-700"
          >
            <ShieldAlert className="w-5 h-5" />
            File Dispute
          </button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-foreground">No Disputes Found</h3>
            <p className="text-muted-foreground mt-2">Everything looks good! There are no active disputes.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {disputes.map((dispute: any) => (
              <div key={dispute.dispute_id} className="p-6 hover:bg-secondary/50 transition-colors flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                      dispute.status === 'OPEN' ? 'bg-amber-500/20 text-amber-500' :
                      dispute.status === 'RESOLVED' ? 'bg-green-500/20 text-green-500' :
                      dispute.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {dispute.status}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground">ID: #{dispute.dispute_id}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(dispute.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <h4 className="text-lg font-medium text-foreground">{dispute.description}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-2 rounded-lg inline-flex">
                    <FileText className="w-4 h-4" />
                    Transaction #{dispute.transaction_id}
                  </div>
                </div>
                {user?.role !== 'CUSTOMER' && dispute.status !== 'RESOLVED' && dispute.status !== 'REJECTED' && (
                  <div className="flex items-center">
                    <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-lg">
                      Review <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Dispute Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">File a Dispute</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Transaction ID</label>
                <input
                  type="number"
                  placeholder="e.g. 1042"
                  value={newDispute.transaction_id}
                  onChange={e => setNewDispute({ ...newDispute, transaction_id: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={4}
                  placeholder="Please describe the issue with this transaction..."
                  value={newDispute.description}
                  onChange={e => setNewDispute({ ...newDispute, description: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newDispute.transaction_id || !newDispute.description || createMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
