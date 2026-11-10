import { emailApi } from './client';
import type {
  Campaign,
  CampaignRecipient,
  CreateCampaignInput,
  Customer,
  CsvImportResult,
  EmailTemplate,
  ForkTemplateInput,
  MailboxStatus,
  Product,
  UpdateRecipientInput,
} from './types';

export const mailboxApi = {
  status: () => emailApi.get<MailboxStatus>('/mailbox'),
  connect: (appPassword: string) => emailApi.post('/mailbox', { body: { appPassword } }),
  disconnect: () => emailApi.delete('/mailbox'),
};

export const productsApi = {
  list: (activeOnly: boolean) => emailApi.get<Product[]>('/products', { query: { activeOnly } }),
  create: (input: { id: string; name: string; hsCode?: string; casNo?: string }) =>
    emailApi.post<Product>('/products', { body: input }),
};

export const customersApi = {
  list: (params: { activeOnly?: boolean; page: number; size: number }) =>
    emailApi.getPaged<Customer>('/customers', { query: params }),
  create: (input: { companyName: string; contactName?: string; email: string; phone?: string }) =>
    emailApi.post<Customer>('/customers', { body: input }),
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return emailApi.post<CsvImportResult>('/customers/import', { formData });
  },
};

export const templatesApi = {
  masters: () => emailApi.get<EmailTemplate[]>('/templates/masters'),
  forks: (masterId: number) => emailApi.get<EmailTemplate[]>(`/templates/${masterId}/forks`),
  personalized: (masterId: number, customerId: number) =>
    emailApi.get<EmailTemplate>(`/templates/${masterId}/personalized`, { query: { customerId } }),
  fork: (input: ForkTemplateInput) => emailApi.post<EmailTemplate>('/templates/fork', { body: input }),
};

export const campaignsApi = {
  create: (input: CreateCampaignInput) => emailApi.post<Campaign>('/campaigns', { body: input }),
  addRecipients: (id: number, customerIds: number[]) =>
    emailApi.post<CampaignRecipient[]>(`/campaigns/${id}/recipients`, { body: { customerIds } }),
  recipients: (id: number, params: { page: number; size: number }, signal?: AbortSignal) =>
    emailApi.getPaged<CampaignRecipient>(`/campaigns/${id}/recipients`, { query: params, signal }),
  setTemplates: (id: number, templateIds: number[]) =>
    emailApi.put<EmailTemplate[]>(`/campaigns/${id}/templates`, { body: { templateIds } }),
  updateRecipient: (id: number, recipientId: number, input: UpdateRecipientInput) =>
    emailApi.patch<CampaignRecipient>(`/campaigns/${id}/recipients/${recipientId}`, { body: input }),
  send: (id: number) => emailApi.post(`/campaigns/${id}/send`),
  // The API has no campaign-level progress endpoint, so progress is derived from the full recipient list.
  allRecipients: async (id: number, signal?: AbortSignal): Promise<CampaignRecipient[]> => {
    const size = 1000;
    const all: CampaignRecipient[] = [];
    for (let page = 0; ; page++) {
      const { items, total } = await emailApi.getPaged<CampaignRecipient>(`/campaigns/${id}/recipients`, { query: { page, size }, signal });
      all.push(...items);
      if (items.length < size || all.length >= total) return all;
    }
  },
};
