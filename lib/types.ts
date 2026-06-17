export type AvailabilityType = 'Ready' | 'Incoming' | '';
export type MarketStatusType = 'Ready Market' | 'Incoming' | 'Spot' | '';

export interface PunchEntry {
  id: number;
  ts: string;
  company_to: string;
  company_from: string;
  product: string;
  vessel_name: string;
  shipment: string;
  quantity: number;
  price_fc: number;
  currency: string;
  offer_usd: number;
  exchange_rate: number;
  price_inr: number;
  delivery_term: string;
  payment_days: string;
  port: string;
  market_price: number;
  market_status: MarketStatusType;
  cost_price: number;
  replacement_cost: number;
  expense: number;
  custom_duty: number;
  sws: number;
  add: number;
  other_expense: number;
  make: string;
  packaging: string;
  origin: string;
   sales_person:string;
  broker_name?: string;
}

export interface SalePunchPayload {

   purchase_type: string;
  company_to: string;
  company_from: string;
  product: string;
  vessel_name: string;
  shipment: string;
  quantity: number;
  price_fc: number;
  currency: string;
  offer_usd: number;
  exchange_rate: number;
  price_inr: number;
  delivery_term: string;
  payment_days: string;
  port: string;
  market_price: number;
  market_status: MarketStatusType;
  cost_price: number;
  replacement_cost: number;
  expense: number;
  custom_duty: number;
  sws: number;
  add: number;
  other_expense: number;
  make: string;
  packaging: string;
  origin: string;
}

export interface FeedOptions {
  products: string[];
  ports: string[];
  companies: string[];
  makes: string[];
  packagings: string[];
  origins: string[];
  payments: string[];
  shipments: string[];
}

export interface PunchListResponse {
  rows: PunchEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePunchResponse {
  id: number;
}

// ── Sale Form ──────────────────────────────────────────────────────────────

export type SaleType = 'GST Sale' | 'Bond Sale';

export interface SaleEntry {
  id: string;
  date: string;
  salesType: string;
  companyTo: string;
  companyFrom: string;
  product: string;
  quantity: number;
  price: number;
  payment: string | null;
  deliveryTerm: string | null;
  port: string | null;
  marketPrice: number | null;
  marketStatus: string | null;
  storageDays: number | null;
  make: string | null;
  packaging: string | null;
  origin: string | null;
  transitTolerance: string | null;
  message: string | null;
  vesselName: string | null;
  remarks: string | null;
  salesPerson?: string | null;
  brokerName?: string | null;
}

export interface SaleFormPayload {
  salesType: string;
  companyTo: string;
  companyFrom: string;
  product: string;
  quantity: number;
  price: number;
  payment: string;
  deliveryTerm: string;
  port: string;
  marketPrice: number;
  marketStatus: string;
  storageDays: number;
  transitTolerance: string;
  make: string;
  packaging: string;
  origin: string;
  message: string;
  vesselName: string;
  remarks: string;
  salesPerson?: string;
  brokerName?: string;
}

export interface SaleListResponse {
  rows: SaleEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSaleResponse {
  id: number;
}
