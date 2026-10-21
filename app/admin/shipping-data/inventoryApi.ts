export interface ShipInventoryRow {
  ship_id: number;
  vessel_name: string | null;
  voyage_departure_port_name: string | null;
  voyage_departure_utc: string | null;
  voyage_departure_label: string | null;
  voyage_arrival_port_name: string | null;
  voyage_eta_utc: string | null;
  current_area: string | null;
  area_code: string | null;
  vessel_type: string | null;
  vessel_subtype: string | null;
  vessel_updated_at: string | null;
}

export interface ShipInventoryResponse {
  total: number;
  limit: number;
  offset: number;
  data: ShipInventoryRow[];
}

interface ShipInventorySearchResponse extends ShipInventoryResponse {
  query: string;
  data: (ShipInventoryRow & { score: number })[];
}

// The backend rejects any `limit` above 10 (FastAPI validation: le=10), so we
// must page through the full list in chunks of 10 rather than one big request.
const MAX_PAGE_SIZE = 10;

export async function fetchShipInventory(signal?: AbortSignal): Promise<ShipInventoryRow[]> {
  const first = await fetchShipInventoryPage(0, MAX_PAGE_SIZE, signal);
  const rows = [...first.data];
  let offset = rows.length;
  while (offset < first.total && !signal?.aborted) {
    const page = await fetchShipInventoryPage(offset, MAX_PAGE_SIZE, signal);
    if (page.data.length === 0) break;
    rows.push(...page.data);
    offset += page.data.length;
  }
  return rows;
}

async function fetchShipInventoryPage(
  offset: number,
  limit: number,
  signal?: AbortSignal
): Promise<ShipInventoryResponse> {
  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetch(`/api/ship-inventory?${qs.toString()}`, { signal, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function searchShipInventory(query: string, signal?: AbortSignal): Promise<ShipInventoryRow[]> {
  const first = await searchShipInventoryPage(query, 0, MAX_PAGE_SIZE, signal);
  const rows = [...first.data];
  let offset = rows.length;
  while (offset < first.total && !signal?.aborted) {
    const page = await searchShipInventoryPage(query, offset, MAX_PAGE_SIZE, signal);
    if (page.data.length === 0) break;
    rows.push(...page.data);
    offset += page.data.length;
  }
  return rows;
}

async function searchShipInventoryPage(
  query: string,
  offset: number,
  limit: number,
  signal?: AbortSignal
): Promise<ShipInventorySearchResponse> {
  const qs = new URLSearchParams({ q: query, limit: String(limit), offset: String(offset) });
  const res = await fetch(`/api/ship-inventory/search?${qs.toString()}`, { signal, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }
  return res.json();
}
