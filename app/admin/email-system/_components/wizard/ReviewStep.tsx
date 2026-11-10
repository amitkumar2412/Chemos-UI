'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { EmailApiError, friendlyError, isStatus } from '../../_lib/api/client';
import { campaignsApi } from '../../_lib/api/resources';
import { useCampaigns } from '../../_lib/campaigns';
import { useQuery } from '../../_lib/hooks';
import { formatPrice } from '../../_lib/logic';
import { useMailbox } from '../../_lib/mailbox';
import { Banner, ConfirmDialog, ErrorState, SkeletonRows, cardStyle, primaryButton, secondaryButton } from '../ui';

export default function ReviewStep({ campaignId }: { campaignId: number }) {
  const router = useRouter();
  const { getCampaign } = useCampaigns();
  const campaign = getCampaign(campaignId);
  const { health, loading: mailboxLoading } = useMailbox();
  const recipients = useQuery(() => campaignsApi.allRecipients(campaignId), [campaignId]);

  const [override, setOverride] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [ambiguous, setAmbiguous] = useState(false);
  const inFlight = useRef(false);

  const rows = recipients.data ?? [];
  const pending = rows.filter((r) => r.status === 'PENDING');
  const personalized = rows.filter(
    (r) => r.overrideRecipientName !== null || r.overrideOfferPrice !== null || r.assignedTemplate?.personalizedForCustomerId != null
  ).length;
  const templateCount = campaign?.templateIds?.length;
  const mailboxOk = health === 'healthy';
  const blockedByMailbox = !mailboxOk && !override;
  const alreadySent = rows.length > 0 && pending.length === 0;

  const goProgress = () => router.push(`/admin/email-system/campaigns/${campaignId}/progress`);

  // After an ambiguous failure we must look at the real statuses before allowing another send, because the
  // backend has no idempotency key and a blind retry could email customers twice.
  const checkAfterAmbiguous = async () => {
    try {
      const fresh = await campaignsApi.allRecipients(campaignId);
      if (fresh.some((r) => r.status !== 'PENDING')) {
        toast('The campaign is already sending — showing progress.');
        goProgress();
      } else {
        setAmbiguous(false);
        recipients.reload();
        toast('No emails have gone out yet. You can try sending again.');
      }
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  const send = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    try {
      await campaignsApi.send(campaignId);
      goProgress();
    } catch (err) {
      setConfirm(false);
      if (err instanceof EmailApiError && (err.status === 0 || err.status >= 500)) {
        setAmbiguous(true);
        toast.error('The send request did not complete cleanly. Check the status before trying again.');
      } else if (isStatus(err, 400)) {
        toast.error('This campaign cannot be sent — it needs a template pool and must not have been sent already.');
      } else {
        toast.error(friendlyError(err));
      }
      inFlight.current = false;
      setSending(false);
    }
  };

  if (recipients.error && !recipients.data) return <ErrorState error={recipients.error} onRetry={recipients.reload} />;
  if (recipients.loading && !recipients.data) return <SkeletonRows rows={4} />;

  const row = (label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
      <span style={{ color: 'var(--gray)' }}>{label}</span><strong>{value}</strong>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>Step 5 · Review &amp; send</h2>

      {!mailboxLoading && !mailboxOk && (
        <Banner tone="error">
          <strong>Your mailbox is not healthy ({health.replace('-', ' ')}).</strong> If you send now, customer replies will NOT be captured — and no error will tell you
          so. Connect it on the <Link href="/admin/email-system/mailbox" style={{ color: 'inherit', fontWeight: 700 }}>Mailbox page</Link> first.
          <label style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
            <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
            Send anyway, without capturing replies
          </label>
        </Banner>
      )}
      {ambiguous && (
        <Banner tone="warn">
          The last send attempt may or may not have gone through.{' '}
          <button style={{ ...secondaryButton, padding: '4px 12px' }} onClick={() => void checkAfterAmbiguous()}>Check status</button>
        </Banner>
      )}
      {alreadySent && <Banner tone="info">All recipients have already been processed. <button style={{ ...secondaryButton, padding: '4px 12px' }} onClick={goProgress}>View progress</button></Banner>}

      <div style={{ ...cardStyle, marginBottom: '18px' }}>
        {row('Chemical', campaign?.chemicalName ?? '—')}
        {row('Base price', campaign ? formatPrice(campaign.offerPrice) : '—')}
        {row('Recipients', rows.length)}
        {row('Pending (will be emailed)', pending.length)}
        {row('Templates in pool', templateCount ?? 'Not set in this browser')}
        {row('Personalized recipients', personalized)}
      </div>

      {templateCount === undefined && (
        <Banner tone="warn">Template pool wasn&apos;t set from this browser. Re-save it on the Templates step to be sure the campaign can be sent.</Banner>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button style={secondaryButton} onClick={() => router.push(`/admin/email-system/campaigns/${campaignId}/personalize`)}>← Back</button>
        <button
          style={primaryButton}
          disabled={sending || ambiguous || blockedByMailbox || pending.length === 0}
          onClick={() => setConfirm(true)}
        >
          {sending ? 'Sending…' : `Send to ${pending.length} customer${pending.length === 1 ? '' : 's'}`}
        </button>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Send campaign?"
        confirmLabel="Send now"
        busy={sending}
        onConfirm={() => void send()}
        onCancel={() => setConfirm(false)}
      >
        This will email <strong>{pending.length}</strong> customer{pending.length === 1 ? '' : 's'} and cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
