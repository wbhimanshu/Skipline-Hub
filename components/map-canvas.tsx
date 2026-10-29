"use client";

import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export type MapPoint = {
  id: string;
  slug: string;
  name: string;
  category: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  wait: number;
  isOpen: boolean;
};

function markerIcon(isOpen: boolean) {
  return L.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:${
      isOpen ? "rgba(139,108,251,.95)" : "rgba(100,116,139,.9)"
    };border:2px solid rgba(255,255,255,.92);box-shadow:0 6px 22px rgba(0,0,0,.45);color:#fff;font-size:11px;font-weight:800">${isOpen ? "•" : "–"}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

export default function MapCanvas({
  points,
  center,
  zoom = 12,
  height = "420px",
}: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}) {
  const first = points[0];
  const mapCenter: [number, number] =
    center ?? (first ? [first.lat, first.lng] : [18.5204, 73.8567]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={points.length === 1 ? 14 : zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#0b1024" }}
        attributionControl
      >
        <TileLayer
          url={
            process.env.NEXT_PUBLIC_MAP_TILE_URL ||
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={markerIcon(point.isOpen)}
          >
            <Popup>
              <div style={{ minWidth: 190 }}>
                <strong style={{ display: "block", marginBottom: 2 }}>{point.name}</strong>
                <span style={{ color: "#475569", fontSize: 12 }}>
                  {point.address}, {point.city}
                </span>
                <div style={{ margin: "8px 0", fontSize: 12 }}>
                  {point.isOpen ? "Open now" : "Closed"} · approx. {point.wait} min wait
                </div>
                <Link
                  href={`/centres/${point.slug}`}
                  style={{ color: "#6d51e8", fontWeight: 700, fontSize: 12 }}
                >
                  View centre and join queue →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
