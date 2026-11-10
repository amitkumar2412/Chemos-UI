'use client';

import Link from 'next/link';
import { useMailbox, type MailboxHealth } from '../_lib/mailbox';

const PILLS: Record<MailboxHealth, { label: string; bg: string; fg: string }> = {
  healthy: { label: 'Replies on', bg: 'var(--green-dim)', fg: 'var(--green)' },
  failing: { label: 'Mailbox failing', bg: 'var(--gold-dim)', fg: 'var(--gold)' },
  'needs-reconnect': { label: 'Reconnect needed', bg: 'var(--gold-dim)', fg: 'var(--gold)' },
  'not-connected': { label: 'Not connected', bg: 'rgba(139,157,195,0.15)', fg: 'var(--gray)' },
  unknown: { label: 'Mailbox status unavailable', bg: 'var(--red-glow)', fg: 'var(--red)' },
  loading: { label: 'Checking mailbox…', bg: 'rgba(139,157,195,0.15)', fg: 'var(--gray)' },
};

export default function MailboxPill() {
  const { health } = useMailbox();
  const pill = PILLS[health];
  return (
    <Link
      href="/admin/email-system/mailbox"
      title="Mailbox status — click to manage"
      style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: pill.bg, color: pill.fg, whiteSpace: 'nowrap' }}
    >
      ● {pill.label}
    </Link>
  );
}
