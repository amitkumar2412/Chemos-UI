'use client';

import { useState } from 'react';
import { campaignsApi } from '../_lib/api/resources';
import type { ReplyView, ThreadItem } from '../_lib/api/types';
import { usePolling, useQuery } from '../_lib/hooks';
import { formatDateTime } from '../_lib/logic';
import { EmptyState, ErrorState, HtmlPreview, SkeletonRows, cardStyle, secondaryButton } from './ui';

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

function Thread({ campaignId, recipientId }: { campaignId: number; recipientId: number }) {
  const { data, error, reload } = useQuery(() => campaignsApi.thread(campaignId, recipientId), [campaignId, recipientId]);
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <SkeletonRows rows={2} />;
  if (data.length === 0) return <span style={{ fontSize: '13px', color: 'var(--gray)' }}>No messages yet.</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((m: ThreadItem, i) => {
        const reply = m.direction === 'REPLY';
        return (
          <div
            key={`${m.direction}-${m.replyId ?? i}`}
            style={{
              borderLeft: `3px solid ${reply ? 'var(--green)' : 'var(--blue)'}`, background: reply ? 'var(--green-dim)' : 'var(--navy-light)',
              borderRadius: '8px', padding: '10px 14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', fontSize: '12px', marginBottom: '6px' }}>
              <strong style={{ color: reply ? 'var(--green)' : 'var(--blue)' }}>{reply ? `Reply${m.from ? ` from ${m.from}` : ''}` : 'Sent by us'}</strong>
              <time dateTime={m.at} style={{ color: 'var(--gray)' }}>{formatDateTime(m.at)}</time>
            </div>
            {m.subject && <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{m.subject}</div>}
            {!m.body ? null : reply ? <ReplyBody text={m.body} /> : <HtmlPreview html={m.body} substitute={false} height={260} />}
          </div>
        );
      })}
    </div>
  );
}

export default function RepliesView({ campaignId }: { campaignId: number }) {
  const { data, error, reload } = useQuery(() => campaignsApi.allReplies(campaignId), [campaignId]);
  // New replies arrive from a background mailbox listener, so keep the view fresh while it is open.
  usePolling(reload, () => POLL_MS, true);
  const [showThread, setShowThread] = useState<number | null>(null);

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
            {showThread === customerId ? (
              <Thread campaignId={campaignId} recipientId={replies[0].recipientId} />
            ) : (
              replies.map((r) => <ReplyItem key={r.replyId} reply={r} />)
            )}
            <button
              onClick={() => setShowThread(showThread === customerId ? null : customerId)}
              style={{ ...secondaryButton, padding: '6px 14px', fontSize: '12px', marginTop: '8px' }}
            >
              {showThread === customerId ? 'Hide conversation' : 'View conversation'}
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}
