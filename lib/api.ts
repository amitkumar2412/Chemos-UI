import type {
  FeedOptions,
  SalePunchPayload,
  CreatePunchResponse,
  PunchListResponse,
  SaleFormPayload,
  CreateSaleResponse,
  SaleListResponse,
  SaleEntry,
  MarketStatusOption,
  PaymentTermOption,
  ProductValue,
  PurchaseFormPayload,
} from './types';
import { apiClient, tokenStorage } from './apiClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export async function fetchFeedOptions(): Promise<FeedOptions> {
  const res = await fetch(`${API_BASE}/api/feed-options`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch feed options');
  return res.json();
}

export async function fetchMarketStatuses(): Promise<MarketStatusOption[]> {
  return apiClient.get<MarketStatusOption[]>('/market-status/all');
}

export async function fetchPaymentTerms(): Promise<PaymentTermOption[]> {
  return apiClient.get<PaymentTermOption[]>('/payment-terms');
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

export async function fetchAllSales(page = 0, size = 10, status?: string): Promise<SaleListResponse> {
  const params: Record<string, any> = { page, size };
  if (status) params.status = status;
  return apiClient.get<SaleListResponse>('/sales/allSales', { params });
}

/** Pages through /sales/allSales until the last page, returning every record. */
export async function fetchAllSalesComplete(status?: string): Promise<SaleEntry[]> {
  const all: SaleEntry[] = [];
  let page = 0;
  const size = 200;
  while (true) {
    const data = await fetchAllSales(page, size, status);
    all.push(...data.content);
    if (data.last || data.content.length < size) break;
    page += 1;
  }
  return all;
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

export function getPortId(port: PortValue): string {
  if (!port) return '';
  if (typeof port === 'string') return port;
  return port.id || '';
}

export function getProductName(product: ProductValue): string {
  if (!product) return '—';
  if (typeof product === 'string') return product || '—';
  return product.name || '—';
}

export function getProductId(product: ProductValue): string {
  if (!product) return '';
  if (typeof product === 'string') return product;
  return product.id || '';
}

// Backend may return paymentTerm as a full entity object instead of a plain string
export interface PaymentTermEntity {
  id: number;
  paymentTerm: string;
  paymentCode?: string;
  creditDays?: number;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentTermValue = string | PaymentTermEntity | null;

export function getPaymentTermName(term: PaymentTermValue): string {
  if (!term) return '—';
  if (typeof term === 'string') return term || '—';
  return term.paymentTerm || '—';
}

export function getPaymentTermId(term: PaymentTermValue): string {
  if (!term) return '';
  if (typeof term === 'string') return term;
  return term.id != null ? String(term.id) : '';
}

// Backend may return origin as a full entity object instead of a plain string
export interface OriginEntity {
  id: string;
  displayName: string;
  searchKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type OriginValue = string | OriginEntity | null;

export function getOriginName(origin: OriginValue): string {
  if (!origin) return '—';
  if (typeof origin === 'string') return origin || '—';
  return origin.displayName || '—';
}

export function getOriginId(origin: OriginValue): string {
  if (!origin) return '';
  if (typeof origin === 'string') return origin;
  return origin.id || '';
}

// Backend may return status as a full entity object instead of a plain string
export interface StatusEntity {
  id: string;
  name: string;
}

export type StatusValue = string | StatusEntity | null;

export function getStatusName(status: StatusValue | undefined): string {
  if (!status) return 'UNKNOWN';
  if (typeof status === 'string') return status || 'UNKNOWN';
  return status.name || status.id || 'UNKNOWN';
}

export function getStatusId(status: StatusValue | undefined): string {
  if (!status) return '';
  if (typeof status === 'string') return status;
  return status.id || '';
}

export interface PurchaseOrder {
  id: string;
  companyTo: string;
  purchaseType: string;
  companyFrom: string;
  product: ProductValue;
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
  origin: OriginValue;
  expense: number;
  customDuty: number;
  sws: number;
  add: number;
  otherExpense: number;
  dischargePort: PortValue;
  priceType: string;
  paymentTerm: PaymentTermValue;
  etd: string;
  eta: string;
  status?: StatusValue;
}

export interface PurchaseListResponse {
  content: PurchaseOrder[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

/** Fetches a single backend page — use this for UI-driven pagination. */
export async function fetchPurchasesPage(
  page = 0,
  size = 10,
  params?: { status?: string; product?: string }
): Promise<PurchaseListResponse> {
  const query: Record<string, string | number> = { page, size };
  if (params?.status) query.status = params.status;
  if (params?.product) query.product = params.product;

  const data = await apiClient.get<PurchaseOrder[] | PurchaseListResponse>(
    '/purchase/allPurchase',
    { params: query }
  );

  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      number: 0,
      size: data.length,
      first: true,
      last: true,
      numberOfElements: data.length,
      empty: data.length === 0,
    };
  }
  return data;
}

export async function fetchAllPurchases(params?: {
  status?: string;
  product?: string;
}): Promise<PurchaseOrder[]> {
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.product) query.product = params.product;

  // Backend paginates this endpoint (defaults to a small page size when no
  // page/size is sent), so a single request can silently drop records past
  // the first page. Page through it here so callers always get everything.
  const all: PurchaseOrder[] = [];
  let page = 0;
  const size = 200;
  while (true) {
    const data = await apiClient.get<
      PurchaseOrder[] | { content: PurchaseOrder[]; totalPages?: number; last?: boolean }
    >('/purchase/allPurchase', { params: { ...query, page, size } });

    if (Array.isArray(data)) return data;

    const content = data.content ?? [];
    all.push(...content);
    if (data.last || content.length < size || (data.totalPages != null && page + 1 >= data.totalPages)) {
      break;
    }
    page += 1;
  }
  return all;
}

export async function fetchPurchaseById(id: string): Promise<PurchaseOrder> {
  return apiClient.get<PurchaseOrder>(`/purchase/${id}`);
}

export async function updatePurchase(
  id: string,
  payload: PurchaseFormPayload & { status?: string | null }
): Promise<PurchaseOrder> {
  return apiClient.put<PurchaseOrder>(`/purchase/${id}`, payload);
}

export async function confirmPurchase(id: string): Promise<PurchaseOrder> {
  return apiClient.patch<PurchaseOrder>(`/purchase/${id}/confirm`);
}

export async function unconfirmPurchase(id: string): Promise<PurchaseOrder> {
  return apiClient.patch<PurchaseOrder>(`/purchase/${id}/unconfirm`);
}

export async function cancelPurchase(id: string): Promise<PurchaseOrder> {
  return apiClient.patch<PurchaseOrder>(`/purchase/${id}/cancel`);
}

export async function confirmSale(id: string): Promise<SaleEntry> {
  return apiClient.patch<SaleEntry>(`/sales/${id}/confirm`);
}

export async function unconfirmSale(id: string): Promise<SaleEntry> {
  return apiClient.patch<SaleEntry>(`/sales/${id}/unconfirm`);
}

export async function cancelSale(id: string): Promise<SaleEntry> {
  return apiClient.patch<SaleEntry>(`/sales/${id}/cancel`);
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

// ── Sale-Purchase Links ───────────────────────────────────────────────────────

export interface SalePurchaseLink {
  id: string;
  saleId: string;
  purchaseId: string;
  linkedQuantity: number;
  purchaseOriginalQuantity: number;
  purchaseAvailableQuantity: number;
  saleTotalRequired: number;
  saleRemainingQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleLinkItem {
  linkId: string;
  purchaseId: string;
  linkedQuantity: number;
  purchaseOriginalQuantity: number;
  purchaseAvailableQuantity: number;
}

export interface SaleSummary {
  saleId: string;
  totalRequired: number;
  totalLinked: number;
  remaining: number;
  links: SaleLinkItem[];
}

export interface PurchaseLinkItem {
  linkId: string;
  saleId: string;
  linkedQuantity: number;
  saleTotalRequired: number;
  saleRemainingQuantity: number;
}

export interface PurchaseSummary {
  purchaseId: string;
  originalQuantity: number;
  totalLinked: number;
  availableQuantity: number;
  links: PurchaseLinkItem[];
}

export async function createLink(
  saleId: string,
  purchaseId: string,
  linkedQuantity: number
): Promise<SalePurchaseLink> {
  return apiClient.post<SalePurchaseLink>('/links', { saleId, purchaseId, linkedQuantity });
}

export async function updateLink(
  linkId: string,
  linkedQuantity: number
): Promise<SalePurchaseLink> {
  return apiClient.put<SalePurchaseLink>(`/links/${linkId}`, { linkedQuantity });
}

export async function deleteLink(linkId: string): Promise<void> {
  return apiClient.delete(`/links/${linkId}`);
}

export async function getSaleSummary(saleId: string): Promise<SaleSummary> {
  return apiClient.get<SaleSummary>(`/links/sale/${saleId}`);
}

export async function getPurchaseSummary(purchaseId: string): Promise<PurchaseSummary> {
  return apiClient.get<PurchaseSummary>(`/links/purchase/${purchaseId}`);
}

export async function fetchMyLinks(): Promise<SalePurchaseLink[]> {
  return apiClient.get<SalePurchaseLink[]>('/links/me');
}

// ── Stock Stats ───────────────────────────────────────────────────────────────

const STOCK_STATS_BASE =
  (process.env.NEXT_PUBLIC_STOCK_STATS_URL ??
    (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://35.154.133.62:8082')) +
  '/api/v1';

export interface StockStatsSummary {
  totalStock: number;
  physicalUnsoldClosing: number;
  incomingUnsoldClosing: number;
  incomingSold: number;
}

export interface StockStatsByProduct {
  product: string;
  dischargePort: string;
  physicalStock: number;
  physicalSold: number;
  physicalUnsold: number;
  incomingStock: number;
  purchaseIncoming: number;
  incomingSales: number;
  incomingBalance: number;
  totalStock: number;
  companyName: string;
}

export async function fetchStockStatsByProduct(): Promise<StockStatsByProduct[]> {
  const token = tokenStorage.get();
  const res = await fetch(`${STOCK_STATS_BASE}/stock-stats/by-product`, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Stock stats by-product fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchStockStatsSummary(
  vesselName?: string,
  product?: string
): Promise<StockStatsSummary> {
  const url = new URL(`${STOCK_STATS_BASE}/stock-stats/summary`);
  if (vesselName) url.searchParams.set('vesselName', vesselName);
  if (product)    url.searchParams.set('product', product);

  const token = tokenStorage.get();
  const res = await fetch(url.toString(), {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Stock stats fetch failed: ${res.status}`);
  return res.json();
}
