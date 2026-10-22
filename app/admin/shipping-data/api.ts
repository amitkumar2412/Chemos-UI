import { apiClient } from '@/lib/apiClient';
import type { Vessel } from './data';

interface ApiShipRow {
  id: number;
  vessel_ship_id: number;
  vessel_name: string | null;
  vessel_ais_name: string | null;
  vessel_imo: number | null;
  vessel_eni: string | null;
  vessel_mmsi: number | null;
  vessel_length: number | null;
  vessel_width: number | null;
  vessel_callsign: string | null;
  vessel_country: string | null;
  vessel_country_code: string | null;
  vessel_type: string | null;
  vessel_type_id: number | null;
  vessel_com_fleet_grouped_type_id: number | null;
  vessel_com_fleet_grouped_type_name: string | null;
  vessel_type_color_id: number | null;
  vessel_subtype: string | null;
  vessel_year_built: number | null;
  vessel_service_status: string | null;
  vessel_home_port: string | null;
  vessel_ais_transponder_class: string | null;
  vessel_is_navigational_aid: number | null;
  vessel_corresponding_roaming_station_id: string | null;
  vessel_market_id: number | null;
  vessel_market_name: string | null;
  vessel_size_class_name: string | null;
  vessel_ais_ship_type: string | null;
  vessel_summary_position: string | null;
  vessel_summary_particulars: string | null;
  vessel_first_seen_at: string | null;
  vessel_updated_at: string | null;

  position_id: number | null;
  position_ship_id: number | null;
  position_position_ts: number | null;
  position_position_utc: string | null;
  position_vessel_local_time: string | null;
  position_timezone: number | null;
  position_lat: number | null;
  position_lon: number | null;
  position_speed: number | null;
  position_course: number | null;
  position_heading: number | null;
  position_rate_of_turn: number | null;
  position_draught: number | null;
  position_navigational_status: string | null;
  position_station_id: string | null;
  position_station_type: string | null;
  position_station_name: string | null;
  position_operator_name: string | null;
  position_area_name: string | null;
  position_area_code: string | null;
  position_is_vessel_in_range: number | null;
  position_has_newer_satellite_position: number | null;
  position_scraped_at: string | null;

  voyage_id: number | null;
  voyage_ship_id: number | null;
  voyage_departure_port_id: number | null;
  voyage_departure_port_name: string | null;
  voyage_departure_unlocode: string | null;
  voyage_departure_ts: number | null;
  voyage_departure_utc: string | null;
  voyage_departure_label: string | null;
  voyage_arrival_port_id: number | null;
  voyage_arrival_port_name: string | null;
  voyage_arrival_unlocode: string | null;
  voyage_arrival_ts: number | null;
  voyage_arrival_utc: string | null;
  voyage_arrival_label: string | null;
  voyage_reported_destination: string | null;
  voyage_eta_ts: number | null;
  voyage_eta_utc: string | null;
  voyage_eta_timezone: number | null;
  voyage_eta_calc_ts: number | null;
  voyage_eta_calc_timezone: number | null;
  voyage_progress: number | null;
  voyage_distance_travelled: number | null;
  voyage_distance_to_go: number | null;
  voyage_last_port_time: number | null;
  voyage_load_condition: string | null;
  voyage_estimated_route_found: number | null;
  voyage_previous_departure_port_id: number | null;
  voyage_previous_arrival_ts: number | null;
  voyage_first_seen_at: string | null;
  voyage_last_seen_at: string | null;
  synced_at: string | null;
}

interface ApiResponse {
  total: number;
  limit: number;
  offset: number;
  data: ApiShipRow[];
}

function mapStatus(raw: string | null): Vessel['status'] {
  const s = (raw ?? '').toLowerCase();
  if (s.includes('moor')) return 'Moored';
  if (s.includes('anchor')) return 'At Anchor';
  if (s.includes('underway') || s.includes('engine') || s.includes('sailing')) return 'Underway';
  return 'In Port';
}

function str(v: string | number | null | undefined, fallback = '—'): string {
  if (v === null || v === undefined || v === '') return fallback;
  return String(v);
}

function num(v: number | null | undefined, fallback = 0): number {
  if (v === null || v === undefined || Number.isNaN(v)) return fallback;
  return v;
}

function iso(v: string | null | undefined, fallback?: string): string {
  return str(v, fallback ?? new Date().toISOString());
}

export function mapApiRowToVessel(row: ApiShipRow): Vessel {
  return {
    // Vessel Particulars
    mmsi: str(row.vessel_mmsi, `ship-${row.vessel_ship_id ?? row.id}`),
    imo: str(row.vessel_imo, '—'),
    vessel_name: str(row.vessel_name ?? row.vessel_ais_name, 'Unknown Vessel'),
    vessel_type: str(row.vessel_type, '—'),
    vessel_subtype: str(row.vessel_subtype ?? row.vessel_type, '—'),
    vessel_country: str(row.vessel_country, '—'),
    flag: str(row.vessel_country_code, '—'),
    callsign: str(row.vessel_callsign, '—'),
    loa_m: num(row.vessel_length),
    width_m: num(row.vessel_width),
    size_class: str(row.vessel_size_class_name, '—'),
    market_name: str(row.vessel_market_name, '—'),
    year_built: str(row.vessel_year_built, '—'),
    home_port: str(row.vessel_home_port, '—'),
    transponder_class: str(row.vessel_ais_transponder_class, '—'),

    // Live Position
    lat: num(row.position_lat),
    lng: num(row.position_lon),
    speed_kn: num(row.position_speed),
    course_deg: num(row.position_course),
    heading_deg: num(row.position_heading),
    draught_m: num(row.position_draught),
    rate_of_turn: num(row.position_rate_of_turn),
    navigational_status: str(row.position_navigational_status, '—'),
    current_area: str(row.position_area_name, '—'),
    area_code: str(row.position_area_code, '—'),
    position_position_utc: iso(row.position_position_utc),
    position_vessel_local_time: iso(row.position_vessel_local_time, row.position_position_utc ?? undefined),
    position_timezone: num(row.position_timezone),
    position_station_type: str(row.position_station_type, '—'),
    position_scraped_at: iso(row.position_scraped_at),

    // Voyage
    voyage_departure_port_name: str(row.voyage_departure_port_name),
    voyage_departure_unlocode: str(row.voyage_departure_unlocode),
    voyage_departure_utc: iso(row.voyage_departure_utc),
    voyage_departure_label: str(row.voyage_departure_label, '—'),
    voyage_arrival_port_name: str(row.voyage_arrival_port_name),
    voyage_arrival_unlocode: str(row.voyage_arrival_unlocode),
    voyage_arrival_utc: iso(row.voyage_arrival_utc),
    voyage_arrival_label: str(row.voyage_arrival_label, '—'),
    voyage_eta_utc: iso(row.voyage_eta_utc, row.voyage_arrival_utc ?? undefined),
    voyage_eta_timezone: num(row.voyage_eta_timezone),
    voyage_reported_destination: str(row.voyage_reported_destination),
    voyage_progress: num(row.voyage_progress),
    voyage_distance_travelled: row.voyage_distance_travelled ?? null,
    voyage_distance_to_go: row.voyage_distance_to_go ?? null,
    voyage_load_condition: str(row.voyage_load_condition),

    // Derived
    status: mapStatus(row.position_navigational_status),

    // Summaries
    vessel_summary_position: str(row.vessel_summary_position, ''),
    vessel_summary_particulars: str(row.vessel_summary_particulars, ''),

    // Tracking
    vessel_first_seen_at: iso(row.vessel_first_seen_at),
    vessel_updated_at: iso(row.vessel_updated_at),
    voyage_first_seen_at: iso(row.voyage_first_seen_at),
    voyage_last_seen_at: iso(row.voyage_last_seen_at),
    synced_at: iso(row.synced_at),
  };
}

// The backend caps `limit` at 10, so the full fleet is fetched page by page.
const PAGE_SIZE = 10;

async function fetchPage(offset: number): Promise<ApiResponse> {
  return apiClient.get<ApiResponse>('/mainshipdata', {
    params: { limit: PAGE_SIZE, offset },
  });
}

export async function fetchShippingData(signal?: AbortSignal): Promise<Vessel[]> {
  const first = await fetchPage(0);
  const rows = [...(Array.isArray(first?.data) ? first.data : [])];
  const total = first?.total ?? rows.length;

  const offsets: number[] = [];
  for (let o = PAGE_SIZE; o < total; o += PAGE_SIZE) offsets.push(o);

  // Fetch remaining pages in small concurrent batches.
  const BATCH = 5;
  for (let i = 0; i < offsets.length && !signal?.aborted; i += BATCH) {
    const pages = await Promise.all(offsets.slice(i, i + BATCH).map(fetchPage));
    for (const p of pages) if (Array.isArray(p?.data)) rows.push(...p.data);
  }
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const vessels = rows
    .map(mapApiRowToVessel)
    .filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng) && (v.lat !== 0 || v.lng !== 0));

  const seen = new Map<string, Vessel>();
  for (const v of vessels) {
    if (!seen.has(v.mmsi)) seen.set(v.mmsi, v);
  }
  return Array.from(seen.values());
}
