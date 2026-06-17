import type {
  FeedOptions,
  SalePunchPayload,
  CreatePunchResponse,
  PunchListResponse,
  SaleFormPayload,
  CreateSaleResponse,
  SaleListResponse,
  SaleEntry,
} from './types';
import { apiClient } from './apiClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export async function fetchFeedOptions(): Promise<FeedOptions> {
  const res = await fetch(`${API_BASE}/api/feed-options`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch feed options');
  return res.json();
}

/** day = YYYY-MM-DD, page/limit for pagination */
export async function fetchTodayPunches(
  day: string,
  page = 1,
  limit = 20
): Promise<PunchListResponse> {
  const params = new URLSearchParams({ day, page: String(page), limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/feed/sales_punch?${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch punches');
  return res.json();
}

export async function createPunch(
  payload: SalePunchPayload
): Promise<CreatePunchResponse> {
  return apiClient.post<CreatePunchResponse>('/purchase/create/purchase_order', payload);
}

export async function deletePunch(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/feed/sales_punch/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Delete failed');
}

/** day = YYYY-MM-DD, page/limit for pagination */
export async function fetchTodaySales(
  day: string,
  page = 1,
  limit = 20
): Promise<SaleListResponse> {
  const params = new URLSearchParams({ day, page: String(page), limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/feed/sales?${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}

export async function createSale(
  payload: SaleFormPayload
): Promise<CreateSaleResponse> {
  return apiClient.post<CreateSaleResponse>('/sales/create/sales_order', payload);
}

export async function fetchAllSales(): Promise<SaleEntry[]> {
  return apiClient.get<SaleEntry[]>('/sales/allSales');
}

export async function fetchSaleById(id: string): Promise<SaleEntry> {
  return apiClient.get<SaleEntry>(`/sales/${id}`);
}

export async function deleteSale(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/feed/sales/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Delete failed');
}

export interface PurchaseOrder {
  id: string;
  companyTo: string;
  purchaseType: string;
  companyFrom: string;
  product: string;
  vesselName: string;
  shipment: string;
  quantity: number;
  priceFc: number;
  currency: string | null;
  offerUsd: number;
  exchangeRate: number;
  priceInr: number;
  deliveryTerm: string;
  paymentDays: number;
  port: string;
  marketPrice: number;
  marketStatus: string;
  costPrice: number;
  replacementCost: number;
  make: string;
  packaging: string;
  origin: string;
  expense: number;
  customDuty: number;
  sws: number;
  add: number;
  otherExpense: number;
  dischargePorts: string;
  priceType: string;
  paymentTerm: string;
  etd: string;
  eta: string;
}

export async function fetchAllPurchases(): Promise<PurchaseOrder[]> {
  return apiClient.get<PurchaseOrder[]>('/purchase/allPurchase');
}

export async function fetchPurchaseById(id: string): Promise<PurchaseOrder> {
  return apiClient.get<PurchaseOrder>(`/purchase/${id}`);
}
