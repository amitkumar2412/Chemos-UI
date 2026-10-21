'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import EmailSystemTabs from '../../_components/EmailSystemTabs';
import { useEmailSystem } from '../../_lib/store';
import { CHEMICALS, CUSTOMERS, EMAIL_TEMPLATES } from '../../data';
import { renderTemplate } from '../../types';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const { getCampaign } = useEmailSystem();
  const campaign = getCampaign(params.id);
  const [previewByGroup, setPreviewByGroup] = useState<Record<string, string>>({});

  if (!campaign) {
    return (
      <div style={{ padding: '32px', maxWidth: '1100px' }}>
        <EmailSystemTabs />
        <div style={{ textAlign: 'center', padding: '80px', background: 'var(--card)', borderRadius: '12px', border: '2px dashed var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Campaign not found</h3>
          <p style={{ color: 'var(--gray)', marginBottom: '18px', fontSize: '14px' }}>
            It may have been created in a different browser session — campaign data for this demo is stored locally.
          </p>
          <Link href="/admin/email-system/campaigns" style={{ color: 'var(--blue)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
            ← Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  const totalRecipients = campaign.groups.reduce((s, g) => s + g.customerIds.length, 0);

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <Link href="/admin/email-system/campaigns" style={{ color: 'var(--blue)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: '10px', display: 'inline-block' }}>
        ← Back to campaigns
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>{campaign.name}</h1>
          <p style={{ color: 'var(--gray)', fontSize: '13px' }}>
            Sent {new Date(campaign.createdAt).toLocaleString()} · {totalRecipients} recipient{totalRecipients !== 1 ? 's' : ''}
          </p>
        </div>
        <span
          style={{
            padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            background: 'var(--green-dim)', color: 'var(--green)', whiteSpace: 'nowrap',
          }}
        >
          Sent
        </span>
      </div>

      <EmailSystemTabs />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {campaign.groups.map((g, gi) => {
          const chemical = CHEMICALS.find((c) => c.id === g.chemicalId);
          const template = EMAIL_TEMPLATES.find((t) => t.id === g.templateId);
          const groupCustomers = CUSTOMERS.filter((c) => g.customerIds.includes(c.id));
          const previewId = previewByGroup[g.id] ?? groupCustomers[0]?.id;
          const previewCustomer = groupCustomers.find((c) => c.id === previewId) ?? groupCustomers[0];
          const vars = previewCustomer
            ? { customerName: previewCustomer.name, companyName: previewCustomer.companyName, chemicalName: chemical?.name ?? '', price: g.price.toLocaleString('en-IN') }
            : null;

          return (
            <div key={g.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    Group {gi + 1} · {chemical?.name} @ ₹{g.price.toLocaleString('en-IN')}/{chemical?.unit}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>Template: {template?.name}</div>
                </div>
                {groupCustomers.length > 1 && (
                  <select
                    value={previewId}
                    onChange={(e) => setPreviewByGroup((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    style={{
                      padding: '6px 12px', background: 'var(--navy-light)', border: '1px solid var(--border)',
                      borderRadius: '8px', fontSize: '12px', color: 'var(--white)', outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {groupCustomers.map((c) => (
                      <option key={c.id} value={c.id}>Preview as: {c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {vars && (
                <div style={{ background: 'var(--navy-light)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                    {renderTemplate(g.subject, vars)}
                  </div>
                  <div style={{ fontSize: '13px', whiteSpace: 'pre-line', lineHeight: 1.6, color: 'var(--gray)' }}>{renderTemplate(g.body, vars)}</div>
                </div>
              )}

              <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                Recipients: {groupCustomers.map((c) => `${c.name} (${c.email})`).join(', ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
