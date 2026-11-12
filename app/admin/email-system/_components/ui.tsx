'use client';

import type { CSSProperties, ReactNode } from 'react';
import Modal from '@/components/Modal';
import { friendlyError } from '../_lib/api/client';
import type { RecipientStatus } from '../_lib/api/types';
import { STATUS_LABELS, renderPreview } from '../_lib/logic';

export const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 14px', background: 'var(--navy-light)', border: '1px solid var(--border)',
  borderRadius: '8px', fontSize: '14px', color: 'var(--white)', outline: 'none', boxSizing: 'border-box',
};

export const cardStyle: CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px',
};

export const primaryButton: CSSProperties = {
  padding: '10px 20px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: '8px',
  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
};

export const secondaryButton: CSSProperties = {
  padding: '10px 20px', background: 'transparent', color: 'var(--white)', border: '1px solid var(--border)',
  borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
};

export const dangerButton: CSSProperties = { ...primaryButton, background: 'var(--red)' };

export const thStyle: CSSProperties = {
  textAlign: 'left', padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--gray)',
  textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
};

export const tdStyle: CSSProperties = { padding: '12px 14px', fontSize: '13px', borderBottom: '1px solid var(--border)' };

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: '14px' }}>
      <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{label}</span>
      {children}
      {hint && !error && <span style={{ display: 'block', fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>{hint}</span>}
      {error && <span role="alert" style={{ display: 'block', fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>{error}</span>}
    </label>
  );
}

const STATUS_COLORS: Record<RecipientStatus, { bg: string; fg: string }> = {
  PENDING: { bg: 'rgba(139,157,195,0.15)', fg: 'var(--gray)' },
  SENT: { bg: 'var(--blue-dim)', fg: 'var(--blue)' },
  DELIVERED: { bg: 'var(--blue-dim)', fg: 'var(--blue)' },
  OPENED: { bg: 'var(--teal-dim)', fg: 'var(--teal)' },
  CLICKED: { bg: 'var(--teal-dim)', fg: 'var(--teal)' },
  REPLIED: { bg: 'var(--green-dim)', fg: 'var(--green)' },
  BOUNCED: { bg: 'var(--red-glow)', fg: 'var(--red)' },
  COMPLAINED: { bg: 'var(--red-glow)', fg: 'var(--red)' },
  FAILED: { bg: 'var(--red-glow)', fg: 'var(--red)' },
};

export function StatusChip({ status }: { status: RecipientStatus }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
  return (
    <span
      title={status === 'SENT' ? 'Sent = accepted by the mail provider, not necessarily received or read' : undefined}
      style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: c.bg, color: c.fg, whiteSpace: 'nowrap' }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Banner({ tone, children }: { tone: 'info' | 'warn' | 'error' | 'success'; children: ReactNode }) {
  const colors = {
    info: ['var(--blue-dim)', 'var(--blue)'],
    warn: ['var(--gold-dim)', 'var(--gold)'],
    error: ['var(--red-glow)', 'var(--red)'],
    success: ['var(--green-dim)', 'var(--green)'],
  }[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      style={{ background: colors[0], border: `1px solid ${colors[1]}`, borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}
    >
      {children}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Banner tone="error">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <span>{friendlyError(error)}</span>
        {onRetry && (
          <button onClick={onRetry} style={{ ...secondaryButton, padding: '6px 14px' }}>
            Retry
          </button>
        )}
      </div>
    </Banner>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--card)', borderRadius: '12px', border: '2px dashed var(--border)' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>{title}</h3>
      {text && <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: action ? '18px' : 0 }}>{text}</p>}
      {action}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ height: '40px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', opacity: 0.6 }} />
      ))}
    </div>
  );
}

export function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '13px', color: 'var(--gray)' }}>
      <span>
        {total === 0 ? 'No results' : `${page * size + 1}–${Math.min(total, (page + 1) * size)} of ${total}`}
      </span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button style={{ ...secondaryButton, padding: '6px 14px' }} disabled={page <= 0} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span>Page {page + 1} of {pages}</span>
        <button style={{ ...secondaryButton, padding: '6px 14px' }} disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open, title, children, confirmLabel, busy, danger, onConfirm, onCancel,
}: {
  open: boolean; title: string; children: ReactNode; confirmLabel: string; busy?: boolean; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal isOpen={open} onClose={onCancel} title={title} size="small">
      <div style={{ padding: '4px 0', fontSize: '14px', lineHeight: 1.6 }}>{children}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button style={secondaryButton} onClick={onCancel} disabled={busy}>Cancel</button>
        <button style={danger ? dangerButton : primaryButton} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// Template and customer HTML is untrusted: render it only inside a fully sandboxed iframe (no scripts, no same-origin).
export function HtmlPreview({ html, substitute = true, height = 280 }: { html: string; substitute?: boolean; height?: number }) {
  return (
    <iframe
      title="Email preview"
      sandbox=""
      srcDoc={substitute ? renderPreview(html) : html}
      style={{ width: '100%', height: `${height}px`, border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
    />
  );
}

export function PlaceholderCheatSheet() {
  return (
    <div style={{ fontSize: '12px', color: 'var(--gray)', background: 'var(--navy-light)', borderRadius: '8px', padding: '10px 12px', lineHeight: 1.7 }}>
      <strong style={{ color: 'var(--white)' }}>Placeholders</strong> — keep them intact, they are filled in per customer:
      <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
        <li><code>{'{{customer_name}}'}</code> recipient name</li>
        <li><code>{'{{company_name}}'}</code> company</li>
        <li><code>{'{{chemical_name}}'}</code> chemical</li>
        <li><code>{'{{price}}'}</code> offer price</li>
        <li><code>{'{{senderName}}'}</code> your name</li>
      </ul>
    </div>
  );
}
