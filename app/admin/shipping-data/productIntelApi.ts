import { apiClient } from '@/lib/apiClient';

/** One row of GET /vessel-dish-port-summary: a product × vessel × discharge-port aggregate. */
export interface DishPortSummaryRow {
  id: number;
  product: string;
  vessel_name: string;
  dish_port_clean: string;
  total_qty: number | null;
  shipment_count: number | null;
  avg_waiting_days: number | null;
  avg_berth_days: number | null;
  dish_port_share: number | null;
  ship_id: number | null;
  product_id: string;
  port_id: string | null;
  created_at: string | null;
}

export interface ProductOption {
  product_id: string;
  product: string;
  total_qty: number;
  shipments: number;
}

export interface PortStat {
  port_id: string;
  port_name: string;
  /** Other spellings seen for the same port_id (e.g. MANGALORE vs NEW MANGALORE). */
  aliases: string[];
  total_qty: number;
  shipments: number;
  vessels: number;
  avg_waiting_days: number | null;
  avg_berth_days: number | null;
}

export interface VesselStat {
  key: string;
  vessel_name: string;
  ship_id: number | null;
  total_qty: number;
  shipments: number;
  ports: string[];
  avg_waiting_days: number | null;
  avg_berth_days: number | null;
}

export interface ProductSummary {
  product: string;
  product_id: string;
  total_qty: number;
  shipments: number;
  unique_vessels: number;
  linked_vessels: number;
  port_count: number;
  avg_waiting_days: number | null;
  avg_berth_days: number | null;
  ports: PortStat[];
  vessels: VesselStat[];
  rows: DishPortSummaryRow[];
  snapshot_at: string | null;
}

// The endpoint has no filters or paging and returns the whole table (~2k rows),
// so it is fetched once per session and aggregated client-side.
let cache: Promise<DishPortSummaryRow[]> | null = null;

export function fetchDishPortSummary(): Promise<DishPortSummaryRow[]> {
  if (!cache) {
    cache = apiClient
      .get<DishPortSummaryRow[]>('/vessel-dish-port-summary')
      .then((data) => (Array.isArray(data) ? data : []))
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

export function invalidateDishPortSummary() {
  cache = null;
}

const n = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Shipment-weighted mean, ignoring rows where the metric is missing. */
class WeightedMean {
  private sum = 0;
  private weight = 0;
  add(value: number | null | undefined, weight: number) {
    if (value === null || value === undefined || !Number.isFinite(value)) return;
    const w = weight > 0 ? weight : 1;
    this.sum += value * w;
    this.weight += w;
  }
  get value(): number | null {
    return this.weight > 0 ? this.sum / this.weight : null;
  }
}

function vesselKey(row: DishPortSummaryRow) {
  return row.ship_id != null ? `id:${row.ship_id}` : `name:${row.vessel_name.trim().toUpperCase()}`;
}

function portKey(row: DishPortSummaryRow) {
  return row.port_id || `name:${row.dish_port_clean}`;
}

/** Spellings ordered by shipments, most-shipped first (e.g. ACETIC ACID before GLACIAL ACETIC ACID). */
function dominantName(names: Map<string, number>): string[] {
  return Array.from(names.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

// product_id is the cleaned key: one id can carry several raw product spellings.
export function listProducts(rows: DishPortSummaryRow[]): ProductOption[] {
  const map = new Map<string, { names: Map<string, number>; total_qty: number; shipments: number }>();
  for (const r of rows) {
    const p = map.get(r.product_id) ?? { names: new Map(), total_qty: 0, shipments: 0 };
    p.names.set(r.product, (p.names.get(r.product) ?? 0) + n(r.shipment_count));
    p.total_qty += n(r.total_qty);
    p.shipments += n(r.shipment_count);
    map.set(r.product_id, p);
  }
  return Array.from(map.entries())
    .map(([product_id, p]) => ({ product_id, product: dominantName(p.names)[0], total_qty: p.total_qty, shipments: p.shipments }))
    .sort((a, b) => a.product.localeCompare(b.product));
}

export function summarizeProduct(all: DishPortSummaryRow[], productId: string): ProductSummary | null {
  const rows = all.filter((r) => r.product_id === productId);
  if (rows.length === 0) return null;

  let totalQty = 0;
  let shipments = 0;
  const wait = new WeightedMean();
  const berth = new WeightedMean();
  const productNames = new Map<string, number>();

  const ports = new Map<
    string,
    { names: Map<string, number>; qty: number; shipments: number; vessels: Set<string>; wait: WeightedMean; berth: WeightedMean }
  >();
  const vessels = new Map<
    string,
    { name: string; ship_id: number | null; qty: number; shipments: number; ports: Set<string>; wait: WeightedMean; berth: WeightedMean }
  >();

  for (const r of rows) {
    const qty = n(r.total_qty);
    const cnt = n(r.shipment_count);
    totalQty += qty;
    shipments += cnt;
    wait.add(r.avg_waiting_days, cnt);
    berth.add(r.avg_berth_days, cnt);
    productNames.set(r.product, (productNames.get(r.product) ?? 0) + cnt);

    const pk = portKey(r);
    const vk = vesselKey(r);

    const p = ports.get(pk) ?? {
      names: new Map(),
      qty: 0,
      shipments: 0,
      vessels: new Set<string>(),
      wait: new WeightedMean(),
      berth: new WeightedMean(),
    };
    p.names.set(r.dish_port_clean, (p.names.get(r.dish_port_clean) ?? 0) + cnt);
    p.qty += qty;
    p.shipments += cnt;
    p.vessels.add(vk);
    p.wait.add(r.avg_waiting_days, cnt);
    p.berth.add(r.avg_berth_days, cnt);
    ports.set(pk, p);

    const v = vessels.get(vk) ?? {
      name: r.vessel_name,
      ship_id: r.ship_id,
      qty: 0,
      shipments: 0,
      ports: new Set<string>(),
      wait: new WeightedMean(),
      berth: new WeightedMean(),
    };
    v.qty += qty;
    v.shipments += cnt;
    v.ports.add(pk);
    v.wait.add(r.avg_waiting_days, cnt);
    v.berth.add(r.avg_berth_days, cnt);
    vessels.set(vk, v);
  }

  const portStats: PortStat[] = Array.from(ports.entries()).map(([port_id, p]) => {
    const names = dominantName(p.names);
    return {
      port_id,
      port_name: names[0],
      aliases: names.slice(1),
      total_qty: p.qty,
      shipments: p.shipments,
      vessels: p.vessels.size,
      avg_waiting_days: p.wait.value,
      avg_berth_days: p.berth.value,
    };
  });
  const portName = new Map(portStats.map((p) => [p.port_id, p.port_name]));

  const vesselStats: VesselStat[] = Array.from(vessels.entries()).map(([key, v]) => ({
    key,
    vessel_name: v.name,
    ship_id: v.ship_id,
    total_qty: v.qty,
    shipments: v.shipments,
    ports: Array.from(v.ports).map((pk) => portName.get(pk) ?? pk),
    avg_waiting_days: v.wait.value,
    avg_berth_days: v.berth.value,
  }));

  portStats.sort((a, b) => b.total_qty - a.total_qty);
  vesselStats.sort((a, b) => b.total_qty - a.total_qty);

  return {
    product: dominantName(productNames)[0],
    product_id: productId,
    total_qty: totalQty,
    shipments,
    unique_vessels: vesselStats.length,
    linked_vessels: vesselStats.filter((v) => v.ship_id != null).length,
    port_count: portStats.length,
    avg_waiting_days: wait.value,
    avg_berth_days: berth.value,
    ports: portStats,
    vessels: vesselStats,
    rows,
    snapshot_at: rows.reduce<string | null>((max, r) => (r.created_at && (!max || r.created_at > max) ? r.created_at : max), null),
  };
}
