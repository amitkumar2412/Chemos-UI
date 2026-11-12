'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { friendlyError, isStatus } from '../../_lib/api/client';
import { campaignsApi, templatesApi } from '../../_lib/api/resources';
import type { CampaignRecipient, EmailTemplate } from '../../_lib/api/types';
import { useQuery } from '../../_lib/hooks';
import { buildRecipientPatch, formatPrice, type PersonalizationDraft } from '../../_lib/logic';
import {
  ConfirmDialog, EmptyState, ErrorState, Field, HtmlPreview, Pager, PlaceholderCheatSheet, SkeletonRows, StatusChip,
  inputStyle, primaryButton, secondaryButton, tdStyle, thStyle,
} from '../ui';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 25;

export default function PersonalizeStep({ campaignId }: { campaignId: number }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [updated, setUpdated] = useState<Record<number, CampaignRecipient>>({});
  const [editing, setEditing] = useState<CampaignRecipient | null>(null);

  const recipients = useQuery(() => campaignsApi.recipients(campaignId, { page, size: PAGE_SIZE }), [campaignId, page]);
  const masters = useQuery(() => templatesApi.masters(), []);

  const rows = (recipients.data?.items ?? []).map((r) => updated[r.id] ?? r);

  const refresh = () => {
    setUpdated({});
    recipients.reload();
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Step 4 · Personalize (optional)</h2>
      <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '14px' }}>
        Change the template, name, price or wording for individual recipients. Recipients can only be edited while they are Pending.
      </p>

      {recipients.error && !recipients.data ? (
        <ErrorState error={recipients.error} onRetry={recipients.reload} />
      ) : recipients.loading && !recipients.data ? (
        <SkeletonRows />
      ) : recipients.data && recipients.data.total === 0 ? (
        <EmptyState title="No recipients yet" text="Add recipients before personalizing." action={<button style={primaryButton} onClick={() => router.push(`/admin/email-system/campaigns/${campaignId}/recipients`)}>Add recipients</button>} />
      ) : (
        <>
          <div style={{ overflowX: 'auto', opacity: recipients.loading ? 0.6 : 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
              <thead>
                <tr>{['Customer', 'Template', 'Name override', 'Price override', 'Status', ''].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{r.customer.companyName}</div>
                      <div style={{ color: 'var(--gray)', fontSize: '12px' }}>{r.customer.email}</div>
                    </td>
                    <td style={tdStyle}>{r.assignedTemplate?.name ?? <span style={{ color: 'var(--gray)' }}>Rotated automatically</span>}</td>
                    <td style={tdStyle}>{r.overrideRecipientName ?? '—'}</td>
                    <td style={tdStyle}>{r.overrideOfferPrice !== null ? formatPrice(r.overrideOfferPrice) : '—'}</td>
                    <td style={tdStyle}><StatusChip status={r.status} /></td>
                    <td style={tdStyle}>
                      <button style={{ ...secondaryButton, padding: '6px 14px' }} disabled={r.status !== 'PENDING'} onClick={() => setEditing(r)}>
                        {r.status === 'PENDING' ? 'Edit' : 'Locked'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} size={PAGE_SIZE} total={recipients.data?.total ?? 0} onPage={setPage} />
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button style={secondaryButton} onClick={() => router.push(`/admin/email-system/campaigns/${campaignId}/templates`)}>← Back</button>
        <button style={primaryButton} onClick={() => router.push(`/admin/email-system/campaigns/${campaignId}/review`)}>Continue to review →</button>
      </div>

      {editing && (
        <RecipientEditor
          key={editing.id}
          campaignId={campaignId}
          row={editing}
          masters={masters.data ?? []}
          mastersError={masters.error}
          onClose={() => setEditing(null)}
          onSaved={(row) => {
            setUpdated((prev) => ({ ...prev, [row.id]: row }));
            setEditing(null);
          }}
          onLocked={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function masterIdOf(template: EmailTemplate | null): number | null {
  if (!template) return null;
  return template.parentTemplateId ?? template.id;
}

function RecipientEditor({
  campaignId, row, masters, mastersError, onClose, onSaved, onLocked,
}: {
  campaignId: number; row: CampaignRecipient; masters: EmailTemplate[]; mastersError: unknown;
  onClose: () => void; onSaved: (row: CampaignRecipient) => void; onLocked: () => void;
}) {
  const initialPrefill = { subjectLine: row.assignedTemplate?.subjectLine ?? '', htmlBody: row.assignedTemplate?.htmlBody ?? '' };
  const [draft, setDraft] = useState<PersonalizationDraft>({
    templateId: masterIdOf(row.assignedTemplate),
    overrideName: row.overrideRecipientName ?? '',
    overridePrice: row.overrideOfferPrice !== null ? String(row.overrideOfferPrice) : '',
    ...initialPrefill,
  });
  const [prefill, setPrefill] = useState(initialPrefill);
  const [loadingText, setLoadingText] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const requestId = useRef(0);

  const pickTemplate = async (value: string) => {
    const masterId = value ? Number(value) : null;
    const current = ++requestId.current;
    setDraft((d) => ({ ...d, templateId: masterId }));
    if (masterId === null) return;
    const master = masters.find((m) => m.id === masterId);
    setLoadingText(true);
    let text = { subjectLine: master?.subjectLine ?? '', htmlBody: master?.htmlBody ?? '' };
    try {
      // 200: this customer's earlier wording for the template. 404: never personalized, so use the master text.
      const fork = await templatesApi.personalized(masterId, row.customer.id);
      text = { subjectLine: fork.subjectLine, htmlBody: fork.htmlBody };
    } catch (err) {
      if (!isStatus(err, 404)) toast.error('Could not load this customer\'s previous wording; using the master text.');
    }
    if (current !== requestId.current) return;
    setPrefill(text);
    setDraft((d) => ({ ...d, ...text }));
    setLoadingText(false);
  };

  const patch = buildRecipientPatch(draft, prefill);
  const bodyChanged = patch.body?.htmlBody !== undefined;

  const save = async () => {
    if (!patch.body || saving) return;
    setSaving(true);
    try {
      const saved = await campaignsApi.updateRecipient(campaignId, row.id, patch.body);
      toast.success('Recipient updated');
      onSaved(saved);
    } catch (err) {
      setConfirm(false);
      if (isStatus(err, 400)) {
        toast.error('This recipient is no longer pending, so it is locked. The list has been refreshed.');
        onLocked();
      } else {
        toast.error(friendlyError(err));
        setSaving(false);
      }
    }
  };

  const onSave = () => {
    setFormError(undefined);
    if (patch.error) return setFormError(patch.error);
    if (bodyChanged) setConfirm(true);
    else void save();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Personalize — ${row.customer.companyName}`} size="large">
      <Field label="Template" hint="Pick a template to edit its subject and body for this customer. Leave unchanged to keep the automatic rotation.">
        <select style={inputStyle} value={draft.templateId ?? ''} onChange={(e) => void pickTemplate(e.target.value)}>
          <option value="">{row.assignedTemplate ? '—' : 'Rotated automatically'}</option>
          {masters.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>
      {mastersError ? <ErrorState error={mastersError} /> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Field label="Recipient name override" hint="Replaces {{customer_name}}. Leave empty to keep the default.">
          <input style={inputStyle} value={draft.overrideName} maxLength={255} onChange={(e) => setDraft({ ...draft, overrideName: e.target.value })} />
        </Field>
        <Field label="Price override" hint="Replaces {{price}}. Positive, up to 2 decimals.">
          <input style={inputStyle} inputMode="decimal" value={draft.overridePrice} onChange={(e) => setDraft({ ...draft, overridePrice: e.target.value })} />
        </Field>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--gray)', margin: '-6px 0 14px' }}>Saved overrides cannot be cleared from here.</p>

      {draft.templateId !== null && (
        <>
          <Field label="Subject (plain text)">
            <input style={inputStyle} value={draft.subjectLine} maxLength={255} disabled={loadingText} onChange={(e) => setDraft({ ...draft, subjectLine: e.target.value })} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Body (HTML)">
              <textarea
                style={{ ...inputStyle, height: '260px', fontFamily: 'monospace', fontSize: '12px' }}
                value={draft.htmlBody}
                disabled={loadingText}
                onChange={(e) => setDraft({ ...draft, htmlBody: e.target.value })}
              />
            </Field>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Preview (sample values)</div>
              <HtmlPreview html={draft.htmlBody} height={260} />
            </div>
          </div>
          <PlaceholderCheatSheet />
        </>
      )}

      {formError && <p role="alert" style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{formError}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
        <button style={secondaryButton} onClick={onClose}>Cancel</button>
        <button style={primaryButton} onClick={onSave} disabled={saving || loadingText}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Replace previous version?"
        confirmLabel="Replace and save"
        busy={saving}
        onConfirm={() => void save()}
        onCancel={() => setConfirm(false)}
      >
        This replaces your previous version of this template for this customer. There is no version history.
      </ConfirmDialog>
    </Modal>
  );
}
