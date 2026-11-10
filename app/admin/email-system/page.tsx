'use client';

import Link from 'next/link';
import { customersApi, productsApi, templatesApi } from './_lib/api/resources';
import { useQuery } from './_lib/hooks';
import { useCampaigns } from './_lib/campaigns';
import RecentCampaigns, { NewCampaignLink } from './_components/RecentCampaigns';
import { cardStyle } from './_components/ui';

export default function EmailSystemOverviewPage() {
  const { campaigns } = useCampaigns();
  const chemicals = useQuery(() => productsApi.list(false), []);
  const customers = useQuery(() => customersApi.list({ page: 0, size: 1 }), []);
  const templates = useQuery(() => templatesApi.masters(), []);

  const value = (q: { data?: unknown; error?: unknown }, count: number | undefined) =>
    q.error ? '—' : count === undefined ? '…' : count;

  const stats = [
    { label: 'Chemicals', value: value(chemicals, chemicals.data?.length), color: 'var(--blue)', href: '/admin/email-system/chemicals' },
    { label: 'Customers', value: value(customers, customers.data?.total), color: 'var(--teal)', href: '/admin/email-system/customers' },
    { label: 'Email templates', value: value(templates, templates.data?.length), color: 'var(--gold)', href: '/admin/email-system/templates' },
    { label: 'Your recent campaigns', value: campaigns.length, color: 'var(--green)', href: '/admin/email-system/campaigns' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={{ ...cardStyle, textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '2px' }}>{s.label}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Recent campaigns</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {campaigns.length > 5 && (
            <Link href="/admin/email-system/campaigns" style={{ fontSize: '13px', color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
          )}
          <NewCampaignLink small />
        </div>
      </div>
      <RecentCampaigns limit={5} />
    </div>
  );
}
