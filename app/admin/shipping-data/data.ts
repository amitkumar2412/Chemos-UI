export interface Vessel {
  // — Vessel Particulars —
  mmsi: string;
  imo: string;
  vessel_name: string;
  vessel_type: string;
  vessel_subtype: string;
  vessel_country: string;
  flag: string;
  callsign: string;
  loa_m: number;
  width_m: number;
  size_class: string;
  market_name: string;
  year_built: string;
  home_port: string;
  transponder_class: string;

  // — Live Position —
  lat: number;
  lng: number;
  speed_kn: number;
  course_deg: number;
  heading_deg: number;
  draught_m: number;
  rate_of_turn: number;
  navigational_status: string;
  current_area: string;
  area_code: string;
  position_position_utc: string;
  position_vessel_local_time: string;
  position_timezone: number;
  position_station_type: string;
  position_scraped_at: string;

  // — Voyage —
  voyage_departure_port_name: string;
  voyage_departure_unlocode: string;
  voyage_departure_utc: string;
  voyage_departure_label: string;
  voyage_arrival_port_name: string;
  voyage_arrival_unlocode: string;
  voyage_arrival_utc: string;
  voyage_arrival_label: string;
  voyage_eta_utc: string;
  voyage_eta_timezone: number;
  voyage_reported_destination: string;
  voyage_progress: number;
  voyage_distance_travelled: number | null;
  voyage_distance_to_go: number | null;
  voyage_load_condition: string;

  // — Derived status —
  status: 'Underway' | 'At Anchor' | 'Moored' | 'In Port';

  // — Summaries —
  vessel_summary_position: string;
  vessel_summary_particulars: string;

  // — Tracking timestamps —
  vessel_first_seen_at: string;
  vessel_updated_at: string;
  voyage_first_seen_at: string;
  voyage_last_seen_at: string;
  synced_at: string;
}

export function colorForStatus(status: Vessel['status']): string {
  switch (status) {
    case 'Underway':
      return '#4895ef';
    case 'At Anchor':
      return '#f4a261';
    case 'Moored':
      return '#2ec4b6';
    case 'In Port':
      return '#06d6a0';
  }
}
