'use client';

import { useEffect, useRef } from 'react';
import { GeoCoordinate } from '@/types';

interface SupplyChainMapProps {
  routes: GeoCoordinate[][];
  markers?: GeoCoordinate[];
  height?: string;
}

export default function SupplyChainMap({ routes, markers, height = '500px' }: SupplyChainMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    // Dynamic import to avoid SSR issues
    import('leaflet').then(L => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
      });

      // Dark tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        opacity: 0.6,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Custom marker icon
      const createIcon = (color: string, label: string) => {
        return L.divIcon({
          html: `
            <div style="
              background: ${color};
              border: 2px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              font-weight: bold;
              color: white;
              box-shadow: 0 0 12px ${color}80;
            ">
              ${label}
            </div>
          `,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
      };

      const allPoints: GeoCoordinate[] = [];
      routes.forEach(r => r.forEach(p => allPoints.push(p)));
      if (markers) markers.forEach(m => allPoints.push(m));

      // Draw routes
      routes.forEach((route, routeIdx) => {
        if (route.length < 2) return;

        const colors = ['#1E6FFF', '#FF6B2C', '#00D68F', '#FFB800'];
        const color = colors[routeIdx % colors.length];

        // Draw polyline
        const latlngs = route.map(p => [p.lat, p.lng] as [number, number]);
        L.polyline(latlngs, {
          color,
          weight: 2,
          opacity: 0.7,
          dashArray: '6, 6',
        }).addTo(map);

        // Add arrows between points
        for (let i = 0; i < route.length - 1; i++) {
          const from = route[i];
          const to = route[i + 1];
          const midLat = (from.lat + to.lat) / 2;
          const midLng = (from.lng + to.lng) / 2;

          const arrowIcon = L.divIcon({
            html: `<div style="color:${color};font-size:14px;line-height:1;">→</div>`,
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          L.marker([midLat, midLng], { icon: arrowIcon }).addTo(map);
        }

        // Add markers for each point in route
        route.forEach((point, i) => {
          const isLast = i === route.length - 1;
          const icon = createIcon(isLast ? '#1E6FFF' : color, point.countryCode.substring(0, 2));
          L.marker([point.lat, point.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="background:#1C2844;border:1px solid #253352;border-radius:8px;padding:10px;color:#E2E8F0;min-width:160px;">
                <p style="font-size:12px;font-weight:600;margin:0">${point.label}</p>
                <p style="font-size:10px;color:#8892A4;margin:4px 0 0">${point.country} (${point.countryCode})</p>
                ${i === 0 ? '<p style="font-size:10px;color:#00D68F;margin:2px 0 0">Origin</p>' : ''}
                ${isLast ? '<p style="font-size:10px;color:#1E6FFF;margin:2px 0 0">Destination</p>' : ''}
              </div>
            `, {
              className: 'custom-popup',
            });
        });
      });

      // Fit map to all points
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}
      className="bg-[#0B1120]"
    />
  );
}
