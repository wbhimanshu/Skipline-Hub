"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { ExternalLink, Loader2, LocateFixed, Navigation } from "lucide-react";

type LatLng = { lat: number; lng: number };

export type DirectionsCanvasProps = {
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  height?: string;
};

const destinationIcon = L.divIcon({
  className: "",
  html: `<span style="display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#65452F;border:2px solid #FFFCF6;box-shadow:0 6px 22px rgba(101,69,47,.4);color:#FFFCF6;font-size:15px;font-weight:800">★</span>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

const originIcon = L.divIcon({
  className: "",
  html: `<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#2563EB;border:2px solid #FFFCF6;box-shadow:0 6px 22px rgba(37,99,235,.45);color:#FFFCF6;font-size:13px;font-weight:800">●</span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

function haversineKm(a: LatLng, b: LatLng) {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
  }, [map, points]);
  return null;
}

export default function DirectionsCanvas({
  name,
  address,
  city,
  lat,
  lng,
  height = "360px",
}: DirectionsCanvasProps) {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [status, setStatus] = useState<
    "idle" | "locating" | "routing" | "ready" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setMessage("Location is not supported by this browser.");
      return;
    }
    setStatus("locating");
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const from: LatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setOrigin(from);
        setStatus("routing");
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${lng},${lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("routing failed");
          const data = await res.json();
          if (data.code !== "Ok" || !data.routes?.length) {
            throw new Error("no route");
          }
          const best = data.routes[0];
          setRoute(
            best.geometry.coordinates.map(
              ([lon, la]: [number, number]) => [la, lon] as [number, number],
            ),
          );
          setDistanceKm(best.distance / 1000);
          setDurationMin(best.duration / 60);
          setStatus("ready");
        } catch {
          const km = haversineKm(from, { lat, lng });
          setRoute([
            [from.lat, from.lng],
            [lat, lng],
          ]);
          setDistanceKm(km);
          setDurationMin(Math.round((km / 30) * 60));
          setStatus("ready");
          setMessage("Showing a direct line — live road route is unavailable.");
        }
      },
      () => {
        setStatus("error");
        setMessage(
          "Location permission was not granted. Allow location access to see the route from where you are.",
        );
      },
      { timeout: 10000, maximumAge: 60_000 },
    );
  }, [lat, lng]);

  useEffect(() => {
    locate();
  }, [locate]);

  const bounds = useMemo<[number, number][]>(() => {
    if (route.length > 1) return route;
    return origin ? [[origin.lat, origin.lng], [lat, lng]] : [[lat, lng]];
  }, [route, origin, lat, lng]);

  const googleDirectionsUrl = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${lat},${lng}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  const busy = status === "locating" || status === "routing";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-brand-500/10"
      style={{ height }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#EFE3D0" }}
        attributionControl
      >
        <TileLayer
          url={
            process.env.NEXT_PUBLIC_MAP_TILE_URL ||
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds points={bounds} />
        <Marker position={[lat, lng]} icon={destinationIcon}>
          <Popup>
            <div style={{ minWidth: 170 }}>
              <strong style={{ display: "block", marginBottom: 2 }}>{name}</strong>
              <span style={{ color: "#786B60", fontSize: 12 }}>
                {address}, {city}
              </span>
            </div>
          </Popup>
        </Marker>
        {origin ? (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>Your live location</Popup>
          </Marker>
        ) : null}
        {route.length > 1 ? (
          <Polyline
            positions={route}
            pathOptions={{ color: "#65452F", weight: 5, opacity: 0.85 }}
          />
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex justify-center">
        <div className="pointer-events-auto rounded-xl border border-white/60 bg-white/95 px-3.5 py-2.5 text-ink-900 shadow-lg backdrop-blur">
          {status === "ready" && distanceKm != null && durationMin != null ? (
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-1.5 text-xs font-bold">
                <Navigation className="h-3.5 w-3.5 text-brand-600" />
                {distanceKm.toFixed(1)} km · about {Math.max(1, Math.round(durationMin))} min drive
              </p>
              <a
                href={googleDirectionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline"
              >
                Open live route in Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
              {message ? (
                <p className="text-[10px] text-slate-500">{message}</p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={locate}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 disabled:opacity-70"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="h-3.5 w-3.5" />
                )}
                {status === "locating"
                  ? "Locating you…"
                  : status === "routing"
                    ? "Finding the best route…"
                    : "Route from my live location"}
              </button>
              {message ? (
                <p className="max-w-[260px] text-[10px] leading-snug text-slate-500">
                  {message}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
