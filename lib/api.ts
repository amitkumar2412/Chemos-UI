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
import { apiClient, tokenStorage } from './apiClient';

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

export async function fetchAllSales(page = 0, size = 10): Promise<SaleListResponse> {
  return apiClient.get<SaleListResponse>('/sales/allSales', { params: { page, size } });
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

// Backend may return port as a full entity object instead of a plain string
export interface PortEntity {
  id: string;
  displayName: string;
  searchKey?: string;
  locode?: string;
  isIndian?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PortValue = string | PortEntity | null;

export function getPortName(port: PortValue): string {
  if (!port) return '—';
  if (typeof port === 'string') return port || '—';
  return port.displayName || '—';
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
  port: PortValue;
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
  status?: string | null;
}

export async function fetchAllPurchases(params?: {
  status?: string;
  product?: string;
}): Promise<PurchaseOrder[]> {
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.product) query.product = params.product;
  return apiClient.get<PurchaseOrder[]>(
    '/purchase/allPurchase',
    Object.keys(query).length ? { params: query } : undefined
  );
}

export async function fetchPurchaseById(id: string): Promise<PurchaseOrder> {
  return apiClient.get<PurchaseOrder>(`/purchase/${id}`);
}

export async function confirmPurchase(id: string): Promise<PurchaseOrder> {
  return apiClient.patch<PurchaseOrder>(`/purchase/${id}/confirm`);
}

export async function confirmSale(id: string): Promise<SaleEntry> {
  return apiClient.patch<SaleEntry>(`/sales/${id}/confirm`);
}

export interface CompareItem {
  id: string;
  company_from: string;
  quantity: number;
  delivery_term: string;
  price_fc: number;
  currency: string;
  exchange_rate: number;
  price_inr_per_mt: number;
  valid_till: string;
  expense: number;
  custom_duty: number;
  sws: number;
  add: number;
  other_expense: number;
  landed_cost_per_mt: number;
  transit_days: number;
}

export interface CompareHighlight {
  best_id: string;
  worst_id: string;
}

export interface CompareResponse {
  purchases: CompareItem[];
  highlights: {
    price_fc?: CompareHighlight;
    price_inr_per_mt?: CompareHighlight;
    landed_cost_per_mt?: CompareHighlight;
  };
}

export async function comparePurchases(purchaseIds: string[]): Promise<CompareResponse> {
  return apiClient.post<CompareResponse>('/purchase/compare', { purchase_ids: purchaseIds });
}

export async function exportPhysicalStockCsv(): Promise<string> {
  const BASE_URL =
    (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://35.154.133.62:8082') + '/api/v1';
  const token = tokenStorage.get();
  const res = await fetch(`${BASE_URL}/purchase/export-physical-stock`, {
    method: 'GET',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Export failed');
  return res.text();
}

export interface ImportPhysicalStockResult {
  updated: number;
  skipped: number;
  errors: string[];
}

export async function importPhysicalStock(file: File): Promise<ImportPhysicalStockResult> {
  const BASE_URL =
    (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://35.154.133.62:8082') + '/api/v1';
  const token = tokenStorage.get();

  // Force text/csv so the backend parses it as CSV regardless of what the
  // OS/browser MIME registry reports (Windows often tags .csv as application/vnd.ms-excel)
  const csvBlob = new Blob([await file.arrayBuffer()], { type: 'text/csv' });
  const formData = new FormData();
  formData.append('file', csvBlob, file.name);

  const res = await fetch(`${BASE_URL}/purchase/import-physical-stock`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Import failed (${res.status}): ${msg}`);
  }
  return res.json();
}

export async function updateSale(
  id: string,
  payload: SaleFormPayload & { status?: string | null }
): Promise<SaleEntry> {
  return apiClient.put<SaleEntry>(`/sales/${id}`, payload);
}

export type AuditEntityType = 'SALE' | 'PURCHASE' | 'USER';

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  dataBefore: string | null;
  dataAfter: string | null;
  performedAt: string;
}

export interface AuditLogPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
}

export async function fetchRoles(): Promise<Role[]> {
  return apiClient.get<Role[]>('/auth/roles');
}

export async function fetchAuditLogs(
  page = 0,
  size = 20,
  entityType?: AuditEntityType
): Promise<AuditLogPage> {
  const params: Record<string, string | number | boolean> = { page, size };
  if (entityType) params.entityType = entityType;
  return apiClient.get<AuditLogPage>('/audit/logs', { params });
}
