'use client';

import Link from 'next/link';
import EmailSystemTabs from '../_components/EmailSystemTabs';
import { useEmailSystem } from '../_lib/store';
import { CHEMICALS, EMAIL_TEMPLATES } from '../data';

export default function CampaignsPage() {
  const { campaigns } = useEmailSystem();

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Email System</h1>
          <p style={{ color: 'var(--gray)', fontSize: '14px' }}>Campaign history.</p>
        </div>
        <Link
          href="/admin/email-system/campaigns/new"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--blue)',
            color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          New Campaign
        </Link>
      </div>

      <EmailSystemTabs />

      {campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'var(--card)', borderRadius: '12px', border: '2px dashed var(--border)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No campaigns yet</h3>
          <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>Get started by creating your first campaign</p>
          <Link
            href="/admin/email-system/campaigns/new"
            style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--blue)', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                {['Campaign', 'Chemicals', 'Templates', 'Recipients', 'Sent', 'Status'].map((col) => (
                  <th key={col} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, idx) => {
                const recipients = c.groups.reduce((s, g) => s + g.customerIds.length, 0);
                const chemicalNames = c.groups.map((g) => CHEMICALS.find((ch) => ch.id === g.chemicalId)?.name).filter(Boolean);
                const templateNames = Array.from(new Set(c.groups.map((g) => EMAIL_TEMPLATES.find((t) => t.id === g.templateId)?.name).filter(Boolean)));
                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: idx < campaigns.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <td style={{ padding: '15px 20px', fontSize: '14px', fontWeight: 600 }}>
                      <Link href={`/admin/email-system/campaigns/${c.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {c.name}
                      </Link>
                    </td>
                    <td style={{ padding: '15px 20px', fontSize: '13px', color: 'var(--gray)' }}>{chemicalNames.join(', ')}</td>
                    <td style={{ padding: '15px 20px', fontSize: '13px', color: 'var(--gray)' }}>{templateNames.join(', ')}</td>
                    <td style={{ padding: '15px 20px', fontSize: '13px' }}>{recipients}</td>
                    <td style={{ padding: '15px 20px', fontSize: '13px', color: 'var(--gray)' }}>{new Date(c.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <span
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: 600, background: 'var(--green-dim)', color: 'var(--green)',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
                        Sent
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
