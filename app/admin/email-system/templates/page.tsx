'use client';

import { useState } from 'react';
import EmailSystemTabs from '../_components/EmailSystemTabs';
import { EMAIL_TEMPLATES } from '../data';

export default function TemplatesPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Email System</h1>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
          Ready-to-use email templates. {'{{ }}'} placeholders are filled automatically per customer when a campaign is sent.
        </p>
      </div>

      <EmailSystemTabs />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {EMAIL_TEMPLATES.map((t) => {
          const open = openId === t.id;
          return (
            <div
              key={t.id}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{t.name}</h3>
                <span
                  style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                    background: 'var(--gold-dim)', color: 'var(--gold)', whiteSpace: 'nowrap',
                  }}
                >
                  {t.tone}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '10px' }}>
                <strong style={{ color: 'var(--white)' }}>Subject:</strong> {t.subject}
              </div>
              <p
                style={{
                  fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6, whiteSpace: 'pre-line',
                  display: open ? 'block' : '-webkit-box',
                  WebkitLineClamp: open ? undefined : 4,
                  WebkitBoxOrient: open ? undefined : 'vertical',
                  overflow: open ? 'visible' : 'hidden',
                  flex: 1,
                }}
              >
                {t.body}
              </p>
              <button
                onClick={() => setOpenId(open ? null : t.id)}
                style={{
                  alignSelf: 'flex-start', marginTop: '10px', background: 'none', border: 'none',
                  color: 'var(--blue)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0,
                }}
              >
                {open ? 'Show less' : 'Read full template'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
