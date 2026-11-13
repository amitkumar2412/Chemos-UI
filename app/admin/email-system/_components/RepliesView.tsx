'use client';

import { useState } from 'react';
import { campaignsApi } from '../_lib/api/resources';
import type { ReplyView } from '../_lib/api/types';
import { usePolling, useQuery } from '../_lib/hooks';
import { formatDateTime } from '../_lib/logic';
import { EmptyState, ErrorState, SkeletonRows, cardStyle } from './ui';

const POLL_MS = 45_000;
const COLLAPSE_AFTER = 600;

// "Ravi Sharma <ravi@acmechem.com>" -> "ravi@acmechem.com"
function addressOf(from: string): string {
  const match = /<([^>]+)>/.exec(from);
  return (match ? match[1] : from).trim().toLowerCase();
}

function ReplyBody({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > COLLAPSE_AFTER;
  const shown = long && !open ? `${text.slice(0, COLLAPSE_AFTER)}…` : text;
  return (
    <div>
      {/* Plain text only: React escapes it, pre-wrap keeps the sender's line breaks. */}
      <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '13px', lineHeight: 1.6 }}>{shown}</div>
      {long && (
        <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: '12px', padding: '4px 0' }}>
          {open ? 'Show less' : 'Show full reply'}
        </button>
      )}
    </div>
  );
}

function ReplyItem({ reply }: { reply: ReplyView }) {
  const differs = reply.fromAddress && addressOf(reply.fromAddress) !== reply.customerEmail.trim().toLowerCase();
  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>{reply.subject || '(no subject)'}</span>
        <time dateTime={reply.receivedAt} style={{ fontSize: '12px', color: 'var(--gray)' }}>{formatDateTime(reply.receivedAt)}</time>
      </div>
      {differs && (
        <div style={{ fontSize: '12px', color: 'var(--gold)', marginBottom: '6px', overflowWrap: 'anywhere' }}>Sent from {reply.fromAddress}</div>
      )}
      {reply.bodyText ? <ReplyBody text={reply.bodyText} /> : <span style={{ fontSize: '13px', color: 'var(--gray)' }}>(empty message)</span>}
    </div>
  );
}

export default function RepliesView({ campaignId }: { campaignId: number }) {
  const { data, error, reload } = useQuery(() => campaignsApi.allReplies(campaignId), [campaignId]);
  // New replies arrive from a background mailbox listener, so keep the view fresh while it is open.
  usePolling(reload, () => POLL_MS, true);

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <SkeletonRows rows={3} />;
  if (data.length === 0) return <EmptyState title="No replies yet" text="Replies from customers will appear here automatically." />;

  // The list is newest-first, so Map insertion order puts the customer who replied most recently on top.
  const groups = new Map<number, ReplyView[]>();
  for (const r of data) {
    const list = groups.get(r.customerId) ?? [];
    list.push(r);
    groups.set(r.customerId, list);
  }

  return (
    <div>
      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '12px' }}>
        {data.length} {data.length === 1 ? 'reply' : 'replies'} from {groups.size} {groups.size === 1 ? 'customer' : 'customers'} · refreshes automatically
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[...groups.entries()].map(([customerId, replies]) => (
          <section key={customerId} style={cardStyle}>
            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{replies[0].customerName || replies[0].customerEmail}</div>
                {replies[0].customerName && <div style={{ fontSize: '12px', color: 'var(--gray)', overflowWrap: 'anywhere' }}>{replies[0].customerEmail}</div>}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--gray)' }}>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
            </div>
            {replies.map((r) => <ReplyItem key={r.replyId} reply={r} />)}
          </section>
        ))}
      </div>
    </div>
  );
}
