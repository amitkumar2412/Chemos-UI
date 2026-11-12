'use client';

import { useState } from 'react';
import { campaignsApi } from '../../_lib/api/resources';
import type { CampaignRecipient, RecipientStatus } from '../../_lib/api/types';
import { useQuery, usePolling } from '../../_lib/hooks';
import { ALL_STATUSES, STATUS_LABELS, formatDateTime, statusCounts } from '../../_lib/logic';
import { EmptyState, ErrorState, SkeletonRows, StatusChip, cardStyle, inputStyle, tdStyle, thStyle } from '../ui';

const FAST_MS = 5000;
const SLOW_MS = 30000;
const PAGE_SIZE = 50;

export default function ProgressStep({ campaignId }: { campaignId: number }) {
  const initial = useQuery(() => campaignsApi.allRecipients(campaignId), [campaignId]);
  const [live, setLive] = useState<CampaignRecipient[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [pollError, setPollError] = useState<unknown>();
  const [filter, setFilter] = useState<RecipientStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);

  const rows = live ?? initial.data ?? [];

  usePolling(
    async () => {
      try {
        setLive(await campaignsApi.allRecipients(campaignId));
        setUpdatedAt(new Date());
        setPollError(undefined);
      } catch (err) {
        setPollError(err);
      }
    },
    () => (rows.some((r) => r.status === 'PENDING') ? FAST_MS : SLOW_MS),
    !!initial.data
  );

  if (initial.error && !initial.data) return <ErrorState error={initial.error} onRetry={initial.reload} />;
  if (initial.loading && !initial.data) return <SkeletonRows rows={4} />;
  if (rows.length === 0) return <EmptyState title="No recipients" text="This campaign has no recipients yet." />;

  const counts = statusCounts(rows);
  const visible = filter === 'ALL' ? rows : rows.filter((r) => r.status === filter);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageRows = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const stamp = updatedAt ?? new Date();

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Step 6 · Progress</h2>
      <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '14px' }}>
        Sending is asynchronous. <strong>Sent</strong> means the mail provider accepted the message — not that it was received or read.
        Reply text isn&apos;t shown here; only the Replied status.
      </p>

      <div aria-live="polite" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        {ALL_STATUSES.filter((s) => counts[s]).map((s) => (
          <div key={s} style={{ ...cardStyle, padding: '10px 16px', minWidth: '90px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{counts[s]}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{STATUS_LABELS[s]}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
        <select
          aria-label="Filter by status"
          style={{ ...inputStyle, width: '200px' }}
          value={filter}
          onChange={(e) => { setFilter(e.target.value as RecipientStatus | 'ALL'); setPage(0); }}
        >
          <option value="ALL">All statuses ({rows.length})</option>
          {ALL_STATUSES.filter((s) => counts[s]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]} ({counts[s]})</option>)}
        </select>
        <span style={{ fontSize: '12px', color: 'var(--gray)' }}>Last updated {stamp.toLocaleTimeString()}</span>
      </div>
      {pollError ? <ErrorState error={pollError} /> : null}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
          <thead>
            <tr>{['Customer', 'Email', 'Status', 'Sent', 'Replied'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{r.customer.companyName}</td>
                <td style={tdStyle}>{r.customer.email}</td>
                <td style={tdStyle}><StatusChip status={r.status} /></td>
                <td style={tdStyle}>{formatDateTime(r.sentAt)}</td>
                <td style={tdStyle}>{formatDateTime(r.repliedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--gray)' }}>
        <span>{visible.length} row{visible.length === 1 ? '' : 's'}</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button disabled={page <= 0} onClick={() => setPage(page - 1)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>Previous</button>
          <span>Page {page + 1} of {pages}</span>
          <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>Next</button>
        </div>
      </div>
    </div>
  );
}
