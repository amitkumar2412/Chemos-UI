'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { friendlyError } from '../_lib/api/client';
import { mailboxApi } from '../_lib/api/resources';
import { formatDateTime } from '../_lib/logic';
import { useMailbox } from '../_lib/mailbox';
import { Banner, ConfirmDialog, ErrorState, Field, SkeletonRows, cardStyle, dangerButton, inputStyle, primaryButton } from '../_components/ui';

const POLL_INTERVAL_MS = 3000;
const POLL_LIMIT_MS = 30000;

export default function MailboxPage() {
  const { status, error, loading, health, refresh } = useMailbox();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(pollTimer.current), []);

  // There is no "test connection" call, so after submitting we poll the status for a short while.
  const pollForResult = (startedAt: number, previousConnectedAt: string | null) => {
    pollTimer.current = setTimeout(async () => {
      const next = await refresh();
      const settled =
        next && next.connected && next.consecutiveFailures === 0 && !next.needsReconnect && next.connectedAt !== previousConnectedAt;
      const failed = next && (next.needsReconnect || next.consecutiveFailures > 0);
      if (settled) {
        setVerifying(false);
        toast.success('Mailbox connected');
      } else if (failed) {
        setVerifying(false);
      } else if (Date.now() - startedAt < POLL_LIMIT_MS) {
        pollForResult(startedAt, previousConnectedAt);
      } else {
        setVerifying(false);
      }
    }, POLL_INTERVAL_MS);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || submitting) return;
    setSubmitting(true);
    const previousConnectedAt = status?.connectedAt ?? null;
    try {
      await mailboxApi.connect(password);
      setPassword('');
      setVerifying(true);
      await refresh();
      pollForResult(Date.now(), previousConnectedAt);
    } catch (err) {
      setPassword('');
      toast.error(friendlyError(err, 'Could not save the app password.'));
    } finally {
      setSubmitting(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await mailboxApi.disconnect();
      toast.success('Mailbox disconnected');
      setConfirmDisconnect(false);
      await refresh();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading && !status) return <SkeletonRows rows={3} />;
  if (!status) return <ErrorState error={error} onRetry={() => void refresh()} />;

  const showForm = health === 'not-connected' || health === 'needs-reconnect' || health === 'failing' || verifying;

  return (
    <div style={{ maxWidth: '720px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Mailbox</h2>
      <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '18px' }}>
        Connect your Gmail / Google Workspace mailbox so customer replies to your campaigns are captured. Connect it
        <strong> before </strong> sending a campaign — replies to campaigns sent without a connected mailbox are never captured, and there is no error.
      </p>

      {health === 'needs-reconnect' && (
        <Banner tone="error">
          Google rejected the login repeatedly, so the mailbox is <strong>paused</strong>. Submit a new app password to resume.
          {status.lastError && <div style={{ marginTop: '6px' }}>Last error: {status.lastError} ({formatDateTime(status.lastErrorAt)})</div>}
        </Banner>
      )}
      {health === 'failing' && (
        <Banner tone="warn">
          The last {status.consecutiveFailures} attempt{status.consecutiveFailures === 1 ? '' : 's'} to read your mailbox failed — retrying automatically.
          {status.lastError && <div style={{ marginTop: '6px' }}>Last error: {status.lastError} ({formatDateTime(status.lastErrorAt)})</div>}
        </Banner>
      )}
      {health === 'healthy' && (
        <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--green)' }}>● Connected — replies are being captured</div>
            <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '4px' }}>Connected since {formatDateTime(status.connectedAt)}</div>
          </div>
          <button style={dangerButton} onClick={() => setConfirmDisconnect(true)}>Disconnect</button>
        </div>
      )}
      {health !== 'healthy' && health !== 'not-connected' && (
        <div style={{ marginBottom: '16px' }}>
          <button style={{ ...dangerButton, padding: '6px 14px' }} onClick={() => setConfirmDisconnect(true)}>Disconnect mailbox</button>
        </div>
      )}
      {verifying && <Banner tone="info">Checking the connection with Google… this can take up to 30 seconds.</Banner>}

      {showForm && (
        <form onSubmit={submit} style={cardStyle}>
          <Field label="Google App Password" hint="Spaces are fine, e.g. abcd efgh ijkl mnop. It is encrypted at rest and never shown again.">
            <input
              type="password"
              autoComplete="off"
              value={password}
              maxLength={255}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="xxxx xxxx xxxx xxxx"
            />
          </Field>
          <details style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '14px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>How do I create an App Password?</summary>
            <ol style={{ paddingLeft: '18px', lineHeight: 1.7, marginTop: '8px' }}>
              <li>Open your Google Account → Security.</li>
              <li>Turn on 2-Step Verification if it is not already on.</li>
              <li>Open “App passwords”, create one, and paste the 16-character code here.</li>
              <li>This is not your normal Google password.</li>
            </ol>
          </details>
          <button type="submit" style={primaryButton} disabled={submitting || !password.trim()}>
            {submitting ? 'Saving…' : health === 'not-connected' ? 'Connect mailbox' : 'Submit new password'}
          </button>
        </form>
      )}

      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect mailbox?"
        confirmLabel="Disconnect"
        danger
        busy={disconnecting}
        onConfirm={() => void disconnect()}
        onCancel={() => setConfirmDisconnect(false)}
      >
        Replies to your campaigns will stop being captured until you connect a mailbox again. The stored credential is deleted.
      </ConfirmDialog>
    </div>
  );
}
