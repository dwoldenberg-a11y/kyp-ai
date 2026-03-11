'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { GeoCoordinate } from '@/types';

interface SupplyChainMapProps {
  routes: GeoCoordinate[][];
  height?: string;
}

export default function SupplyChainMap({ routes, height = '500px' }: SupplyChainMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Tear down any existing instance (React strict-mode double-mount / route change)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    let cancelled = false;

    import('leaflet').then(L => {
      if (cancelled || !mapRef.current) return;

      // Fix default marker icon paths for Next.js bundling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [20, 10],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Coloured circle icon with 2-letter country code
      const makeIcon = (color: string, label: string) =>
        L.divIcon({
          html: `<div style="
            background:${color};border:2px solid rgba(255,255,255,0.35);border-radius:50%;
            width:30px;height:30px;display:flex;align-items:center;justify-content:center;
            font-size:9px;font-weight:700;color:#fff;
            box-shadow:0 0 12px ${color}80;pointer-events:none;
          ">${label.slice(0, 2)}</div>`,
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

      const colors = ['#1E6FFF', '#FF6B2C', '#00D68F', '#FFB800'];
      const allPts: GeoCoordinate[] = routes.flat();

      routes.forEach((route, ri) => {
        if (route.length < 1) return;
        const color = colors[ri % colors.length];

        // Dashed polyline
        if (route.length > 1) {
          L.polyline(route.map(p => [p.lat, p.lng] as [number, number]), {
            color, weight: 2.5, opacity: 0.75, dashArray: '8 6',
          }).addTo(map);

          // Directional arrows at midpoints
          for (let i = 0; i < route.length - 1; i++) {
            const a = route[i], b = route[i + 1];
            L.marker([(a.lat + b.lat) / 2, (a.lng + b.lng) / 2], {
              icon: L.divIcon({
                html: `<div style="color:${color};font-size:16px;line-height:1;pointer-events:none;">→</div>`,
                className: '', iconSize: [16, 16], iconAnchor: [8, 8],
              }),
              interactive: false,
            }).addTo(map);
          }
        }

        // Markers
        route.forEach((pt, i) => {
          const isLast = i === route.length - 1;
          L.marker([pt.lat, pt.lng], { icon: makeIcon(isLast ? '#1E6FFF' : color, pt.countryCode) })
            .addTo(map)
            .bindPopup(`
              <div style="min-width:150px;padding:8px 10px;font-family:sans-serif;">
                <p style="font-size:12px;font-weight:600;margin:0 0 3px">${pt.label}</p>
                <p style="font-size:10px;color:#888;margin:0">${pt.country} (${pt.countryCode})</p>
                ${i === 0 ? '<p style="font-size:10px;color:#00D68F;margin:4px 0 0">▶ Origin</p>' : ''}
                ${isLast ? '<p style="font-size:10px;color:#1E6FFF;margin:4px 0 0">⚓ Destination</p>' : ''}
              </div>
            `);
        });
      });

      // Fit to all points
      if (allPts.length > 0) {
        const bounds = L.latLngBounds(allPts.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
      }
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // Stringify routes so effect re-runs when selection changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routes)]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%' }}
      className="rounded-xl overflow-hidden bg-[var(--c-bg)]"
    />
  );
}
