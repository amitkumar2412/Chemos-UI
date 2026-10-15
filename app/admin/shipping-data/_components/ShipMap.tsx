'use client';

import { useEffect, useRef } from 'react';
import type { Vessel } from '../data';
import { colorForStatus } from '../data';

interface ShipMapProps {
  vessels: Vessel[];
  selectedMmsi: string | null;
  onSelect: (mmsi: string) => void;
}

// Leaflet is loaded at runtime from a CDN rather than as an npm dependency,
// so we lean on a tiny structural type that just covers what we touch here.
type LatLng = [number, number];
interface LeafletMarker {
  setLatLng(ll: LatLng): void;
  setIcon(icon: unknown): void;
  bindTooltip(html: string, opts: Record<string, unknown>): LeafletMarker;
  openTooltip(): void;
  on(event: string, cb: () => void): void;
  addTo(map: LeafletMap): LeafletMarker;
  remove(): void;
}
interface LeafletMap {
  remove(): void;
  invalidateSize(): void;
  flyTo(ll: LatLng, zoom: number, opts?: Record<string, unknown>): void;
  getZoom(): number;
}
interface LeafletNS {
  map(el: HTMLElement, opts: Record<string, unknown>): LeafletMap;
  tileLayer(url: string, opts: Record<string, unknown>): { addTo(m: LeafletMap): unknown };
  marker(ll: LatLng, opts: { icon: unknown }): LeafletMarker;
  divIcon(opts: Record<string, unknown>): unknown;
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

let leafletLoading: Promise<LeafletNS> | null = null;

function getLeaflet(): LeafletNS | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { L?: LeafletNS };
  return w.L ?? null;
}

function ensureLeaflet(): Promise<LeafletNS> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  const existing = getLeaflet();
  if (existing) return Promise.resolve(existing);
  if (leafletLoading) return leafletLoading;
  leafletLoading = new Promise<LeafletNS>((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const prior = document.querySelector<HTMLScriptElement>(`script[src="${LEAFLET_JS}"]`);
    if (prior) {
      prior.addEventListener('load', () => {
        const L = getLeaflet();
        if (L) resolve(L); else reject(new Error('leaflet not available'));
      });
      prior.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => {
      const L = getLeaflet();
      if (L) resolve(L); else reject(new Error('leaflet not available'));
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
  return leafletLoading;
}

function buildShipIcon(L: LeafletNS, course: number, color: string): unknown {
  const html = `
    <div style="transform: rotate(${course}deg); display: flex; align-items: center; justify-content: center;">
      <svg width="22" height="22" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">
        <path d="M12 2 L18 20 L12 16 L6 20 Z" fill="${color}" stroke="#0a1628" stroke-width="1.2" stroke-linejoin="round" />
      </svg>
    </div>`;
  return L.divIcon({
    html,
    className: 'ship-marker-icon',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function ShipMap({ vessels, selectedMmsi, onSelect }: ShipMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const onSelectRef = useRef(onSelect);

  // Keep the callback ref in sync without triggering map rebuilds.
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Initialize map once
  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;
    ensureLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, {
          center: [20, 20],
          zoom: 2,
          worldCopyJump: true,
          minZoom: 2,
          maxZoom: 10,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 10,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
        mapRef.current = map;
        setTimeout(() => {
          if (mapRef.current === map) map.invalidateSize();
        }, 100);
      })
      .catch(() => {
        /* Leaflet failed to load — map stays blank. */
      });
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markers.clear();
      }
    };
  }, []);

  // Update markers when vessels change
  useEffect(() => {
    const L = getLeaflet();
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!L || !map) return;

    const vesselSet = new Set(vessels.map((v) => v.mmsi));
    for (const [mmsi, marker] of markers.entries()) {
      if (!vesselSet.has(mmsi)) {
        marker.remove();
        markers.delete(mmsi);
      }
    }

    for (const v of vessels) {
      const existing = markers.get(v.mmsi);
      const icon = buildShipIcon(L, v.course_deg, colorForStatus(v.status));
      if (existing) {
        existing.setLatLng([v.lat, v.lng]);
        existing.setIcon(icon);
      } else {
        const marker = L.marker([v.lat, v.lng], { icon }).addTo(map);
        marker.bindTooltip(
          `<div style="font-family: Montserrat, sans-serif;">
            <div style="font-weight:700;color:#0a1628;">${v.vessel_name}</div>
            <div style="color:#475569;font-size:11px;">${v.vessel_type} · ${v.vessel_country}</div>
            <div style="color:#475569;font-size:11px;margin-top:2px;">${v.speed_kn} kn · ${v.course_deg}°</div>
          </div>`,
          { direction: 'top', offset: [0, -8] }
        );
        marker.on('click', () => onSelectRef.current(v.mmsi));
        markers.set(v.mmsi, marker);
      }
    }
  }, [vessels]);

  // Pan to the selected vessel when selection changes
  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !selectedMmsi) return;
    const vessel = vessels.find((v) => v.mmsi === selectedMmsi);
    if (!vessel) return;
    map.flyTo([vessel.lat, vessel.lng], Math.max(map.getZoom(), 5), { duration: 0.8 });
    const marker = markers.get(selectedMmsi);
    if (marker) marker.openTooltip();
  }, [selectedMmsi, vessels]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '460px',
        background: 'var(--navy-light)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  );
}
