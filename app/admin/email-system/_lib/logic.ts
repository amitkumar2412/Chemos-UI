import type { RecipientStatus, UpdateRecipientInput } from './api/types';

export const PLACEHOLDERS = [
  { token: '{{customer_name}}', sample: 'Priya Sharma', note: "Recipient's name (can be overridden per recipient)" },
  { token: '{{company_name}}', sample: 'Acme Chemicals Pvt Ltd', note: "Customer's company" },
  { token: '{{chemical_name}}', sample: 'Urea 46%', note: 'Campaign chemical' },
  { token: '{{price}}', sample: '425.00', note: 'Offer price (can be overridden per recipient)' },
  { token: '{{senderName}}', sample: 'Your Name', note: 'Your display name' },
] as const;

export function renderPreview(text: string): string {
  return PLACEHOLDERS.reduce((out, p) => out.split(p.token).join(p.sample), text);
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

// The backend stores a bare number; currency is intentionally not assumed.
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PRICE_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

// Mirrors backend limits: positive, at most 10 integer digits and 2 decimals.
export function parsePrice(input: string): { value?: number; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { error: 'Price is required' };
  if (!PRICE_PATTERN.test(trimmed)) return { error: 'Enter a positive amount with at most 2 decimals' };
  const value = Number(trimmed);
  if (!(value > 0)) return { error: 'Price must be greater than 0' };
  return { value };
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const STATUS_LABELS: Record<RecipientStatus, string> = {
  PENDING: 'Pending',
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  OPENED: 'Opened',
  CLICKED: 'Clicked',
  REPLIED: 'Replied',
  BOUNCED: 'Bounced',
  COMPLAINED: 'Complained',
  FAILED: 'Failed',
};

export const ALL_STATUSES = Object.keys(STATUS_LABELS) as RecipientStatus[];

export interface PersonalizationDraft {
  templateId: number | null;
  overrideName: string;
  overridePrice: string;
  subjectLine: string;
  htmlBody: string;
}

// Builds the PATCH body. Subject/body are sent only when edited (otherwise an untouched prefill would fork a
// pointless personalization), overrides only when set, and templateId is always a master id.
export function buildRecipientPatch(
  draft: PersonalizationDraft,
  prefill: { subjectLine: string; htmlBody: string }
): { body?: UpdateRecipientInput; error?: string } {
  const body: UpdateRecipientInput = {};
  if (draft.templateId !== null) body.templateId = draft.templateId;

  const name = draft.overrideName.trim();
  if (name) {
    if (name.length > 255) return { error: 'Name override must be 255 characters or fewer' };
    body.overrideName = name;
  }
  if (draft.overridePrice.trim()) {
    const price = parsePrice(draft.overridePrice);
    if (price.error) return { error: price.error };
    body.overridePrice = price.value;
  }
  if (draft.templateId !== null && draft.subjectLine !== prefill.subjectLine) {
    if (draft.subjectLine.length > 255) return { error: 'Subject must be 255 characters or fewer' };
    body.subjectLine = draft.subjectLine;
  }
  if (draft.templateId !== null && draft.htmlBody !== prefill.htmlBody) {
    if (draft.htmlBody.length > 200000) return { error: 'Body is too long' };
    body.htmlBody = draft.htmlBody;
  }
  if (Object.keys(body).length === 0) return { error: 'Nothing to save — change a template, name, price or text first.' };
  return { body };
}

export function statusCounts<T extends { status: RecipientStatus }>(rows: T[]): Partial<Record<RecipientStatus, number>> {
  const counts: Partial<Record<RecipientStatus, number>> = {};
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}
