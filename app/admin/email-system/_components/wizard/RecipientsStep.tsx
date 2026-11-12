'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { friendlyError } from '../../_lib/api/client';
import { campaignsApi, customersApi } from '../../_lib/api/resources';
import { useQuery } from '../../_lib/hooks';
import { Banner, EmptyState, ErrorState, Pager, SkeletonRows, inputStyle, primaryButton, secondaryButton, tdStyle, thStyle } from '../ui';

const PAGE_SIZE = 50;
const MAX_RECIPIENTS = 5000;

export default function RecipientsStep({ campaignId }: { campaignId: number }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState<number | null>(null);

  const customers = useQuery(() => customersApi.list({ activeOnly: true, page, size: PAGE_SIZE }), [page]);
  const existing = useQuery(() => campaignsApi.recipients(campaignId, { page: 0, size: 1 }), [campaignId, added]);

  const q = search.trim().toLowerCase();
  const rows = (customers.data?.items ?? []).filter(
    (c) => !q || [c.companyName, c.contactName, c.email].some((v) => v?.toLowerCase().includes(q))
  );
  const allOnPage = rows.length > 0 && rows.every((c) => selected.has(c.id));

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      rows.forEach((c) => (allOnPage ? next.delete(c.id) : next.add(c.id)));
      return next;
    });

  const submit = async () => {
    if (submitting || selected.size === 0) return;
    setSubmitting(true);
    try {
      const result = await campaignsApi.addRecipients(campaignId, [...selected]);
      setAdded(result.length);
      setSelected(new Set());
      toast.success(`${result.length} recipient${result.length === 1 ? '' : 's'} added`);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => router.push(`/admin/email-system/campaigns/${campaignId}/templates`);
  const total = existing.data?.total ?? 0;

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Step 2 · Recipients</h2>
      <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '14px' }}>
        Pick the customers to email. Customers already in this campaign are skipped automatically.
      </p>

      {total > 0 && <Banner tone="success">This campaign has <strong>{total}</strong> recipient{total === 1 ? '' : 's'} so far.</Banner>}
      {selected.size > MAX_RECIPIENTS && <Banner tone="error">You can add at most {MAX_RECIPIENTS} recipients at a time.</Banner>}

      <input
        aria-label="Search customers on this page"
        placeholder="Search this page…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...inputStyle, maxWidth: '320px', marginBottom: '14px' }}
      />

      {customers.error && !customers.data ? (
        <ErrorState error={customers.error} onRetry={customers.reload} />
      ) : customers.loading && !customers.data ? (
        <SkeletonRows />
      ) : customers.data && customers.data.total === 0 ? (
        <EmptyState title="No active customers" text="Add or import customers on the Customers tab first." />
      ) : (
        <>
          <div style={{ overflowX: 'auto', opacity: customers.loading ? 0.6 : 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}><input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={toggleAll} /></th>
                  {['Company', 'Contact', 'Email'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td style={tdStyle}><input type="checkbox" aria-label={`Select ${c.companyName}`} checked={selected.has(c.id)} onChange={() => toggle(c.id)} /></td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{c.companyName}</td>
                    <td style={tdStyle}>{c.contactName || '—'}</td>
                    <td style={tdStyle}>{c.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} size={PAGE_SIZE} total={customers.data?.total ?? 0} onPage={setPage} />
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <span aria-live="polite" style={{ fontSize: '13px', color: 'var(--gray)' }}>
          <strong style={{ color: 'var(--white)' }}>{selected.size}</strong> selected
          {added !== null && ` · last submit added ${added}`}
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={secondaryButton} onClick={next} disabled={total === 0 && added === null}>Skip to templates</button>
          <button style={primaryButton} onClick={() => void submit()} disabled={submitting || selected.size === 0 || selected.size > MAX_RECIPIENTS}>
            {submitting ? 'Adding…' : `Add ${selected.size} recipient${selected.size === 1 ? '' : 's'}`}
          </button>
          {added !== null && <button style={primaryButton} onClick={next}>Continue →</button>}
        </div>
      </div>
    </div>
  );
}
