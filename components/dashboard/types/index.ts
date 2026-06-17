// ─── Dashboard Domain Types ────────────────────────────────────────────────
// All interfaces here mirror the shape expected from the backend API.
// Currently wired to mock data; swap mock imports for API calls per component.

export type Currency = 'inr' | 'usd' | 'eur';
export type Period = 'today' | 'mtd' | 'qtd' | 'ytd';
export type KpiUnit = 'currency' | 'percent' | 'count';
export type AlertSeverity = 'critical' | 'warning' | 'watch';
export type AlertScope = 'internal' | 'external';
export type StageStatus = 'done' | 'active' | 'pending';
export type InventoryStatus = 'ok' | 'warn' | 'critical' | 'negative';
export type Recommendation = 'PURSUE' | 'MARGINAL' | 'DECLINE';

// ─── KPI ──────────────────────────────────────────────────────────────────
export interface Kpi {
  id: string;
  label: string;
  unit: KpiUnit;
  baseValue: number | string;
  change: number;
  direction: 'up' | 'down';
  vs: string;
  details: [string, string][];
  spark: number[];
}

// ─── Alert ────────────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  desc: string;
  source: string;
  time: string;
  ack: boolean;
  owner: string | null;
  scope: AlertScope;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────
export interface PipelineStage {
  label: string;
  icon: string;
  status: StageStatus;
  insight: string;
  vars: string[];
  pct: number;
}

// ─── Inventory (ICC) ──────────────────────────────────────────────────────
export interface IccItem {
  item: string;
  port: string;
  company: string;
  physical: number;
  ready: number;
  safety: number;
  reorder: number;
  market: number;
  selling: number;
  trend7d: number[];
  status: InventoryStatus;
}

// ─── Vendor ───────────────────────────────────────────────────────────────
export interface Vendor {
  name: string;
  quality: number;
  delivery: number;
  price: number;
  responsiveness: number;
  compliance: number;
  overall: number;
  hq: string;
  port: string;
  commodities: { chem: string; qty: number }[];
}

// ─── Port ─────────────────────────────────────────────────────────────────
export interface Port {
  name: string;
  city: string;
  type: string;
  volume: string;
  vendors: string;
  status: 'Primary' | 'Secondary' | 'Tertiary';
}

// ─── Prospect Supplier ────────────────────────────────────────────────────
export interface ProspectSupplier {
  chem: string;
  supplier: string;
  country: string;
  capacity: string;
  lead: string;
  note: string;
}

// ─── Top Customer / Supplier ──────────────────────────────────────────────
export interface TopPartner {
  name: string;
  value: number;
  pct: number;
}

// ─── KPI Driver ───────────────────────────────────────────────────────────
export interface KpiDriver {
  driver: string;
  impact: string;
  direction: 'up' | 'down';
}

// ─── Cashflow ─────────────────────────────────────────────────────────────
export interface CashflowItem {
  label: string;
  value: number;
  type: 'total' | 'pos' | 'neg';
}

// ─── Finance Offer ────────────────────────────────────────────────────────
export interface FinanceOffer {
  rank: number;
  item: string;
  port: string;
  company: string;
  family: string;
  qty: number;
  buyPrice: number;
  sellPrice: number;
  period: number;
  roic: number;
  wacc: number;
  spread: number;
  recommendation: Recommendation;
}

// ─── Shock Chemical ───────────────────────────────────────────────────────
export interface ShockChemical {
  name: string;
  base: number;
  crudeCoeff: number;
  fxCoeff: number;
  supplyCoeff: number;
}

// ─── News Item ────────────────────────────────────────────────────────────
export interface NewsItem {
  title: string;
  sentiment: 'pos' | 'neg' | 'neu';
  source: string;
  time: string;
  tags: string[];
  detail: string;
}

// ─── Notification ─────────────────────────────────────────────────────────
export interface Notification {
  icon: string;
  text: string;
  time: string;
  read: boolean;
}

// ─── Revenue Data ─────────────────────────────────────────────────────────
export interface RevenueDataset {
  labels: string[];
  revenue: number[];
  cost: number[];
  profit: number[];
}

// ─── Dashboard Context (global state passed down) ─────────────────────────
export interface DashboardContext {
  period: Period;
  currency: Currency;
  asOf: string | null;
}
