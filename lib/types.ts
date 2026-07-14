import type { PortValue, StatusValue, SalesPersonValue } from './api';

export type AvailabilityType = 'Ready' | 'Incoming' | '';
export type MarketStatusType = string;

export interface MarketStatusOption {
  id: string;
  name: string;
}

export interface PaymentTermOption {
  id: number;
  paymentTerm: string;
  creditDays: number;
}

// Backend may return product as a full entity object instead of a plain string
export interface ProductEntity {
  id: string;
  name: string;
  hsCode?: string;
  casNo?: string;
}

export type ProductValue = string | ProductEntity | null;

export interface PunchEntry {
  id: number;
  ts: string;
  company_to: string;
  company_from: string;
  product: ProductValue;
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
  payment_term?: number;
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

export type SaleType = 'Export' | 'Local' | 'HSS' | 'TOW';

export interface SaleEntry {
  id: string;
  date: string;
  salesType: string;
  companyTo: string;
  companyFrom: string;
  product: ProductValue;
  quantity: number;
  price: number;
  payment: string | null;
  deliveryTerm: string | null;
  port: PortValue;
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
  salesPerson?: SalesPersonValue;
  brokerName?: string | null;
  status?: StatusValue;
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
  content: SaleEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface CreateSaleResponse {
  id: number;
}

// ── Purchase Edit Form ──────────────────────────────────────────────────────

export interface PurchaseFormPayload {
  purchaseType?: string;
  companyTo?: string;
  companyFrom?: string;
  product?: string;
  vesselName?: string;
  quantity?: number;
  priceFc?: number;
  currency?: string;
  offerUsd?: number;
  exchangeRate?: number;
  priceInr?: number;
  deliveryTerm?: string;
  paymentDays?: number;
  port?: string;
  marketPrice?: number;
  marketStatus?: string;
  costPrice?: number;
  replacementCost?: number;
  make?: string;
  packaging?: string;
  origin?: string;
  expense?: number;
  customDuty?: number;
  sws?: number;
  add?: number;
  otherExpense?: number;
  dischargePort?: string;
  priceType?: string;
  paymentTerm?: number;
  etd?: string;
  eta?: string;
}
