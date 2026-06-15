"use client";

import { useEffect, useRef } from "react";

export type MapMarker = {
  lat: number;
  lng: number;
  type: "driver" | "order" | "pickup" | "current";
  label: string;
  sublabel?: string;
  color?: string;
};

type Props = {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  className?: string;
};

// Nairobi center
const DEFAULT_CENTER: [number, number] = [-1.2921, 36.8219];
const DEFAULT_ZOOM = 12;

const ICON_SVG: Record<string, string> = {
  driver: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
    <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 28 12 28s12-19 12-28c0-6.6-5.4-12-12-12z" fill="#2563eb" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="12" r="6" fill="#fff"/>
    <text x="16" y="16" text-anchor="middle" font-size="9" font-weight="bold" fill="#2563eb">D</text>
  </svg>`,
  order: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
    <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 28 12 28s12-19 12-28c0-6.6-5.4-12-12-12z" fill="#dc2626" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="12" r="6" fill="#fff"/>
    <text x="16" y="16" text-anchor="middle" font-size="9" font-weight="bold" fill="#dc2626">O</text>
  </svg>`,
  pickup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
    <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 28 12 28s12-19 12-28c0-6.6-5.4-12-12-12z" fill="#16a34a" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="12" r="6" fill="#fff"/>
    <text x="16" y="16" text-anchor="middle" font-size="9" font-weight="bold" fill="#16a34a">P</text>
  </svg>`,
  current: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
    <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 28 12 28s12-19 12-28c0-6.6-5.4-12-12-12z" fill="#7c3aed" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="12" r="6" fill="#fff"/>
    <text x="16" y="16" text-anchor="middle" font-size="7" font-weight="bold" fill="#7c3aed">YOU</text>
  </svg>`,
};

export default function LiveMap({ markers = [], center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, height = 400, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapRef.current) {
        // Map already initialized — just update markers
        updateMarkers(L);
        return;
      }

      // Init map
      const map = L.map(containerRef.current!, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      updateMarkers(L);
    });

    function updateMarkers(L: any) {
      const map = mapRef.current;
      if (!map) return;

      // Clear old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      markers.forEach(({ lat, lng, type, label, sublabel }) => {
        const icon = L.divIcon({
          html: ICON_SVG[type] ?? ICON_SVG.order,
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
          className: "",
        });

        const marker = L.marker([lat, lng], { icon })
          .bindPopup(`
            <div style="min-width:140px;font-family:system-ui,sans-serif">
              <p style="font-weight:700;margin:0 0 4px;font-size:13px">${label}</p>
              ${sublabel ? `<p style="color:#666;font-size:12px;margin:0">${sublabel}</p>` : ""}
              <p style="font-size:10px;color:#999;margin:4px 0 0">${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
            </div>
          `)
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Auto-fit bounds if we have markers
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when data changes (without re-initializing map)
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;
      const map = mapRef.current;

      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      markers.forEach(({ lat, lng, type, label, sublabel }) => {
        if (cancelled || !mapRef.current) return;
        const icon = L.divIcon({
          html: ICON_SVG[type] ?? ICON_SVG.order,
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
          className: "",
        });

        const marker = L.marker([lat, lng], { icon })
          .bindPopup(`
            <div style="min-width:140px;font-family:system-ui,sans-serif">
              <p style="font-weight:700;margin:0 0 4px;font-size:13px">${label}</p>
              ${sublabel ? `<p style="color:#666;font-size:12px;margin:0">${sublabel}</p>` : ""}
              <p style="font-size:10px;color:#999;margin:4px 0 0">${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
            </div>
          `)
          .addTo(map);

        markersRef.current.push(marker);
      });

      if (!cancelled && markers.length > 0) {
        const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }
    });

    return () => { cancelled = true; };
  }, [markers]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={containerRef}
        className={className}
        style={{
          height,
          width: "100%",
          borderRadius: 10,
          overflow: "hidden",
          background: "#e8f4f8",
          zIndex: 0,
        }}
      />
    </>
  );
}
