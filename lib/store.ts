/**
 * In-memory store for development.
 * Replace with a real database (PostgreSQL, MongoDB, etc.) in production.
 */

import type { MarketStatusType } from './types';

export interface PunchRecord {
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
}

let punches: PunchRecord[] = [];
let nextId = 1;

export function getAllPunches(): PunchRecord[] {
  return punches;
}

export function addPunch(data: Omit<PunchRecord, 'id' | 'ts'>): PunchRecord {
  const entry: PunchRecord = { id: nextId++, ts: new Date().toISOString(), ...data };
  punches.push(entry);
  return entry;
}

export function deletePunchById(id: number): boolean {
  const idx = punches.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  punches.splice(idx, 1);
  return true;
}

// ── Sale Form store ──────────────────────────────────────────────────────────

import type { SaleType } from './types';

export interface SaleRecord {
  id: number;
  ts: string;
  sale_type: SaleType;
  company_to: string;
  company_from: string;
  product: string;
  quantity: number;
  price: number;
  payment: string;
  delivery_term: string;
  port: string;
  market_price: number;
  market_status: MarketStatusType;
  storage_days: number;
  make: string;
  packaging: string;
  origin: string;
}

let sales: SaleRecord[] = [];
let nextSaleId = 1;

export function getAllSales(): SaleRecord[] {
  return sales;
}

export function addSale(data: Omit<SaleRecord, 'id' | 'ts'>): SaleRecord {
  const entry: SaleRecord = { id: nextSaleId++, ts: new Date().toISOString(), ...data };
  sales.push(entry);
  return entry;
}

export function deleteSaleById(id: number): boolean {
  const idx = sales.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  sales.splice(idx, 1);
  return true;
}
