'use client';

import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { friendlyError, isStatus } from '../_lib/api/client';
import { customersApi } from '../_lib/api/resources';
import type { CsvImportResult } from '../_lib/api/types';
import { useQuery } from '../_lib/hooks';
import { EMAIL_PATTERN } from '../_lib/logic';
import {
  Banner, EmptyState, ErrorState, Field, Pager, SkeletonRows, inputStyle, primaryButton, secondaryButton, tdStyle, thStyle,
} from '../_components/ui';

const PAGE_SIZE = 25;
const SAMPLE_CSV = 'companyName,contactName,email,phone\nAcme Chemicals,Priya Sharma,priya@acme.example,+91 98765 43210\n';

export default function CustomersPage() {
  const [page, setPage] = useState(0);
  const [activeOnly, setActiveOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data, error, loading, reload } = useQuery(
    () => customersApi.list({ activeOnly, page, size: PAGE_SIZE }),
    [page, activeOnly]
  );

  // The API has no search parameter, so this filters the rows of the current page only.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!data || !q) return data?.items ?? [];
    return data.items.filter((c) =>
      [c.companyName, c.contactName, c.email, c.phone].some((v) => v?.toLowerCase().includes(q))
    );
  }, [data, search]);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            aria-label="Search customers on this page"
            placeholder="Search this page…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '260px' }}
          />
          <label style={{ fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="checkbox" checked={activeOnly} onChange={(e) => { setActiveOnly(e.target.checked); setPage(0); }} /> Active only
          </label>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={secondaryButton} onClick={() => setImportOpen(true)}>Import CSV</button>
          <button style={primaryButton} onClick={() => setAddOpen(true)}>Add customer</button>
        </div>
      </div>

      {error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <SkeletonRows />
      ) : data && data.total === 0 ? (
        <EmptyState
          title="No customers yet"
          text="Add a customer or import a CSV to start building recipient lists."
          action={<button style={primaryButton} onClick={() => setImportOpen(true)}>Import CSV</button>}
        />
      ) : (
        <>
          <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Company', 'Contact', 'Email', 'Phone', 'Active'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{c.companyName}</td>
                    <td style={tdStyle}>{c.contactName || '—'}</td>
                    <td style={tdStyle}>{c.email}</td>
                    <td style={tdStyle}>{c.phone || '—'}</td>
                    <td style={tdStyle}>{c.active ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--gray)' }}>No customers on this page match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} size={PAGE_SIZE} total={data?.total ?? 0} onPage={setPage} />
        </>
      )}

      <AddCustomerDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={reload} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={reload} />
    </div>
  );
}

function AddCustomerDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ companyName?: string; email?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!companyName.trim()) next.companyName = 'Company name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address';
    if (phone.trim().length > 50) next.phone = 'Phone must be 50 characters or fewer';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await customersApi.create({
        companyName: companyName.trim(),
        email: email.trim(),
        ...(contactName.trim() ? { contactName: contactName.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      toast.success('Customer added');
      setCompanyName(''); setContactName(''); setEmail(''); setPhone('');
      onCreated();
      onClose();
    } catch (err) {
      if (isStatus(err, 400)) setErrors({ email: 'A customer with this email already exists, or the values are invalid.' });
      else toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Add customer" size="small">
      <form onSubmit={submit}>
        <Field label="Company name" error={errors.companyName}>
          <input style={inputStyle} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </Field>
        <Field label="Contact name (optional)">
          <input style={inputStyle} value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone (optional)" error={errors.phone}>
          <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={50} />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" style={secondaryButton} onClick={onClose}>Cancel</button>
          <button type="submit" style={primaryButton} disabled={saving}>{saving ? 'Saving…' : 'Add customer'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ImportDialog({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  const choose = (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please choose a .csv file');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const run = async () => {
    if (!file || importing) return;
    setImporting(true);
    try {
      setResult(await customersApi.importCsv(file));
      onImported();
    } catch (err) {
      toast.error(isStatus(err, 400) ? 'The file could not be read. Check that the header row is exactly: companyName,contactName,email,phone' : friendlyError(err));
    } finally {
      setImporting(false);
    }
  };

  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={open} onClose={close} title="Import customers from CSV" size="medium">
      <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '12px', lineHeight: 1.6 }}>
        The header row must be exactly <code>companyName,contactName,email,phone</code>. <code>companyName</code> and <code>email</code> are required.
        Duplicate emails are skipped, not treated as errors.{' '}
        <button onClick={downloadSample} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: 600 }}>
          Download sample CSV
        </button>
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        style={{
          border: `2px dashed ${dragging ? 'var(--blue)' : 'var(--border)'}`, borderRadius: '10px', padding: '28px',
          textAlign: 'center', cursor: 'pointer', fontSize: '14px', marginBottom: '14px',
        }}
      >
        {file ? <strong>{file.name}</strong> : 'Drag and drop a CSV here, or click to choose a file'}
        <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => choose(e.target.files?.[0])} />
      </div>

      {result && (
        <div aria-live="polite" style={{ marginBottom: '14px' }}>
          <Banner tone={result.errors.length ? 'warn' : 'success'}>
            {result.totalRows} rows · <strong>{result.imported}</strong> imported · <strong>{result.skipped}</strong> skipped
          </Banner>
          {result.errors.length > 0 && (
            <div style={{ maxHeight: '220px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Row', 'Email', 'Reason'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {result.errors.map((er, i) => (
                    <tr key={`${er.rowNumber}-${i}`}>
                      <td style={tdStyle}>{er.rowNumber}</td>
                      <td style={tdStyle}>{er.email || '—'}</td>
                      <td style={tdStyle}>{er.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button style={secondaryButton} onClick={close}>{result ? 'Close' : 'Cancel'}</button>
        <button style={primaryButton} onClick={() => void run()} disabled={!file || importing}>{importing ? 'Importing…' : 'Import'}</button>
      </div>
    </Modal>
  );
}
