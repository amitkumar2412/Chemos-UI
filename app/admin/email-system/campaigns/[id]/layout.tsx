'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useCampaigns } from '../../_lib/campaigns';
import { formatPrice } from '../../_lib/logic';
import { cardStyle } from '../../_components/ui';

export const WIZARD_STEPS = [
  { key: 'recipients', label: 'Recipients' },
  { key: 'templates', label: 'Templates' },
  { key: 'personalize', label: 'Personalize' },
  { key: 'review', label: 'Review & send' },
  { key: 'progress', label: 'Progress' },
] as const;

export default function CampaignWizardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const id = Number(params.id);
  const { getCampaign } = useCampaigns();
  const campaign = getCampaign(id);
  const base = `/admin/email-system/campaigns/${params.id}`;

  return (
    <div>
      <nav aria-label="Campaign steps" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', background: 'var(--green-dim)', color: 'var(--green)', fontWeight: 600 }}>
          ✓ Details
        </span>
        {WIZARD_STEPS.map((s, i) => {
          const active = pathname === `${base}/${s.key}`;
          return (
            <Link
              key={s.key}
              href={`${base}/${s.key}`}
              aria-current={active ? 'step' : undefined}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                background: active ? 'var(--blue)' : 'var(--navy-light)', color: active ? 'white' : 'var(--gray)',
              }}
            >
              {i + 2}. {s.label}
            </Link>
          );
        })}
        <Link
          href={`${base}/replies`}
          aria-current={pathname === `${base}/replies` ? 'page' : undefined}
          style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
            background: pathname === `${base}/replies` ? 'var(--blue)' : 'var(--navy-light)',
            color: pathname === `${base}/replies` ? 'white' : 'var(--gray)',
          }}
        >
          Replies
        </Link>
      </nav>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 640px', minWidth: 0 }}>{children}</div>
        <aside style={{ ...cardStyle, flex: '0 0 260px', fontSize: '13px' }}>
          <div style={{ fontWeight: 700, marginBottom: '10px' }}>Campaign summary</div>
          {campaign ? (
            <dl style={{ margin: 0, display: 'grid', gap: '8px' }}>
              <div><dt style={{ color: 'var(--gray)' }}>Name</dt><dd style={{ margin: 0, fontWeight: 600 }}>{campaign.name}</dd></div>
              <div><dt style={{ color: 'var(--gray)' }}>Chemical</dt><dd style={{ margin: 0, fontWeight: 600 }}>{campaign.chemicalName}</dd></div>
              <div><dt style={{ color: 'var(--gray)' }}>Base price</dt><dd style={{ margin: 0, fontWeight: 600 }}>{formatPrice(campaign.offerPrice)}</dd></div>
            </dl>
          ) : (
            <p style={{ margin: 0, color: 'var(--gray)', lineHeight: 1.5 }}>
              Campaign #{params.id}. Its name, chemical and price are not available because it was not created in this browser.
            </p>
          )}
          <p style={{ margin: '12px 0 0', color: 'var(--gray)', fontSize: '12px' }}>Details are read-only after creation.</p>
        </aside>
      </div>
    </div>
  );
}
