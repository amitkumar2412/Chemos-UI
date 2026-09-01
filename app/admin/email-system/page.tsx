'use client';

import Link from 'next/link';
import EmailSystemTabs from './_components/EmailSystemTabs';
import { useEmailSystem } from './_lib/store';
import { CHEMICALS, CUSTOMERS, EMAIL_TEMPLATES } from './data';

export default function EmailSystemOverviewPage() {
  const { campaigns } = useEmailSystem();

  const totalRecipients = campaigns.reduce(
    (sum, c) => sum + c.groups.reduce((gSum, g) => gSum + g.customerIds.length, 0),
    0
  );

  const stats = [
    { label: 'Chemicals in Catalog', value: CHEMICALS.length, color: 'var(--blue)', href: '/admin/email-system/chemicals' },
    { label: 'Customers', value: CUSTOMERS.length, color: 'var(--teal)', href: '/admin/email-system/customers' },
    { label: 'Email Templates', value: EMAIL_TEMPLATES.length, color: 'var(--gold)', href: '/admin/email-system/templates' },
    { label: 'Campaigns Sent', value: campaigns.length, color: 'var(--green)', href: '/admin/email-system/campaigns' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Email System</h1>
          <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
            Run targeted chemical offer campaigns to your customers — pick chemicals, set prices, choose a template, and send.
          </p>
        </div>
        <Link
          href="/admin/email-system/campaigns/new"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: 'var(--blue)', color: 'white', borderRadius: '8px', fontSize: '14px',
            fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          New Campaign
        </Link>
      </div>

      <EmailSystemTabs />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px',
              padding: '18px 20px', textDecoration: 'none', color: 'inherit', display: 'block',
            }}
          >
            <div style={{ fontSize: '26px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '2px' }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {totalRecipients > 0 && (
        <div
          style={{
            display: 'flex', gap: '24px', background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '16px 20px', marginBottom: '28px', fontSize: '13px', color: 'var(--gray)',
          }}
        >
          <span><strong style={{ color: 'var(--white)' }}>{totalRecipients}</strong> total emails sent across all campaigns</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Campaigns</h2>
        {campaigns.length > 0 && (
          <Link href="/admin/email-system/campaigns" style={{ fontSize: '13px', color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
            View all →
          </Link>
        )}
      </div>

      {campaigns.length === 0 ? (
        <div
          style={{
            textAlign: 'center', padding: '60px', background: 'var(--card)', borderRadius: '12px',
            border: '2px dashed var(--border)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No campaigns yet</h3>
          <p style={{ color: 'var(--gray)', marginBottom: '18px', fontSize: '14px' }}>
            Create your first campaign to offer chemicals to your customers.
          </p>
          <Link
            href="/admin/email-system/campaigns/new"
            style={{
              display: 'inline-block', padding: '10px 22px', background: 'var(--blue)', color: 'white',
              borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            }}
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {campaigns.slice(0, 5).map((c) => {
            const recipients = c.groups.reduce((s, g) => s + g.customerIds.length, 0);
            return (
              <Link
                key={c.id}
                href={`/admin/email-system/campaigns/${c.id}`}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none',
                  color: 'inherit', background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '14px 18px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>
                    {new Date(c.createdAt).toLocaleString()} · {c.groups.length} group{c.groups.length !== 1 ? 's' : ''} · {recipients} recipient{recipients !== 1 ? 's' : ''}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: 'var(--green-dim)', color: 'var(--green)',
                  }}
                >
                  Sent
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
