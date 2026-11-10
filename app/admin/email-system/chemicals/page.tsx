'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { friendlyError, isStatus } from '../_lib/api/client';
import { productsApi } from '../_lib/api/resources';
import { useQuery } from '../_lib/hooks';
import { formatDateTime } from '../_lib/logic';
import { EmptyState, ErrorState, Field, SkeletonRows, inputStyle, primaryButton, secondaryButton, tdStyle, thStyle } from '../_components/ui';

export default function ChemicalsPage() {
  const [activeOnly, setActiveOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const { data, error, loading, reload } = useQuery(() => productsApi.list(activeOnly), [activeOnly]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
        <label style={{ fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} /> Active only
        </label>
        <button style={primaryButton} onClick={() => setOpen(true)}>Add chemical</button>
      </div>

      {error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <SkeletonRows />
      ) : data && data.length === 0 ? (
        <EmptyState title="No chemicals yet" text="Add the chemicals you sell so you can attach them to campaigns." action={<button style={primaryButton} onClick={() => setOpen(true)}>Add chemical</button>} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Name', 'HS code', 'CAS no.', 'Active', 'Created'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data?.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{p.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                  <td style={tdStyle}>{p.hsCode || '—'}</td>
                  <td style={tdStyle}>{p.casNo || '—'}</td>
                  <td style={tdStyle}>{p.isActive ? 'Yes' : 'No'}</td>
                  <td style={tdStyle}>{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddChemicalDialog open={open} onClose={() => setOpen(false)} onCreated={reload} />
    </div>
  );
}

function AddChemicalDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [casNo, setCasNo] = useState('');
  const [errors, setErrors] = useState<{ id?: string; name?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!id.trim()) next.id = 'ID is required';
    else if (id.trim().length > 255) next.id = 'ID must be 255 characters or fewer';
    if (!name.trim()) next.name = 'Name is required';
    else if (name.trim().length > 255) next.name = 'Name must be 255 characters or fewer';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await productsApi.create({
        id: id.trim(),
        name: name.trim(),
        ...(hsCode.trim() ? { hsCode: hsCode.trim() } : {}),
        ...(casNo.trim() ? { casNo: casNo.trim() } : {}),
      });
      toast.success('Chemical added');
      setId(''); setName(''); setHsCode(''); setCasNo('');
      onCreated();
      onClose();
    } catch (err) {
      if (isStatus(err, 400)) setErrors({ id: 'A chemical with this ID already exists, or the values are invalid.' });
      else toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Add chemical" size="small">
      <form onSubmit={submit}>
        <Field label="ID" hint="Chosen by you and cannot be changed later. Suggested format: UPPERCASE-HYPHEN, e.g. UREA-46." error={errors.id}>
          <input style={inputStyle} value={id} onChange={(e) => setId(e.target.value)} maxLength={255} placeholder="UREA-46" />
        </Field>
        <Field label="Name" error={errors.name}>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} maxLength={255} />
        </Field>
        <Field label="HS code (optional)">
          <input style={inputStyle} value={hsCode} onChange={(e) => setHsCode(e.target.value)} />
        </Field>
        <Field label="CAS number (optional)">
          <input style={inputStyle} value={casNo} onChange={(e) => setCasNo(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" style={secondaryButton} onClick={onClose}>Cancel</button>
          <button type="submit" style={primaryButton} disabled={saving}>{saving ? 'Saving…' : 'Add chemical'}</button>
        </div>
      </form>
    </Modal>
  );
}
