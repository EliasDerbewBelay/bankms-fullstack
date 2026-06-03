'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { getInitials, cn } from '../../../lib/utils';
import { Users, Plus, Edit2, X, CheckCircle2, Copy, Check } from 'lucide-react';
import { Modal } from '../../../components/ui/modal';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useToast } from '../../../components/ui/toaster';

interface Beneficiary {
  beneficiary_id: number;
  beneficiary_name: string;
  account_number_or_iban: string;
  bank_name: string;
  bank_code?: string;
  swift_code?: string;
  relationship?: string;
  is_verified: boolean;
  is_active: boolean;
}

const emptyForm = {
  beneficiary_name: '',
  account_number_or_iban: '',
  bank_name: '',
  bank_code: '',
  swift_code: '',
  relationship: '',
};

export default function BeneficiariesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Beneficiary | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: async () => { const r = await api.get('/beneficiaries'); return r.data.data as Beneficiary[]; },
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm) => {
      if (editTarget) return api.put(`/beneficiaries/${editTarget.beneficiary_id}`, payload);
      return api.post('/beneficiaries', payload);
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: ['beneficiaries'] });
      setModalOpen(false);
      setEditTarget(null);
      setForm(emptyForm);
      toast.success(editTarget ? 'Beneficiary updated' : 'Beneficiary added');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to save beneficiary'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/beneficiaries/${id}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beneficiaries'] });
      setDeactivateId(null);
      toast.warning('Beneficiary deactivated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to deactivate'),
  });

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (b: Beneficiary) => {
    setEditTarget(b);
    setForm({ beneficiary_name: b.beneficiary_name, account_number_or_iban: b.account_number_or_iban, bank_name: b.bank_name, bank_code: b.bank_code ?? '', swift_code: b.swift_code ?? '', relationship: b.relationship ?? '' });
    setModalOpen(true);
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = (data ?? []).filter(b => {
    if (!showInactive && !b.is_active) return false;
    if (!search) return true;
    return b.beneficiary_name.toLowerCase().includes(search.toLowerCase()) ||
      b.account_number_or_iban.includes(search);
  });

  const fieldClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Beneficiaries</h1>
          <p className="page-subtitle">{(data ?? []).filter(b => b.is_active).length} active beneficiaries</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Beneficiary
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or account…"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-72" />
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded border-input" />
          Show inactive
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border rounded-xl bg-card">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No beneficiaries found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b => (
            <div key={b.beneficiary_id} className={cn('rounded-xl border bg-card p-5 shadow-sm space-y-4 transition-opacity', !b.is_active && 'opacity-50')}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{getInitials(b.beneficiary_name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{b.beneficiary_name}</h3>
                    {!b.is_active && <span className="text-xs text-muted-foreground italic">Inactive</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{b.bank_name}</p>
                  {b.relationship && <p className="text-xs text-muted-foreground mt-0.5 bg-muted px-1.5 py-0.5 rounded w-fit">{b.relationship}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-muted-foreground bg-muted px-2 py-1.5 rounded truncate">{b.account_number_or_iban}</code>
                <button onClick={() => copyToClipboard(b.account_number_or_iban, b.beneficiary_id)} className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground">
                  {copiedId === b.beneficiary_id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                {b.is_verified
                  ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
                  : <span className="text-xs text-muted-foreground">Unverified</span>}
                {b.is_active && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeactivateId(b.beneficiary_id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null); setForm(emptyForm); }} title={editTarget ? 'Edit Beneficiary' : 'Add Beneficiary'} size="md">
        <div className="space-y-3">
          {([['beneficiary_name', 'Beneficiary Name', true], ['account_number_or_iban', 'Account Number / IBAN', true], ['bank_name', 'Bank Name', true], ['bank_code', 'Bank Code', false], ['swift_code', 'SWIFT Code', false], ['relationship', 'Relationship', false]] as [keyof typeof emptyForm, string, boolean][]).map(([key, label, req]) => (
            <div key={key}>
              <label className="text-xs font-medium text-foreground block mb-1">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
              <input className={fieldClass} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={label} />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); setEditTarget(null); setForm(emptyForm); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.beneficiary_name || !form.account_number_or_iban || !form.bank_name}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saveMutation.isPending ? 'Saving...' : editTarget ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deactivateId} onClose={() => setDeactivateId(null)} onConfirm={() => deactivateId && deactivateMutation.mutate(deactivateId)}
        title="Deactivate Beneficiary" message="Are you sure you want to deactivate this beneficiary? You can show inactive beneficiaries to view them later."
        confirmLabel="Deactivate" variant="danger" loading={deactivateMutation.isPending} />
    </div>
  );
}
