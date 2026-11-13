'use client';

import { useState } from 'react';
import Link from 'next/link';
import { campaignsApi } from '../_lib/api/resources';
import { useQuery } from '../_lib/hooks';
import { formatDateTime, formatPrice } from '../_lib/logic';
import { CampaignStatusChip, EmptyState, ErrorState, Pager, SkeletonRows, cardStyle, primaryButton } from './ui';

const PAGE_SIZE = 50;

export function NewCampaignLink({ small }: { small?: boolean }) {
  return (
    <Link
      href="/admin/email-system/campaigns/new"
      style={{ ...primaryButton, display: 'inline-block', textDecoration: 'none', whiteSpace: 'nowrap', ...(small ? { padding: '8px 16px' } : {}) }}
    >
      New campaign
    </Link>
  );
}

const linkStyle = { fontSize: '13px', color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 } as const;

// With `limit` shows only the newest N campaigns; without it, the full list with a pager.
export default function RecentCampaigns({ limit }: { limit?: number }) {
  const size = limit ?? PAGE_SIZE;
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useQuery(() => campaignsApi.list({ page, size }), [page, size]);

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <SkeletonRows rows={limit ?? 4} />;
  if (data.total === 0) {
    return <EmptyState title="No campaigns yet" text="Create your first campaign to offer a chemical to your customers." action={<NewCampaignLink />} />;
  }

  return (
    <div>
      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: loading ? 0.6 : 1 }}>
        {data.items.map((c) => (
          <div key={c.id} style={{ ...cardStyle, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href={`/admin/email-system/campaigns/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>
                {formatPrice(c.offerPrice)} · created {formatDateTime(c.createdAt)}
                {c.scheduledAt && ` · scheduled ${formatDateTime(c.scheduledAt)}`}
              </div>
            </Link>
            <CampaignStatusChip status={c.status} />
            <Link href={`/admin/email-system/campaigns/${c.id}/replies`} style={linkStyle}>
              Replies
            </Link>
          </div>
        ))}
      </div>
      {!limit && <Pager page={page} size={size} total={data.total} onPage={setPage} />}
    </div>
  );
}
