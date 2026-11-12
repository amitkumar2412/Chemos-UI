'use client';

import Link from 'next/link';
import { useCampaigns } from '../_lib/campaigns';
import { formatDateTime, formatPrice } from '../_lib/logic';
import { EmptyState, cardStyle, primaryButton } from './ui';

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

export default function RecentCampaigns({ limit }: { limit?: number }) {
  const { campaigns, removeCampaign } = useCampaigns();
  const shown = limit ? campaigns.slice(0, limit) : campaigns;

  if (campaigns.length === 0) {
    return <EmptyState title="No campaigns yet" text="Create your first campaign to offer a chemical to your customers." action={<NewCampaignLink />} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {shown.map((c) => (
        <div key={c.id} style={{ ...cardStyle, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <Link href={`/admin/email-system/campaigns/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>
              {c.chemicalName} · {formatPrice(c.offerPrice)} · created {formatDateTime(c.createdAt)}
            </div>
          </Link>
          <button
            onClick={() => removeCampaign(c.id)}
            title="Remove from this list (does not delete the campaign)"
            style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: '12px' }}
          >
            Forget
          </button>
        </div>
      ))}
    </div>
  );
}
