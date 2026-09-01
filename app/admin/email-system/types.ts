export interface Chemical {
  id: string;
  name: string;
  category: string;
  grade: string;
  packing: string;
  unit: string;
  refPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  city: string;
  segment: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  tone: string;
  subject: string;
  body: string;
}

export interface CampaignGroup {
  id: string;
  chemicalId: string;
  price: number;
  templateId: string;
  subject: string;
  body: string;
  customerIds: string[];
}

export type CampaignStatus = 'sent' | 'draft';

export interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  status: CampaignStatus;
  groups: CampaignGroup[];
}

export const PLACEHOLDERS = ['{{customer_name}}', '{{company_name}}', '{{chemical_name}}', '{{price}}'] as const;

export function renderTemplate(text: string, vars: { customerName: string; companyName: string; chemicalName: string; price: string }) {
  return text
    .split('{{customer_name}}').join(vars.customerName)
    .split('{{company_name}}').join(vars.companyName)
    .split('{{chemical_name}}').join(vars.chemicalName)
    .split('{{price}}').join(vars.price);
}
