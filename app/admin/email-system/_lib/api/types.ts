export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'CANCELLED';

export type RecipientStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'OPENED'
  | 'CLICKED'
  | 'REPLIED'
  | 'BOUNCED'
  | 'COMPLAINED'
  | 'FAILED';

export interface Product {
  id: string;
  name: string;
  hsCode?: string | null;
  casNo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  companyName: string;
  contactName?: string | null;
  email: string;
  phone?: string | null;
  active: boolean;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subjectLine: string;
  htmlBody: string;
  active: boolean;
  parentTemplateId: number | null;
  personalizedForCustomerId: number | null;
  createdForCampaignId: number | null;
}

export interface Campaign {
  id: number;
  name: string;
  chemical: Product;
  offerPrice: number;
  status: CampaignStatus;
  scheduledAt?: string | null;
  templatePool?: EmailTemplate[];
}

export interface CampaignRecipient {
  id: number;
  customer: Customer;
  assignedTemplate: EmailTemplate | null;
  overrideRecipientName: string | null;
  overrideOfferPrice: number | null;
  status: RecipientStatus;
  trackingToken?: string;
  sentAt?: string | null;
  openedAt?: string | null;
  clickedAt?: string | null;
  repliedAt?: string | null;
}

export interface MailboxStatus {
  connected: boolean;
  connectedAt: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  lastErrorAt: string | null;
  needsReconnect: boolean;
}

export interface CsvImportError {
  rowNumber: number;
  email: string | null;
  reason: string;
}

export interface CsvImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: CsvImportError[];
}

export interface Paged<T> {
  items: T[];
  total: number;
}

export interface CreateCampaignInput {
  name: string;
  chemicalId: string;
  offerPrice: number;
}

export interface UpdateRecipientInput {
  templateId?: number;
  overrideName?: string;
  overridePrice?: number;
  subjectLine?: string;
  htmlBody?: string;
}

export interface ForkTemplateInput {
  masterId: number;
  campaignId?: number;
  name?: string;
  subjectLine?: string;
  htmlBody?: string;
}
