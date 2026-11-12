'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { friendlyError } from '../../_lib/api/client';
import { campaignsApi, templatesApi } from '../../_lib/api/resources';
import { useCampaigns } from '../../_lib/campaigns';
import { useQuery } from '../../_lib/hooks';
import { EmptyState, ErrorState, HtmlPreview, SkeletonRows, cardStyle, primaryButton, secondaryButton } from '../ui';

const MAX_TEMPLATES = 100;

export default function TemplatesStep({ campaignId }: { campaignId: number }) {
  const router = useRouter();
  const { getCampaign, updateCampaign } = useCampaigns();
  const masters = useQuery(() => templatesApi.masters(), []);
  const [chosen, setChosen] = useState<number[] | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = chosen ?? getCampaign(campaignId)?.templateIds ?? [];

  const toggle = (id: number) =>
    setChosen(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const save = async () => {
    if (saving || selected.length === 0) return;
    setSaving(true);
    try {
      await campaignsApi.setTemplates(campaignId, selected);
      updateCampaign(campaignId, { templateIds: selected });
      toast.success('Template pool saved');
      router.push(`/admin/email-system/campaigns/${campaignId}/personalize`);
    } catch (err) {
      toast.error(friendlyError(err));
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Step 3 · Templates</h2>
      <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '14px' }}>
        Choose one or more templates. They are rotated round-robin across recipients that you don&apos;t pick a specific template for.
      </p>

      {masters.error && !masters.data ? (
        <ErrorState error={masters.error} onRetry={masters.reload} />
      ) : masters.loading && !masters.data ? (
        <SkeletonRows />
      ) : !masters.data?.length ? (
        <EmptyState title="No templates available" text="Templates are provisioned on the email service; none were returned." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {masters.data.map((t) => {
            const on = selected.includes(t.id);
            return (
              <div key={t.id} style={{ ...cardStyle, borderColor: on ? 'var(--blue)' : 'var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
                  <input type="checkbox" checked={on} onChange={() => toggle(t.id)} style={{ marginTop: '3px' }} />
                  {t.name}
                </label>
                <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Subject: {t.subjectLine}</div>
                <HtmlPreview html={t.htmlBody} height={170} />
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <button style={secondaryButton} onClick={() => router.push(`/admin/email-system/campaigns/${campaignId}/recipients`)}>← Back</button>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--gray)' }}>{selected.length} selected</span>
          <button style={primaryButton} onClick={() => void save()} disabled={saving || selected.length === 0 || selected.length > MAX_TEMPLATES}>
            {saving ? 'Saving…' : 'Save & continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
