'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { friendlyError, isStatus } from '../_lib/api/client';
import { templatesApi } from '../_lib/api/resources';
import type { EmailTemplate } from '../_lib/api/types';
import { useQuery } from '../_lib/hooks';
import {
  EmptyState, ErrorState, Field, HtmlPreview, PlaceholderCheatSheet, SkeletonRows, cardStyle, inputStyle, primaryButton, secondaryButton,
} from '../_components/ui';

export default function TemplatesPage() {
  const { data, error, loading, reload } = useQuery(() => templatesApi.masters(), []);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <SkeletonRows />;
  if (!data || data.length === 0) {
    return <EmptyState title="No templates available" text="Templates are provisioned on the email service; none were returned." />;
  }

  return (
    <div>
      <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '16px' }}>
        Master templates are managed on the email service. Open one to see its saved variants or save your own copy.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {data.map((t) => (
          <div key={t.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{t.name}</h3>
            <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
              <strong style={{ color: 'var(--white)' }}>Subject:</strong> {t.subjectLine}
            </div>
            <HtmlPreview html={t.htmlBody} height={200} />
            <button style={{ ...secondaryButton, alignSelf: 'flex-start' }} onClick={() => setSelected(t)}>View variants</button>
          </div>
        ))}
      </div>
      <TemplateDetail master={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function TemplateDetail({ master, onClose }: { master: EmailTemplate | null; onClose: () => void }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const forks = useQuery(() => (master ? templatesApi.forks(master.id) : Promise.resolve([] as EmailTemplate[])), [master?.id]);

  if (!master) return null;

  const named = forks.data?.filter((f) => f.personalizedForCustomerId === null) ?? [];
  const personalized = forks.data?.filter((f) => f.personalizedForCustomerId !== null) ?? [];

  const saveAsNew = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await templatesApi.fork({ masterId: master.id, name: name.trim() });
      toast.success('Template saved');
      setName('');
      forks.reload();
    } catch (err) {
      toast.error(isStatus(err, 400) ? 'Only master templates can be copied.' : friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={master.name} size="large">
      <div style={{ marginBottom: '12px', fontSize: '14px' }}><strong>Subject:</strong> {master.subjectLine}</div>
      <HtmlPreview html={master.htmlBody} height={260} />
      <div style={{ margin: '14px 0' }}><PlaceholderCheatSheet /></div>

      <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '16px 0 8px' }}>Save as new template</h4>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Field label="Name for the copy">
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} maxLength={255} />
          </Field>
        </div>
        <button style={{ ...primaryButton, marginBottom: '14px' }} onClick={() => void saveAsNew()} disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : 'Save copy'}
        </button>
      </div>

      {forks.error ? (
        <ErrorState error={forks.error} onRetry={forks.reload} />
      ) : forks.loading && !forks.data ? (
        <SkeletonRows rows={2} />
      ) : (
        <>
          <ForkList title="Named variants" items={named} />
          <ForkList title="Personalized for a customer" items={personalized} />
        </>
      )}
    </Modal>
  );
}

function ForkList({ title, items }: { title: string; items: EmailTemplate[] }) {
  return (
    <div style={{ marginTop: '16px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{title} ({items.length})</h4>
      {items.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--gray)' }}>None yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {items.map((f) => (
            <li key={f.id} style={{ ...cardStyle, padding: '10px 14px', fontSize: '13px' }}>
              <strong>{f.name}</strong>
              {f.personalizedForCustomerId !== null && <span style={{ color: 'var(--gray)' }}> · customer #{f.personalizedForCustomerId}</span>}
              <div style={{ color: 'var(--gray)', marginTop: '2px' }}>{f.subjectLine}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
