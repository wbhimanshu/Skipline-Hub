"use client";

import { useEffect, useRef, useState } from "react";
import type { MapPoint } from "@/components/map-canvas";

type GoogleMapInstance = {
  setCenter: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMarkerInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
  addListener: (event: string, handler: () => void) => { remove: () => void };
};

type GoogleInfoWindowInstance = {
  setContent: (content: string) => void;
  open: (options: { anchor: GoogleMarkerInstance; map: GoogleMapInstance }) => void;
  close: () => void;
};

type GoogleMapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: Record<string, unknown>,
    ) => GoogleMapInstance;
    Marker: new (options: Record<string, unknown>) => GoogleMarkerInstance;
    InfoWindow: new (options: Record<string, unknown>) => GoogleInfoWindowInstance;
    SymbolPath: { CIRCLE: number };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

let loaderPromise: Promise<GoogleMapsApi> | null = null;

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps did not initialise."));
    };
    script.onerror = () => reject(new Error("Google Maps could not be loaded."));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const warmMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#F7F1E7" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFCF6" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#786B60" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#E4D5C1" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#EFE3D0" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#DDE4D3" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#FFFCF6" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E8D8C3" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#DCE6E2" }],
  },
];

export default function GoogleMapCanvas({
  points,
  center,
  zoom = 12,
  height = "420px",
  apiKey,
  onError,
}: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  apiKey: string;
  onError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onErrorRef = useRef(onError);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let cancelled = false;
    let map: GoogleMapInstance | null = null;
    const markers: GoogleMarkerInstance[] = [];
    const infoWindows: GoogleInfoWindowInstance[] = [];

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        const first = points[0];
        const mapCenter: [number, number] =
          center ?? (first ? [first.lat, first.lng] : [23.2599, 77.4126]);

        map = new google.maps.Map(containerRef.current, {
          center: { lat: mapCenter[0], lng: mapCenter[1] },
          zoom: points.length === 1 ? 14 : zoom,
          styles: warmMapStyles,
          backgroundColor: "#F7F1E7",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });

        points.forEach((point) => {
          const marker = new google.maps.Marker({
            position: { lat: point.lat, lng: point.lng },
            map,
            title: point.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: point.isOpen ? "#65452F" : "#8A7A6C",
              fillOpacity: 1,
              strokeColor: "#FFFCF6",
              strokeWeight: 2,
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="min-width:190px;font-family:Inter,system-ui,sans-serif">
              <strong style="display:block;margin-bottom:2px;color:#2B1D14">${escapeHtml(point.name)}</strong>
              <span style="color:#786B60;font-size:12px">${escapeHtml(point.address)}, ${escapeHtml(point.city)}</span>
              <div style="margin:8px 0;font-size:12px;color:#5F5147">${point.isOpen ? "Open now" : "Closed"} &middot; approx. ${point.wait} min wait</div>
              <a href="/centres/${encodeURIComponent(point.slug)}" style="color:#A98448;font-weight:700;font-size:12px">View centre and join queue &rarr;</a>
            </div>`,
          });

          marker.addListener("click", () => {
            if (map) infoWindow.open({ anchor: marker, map });
          });
          markers.push(marker);
          infoWindows.push(infoWindow);
        });

        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current();
      });

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.setMap(null));
      infoWindows.forEach((infoWindow) => infoWindow.close());
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [apiKey, center, points, zoom]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10"
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full" />
      {loading ? (
        <div className="absolute inset-0 grid place-items-center bg-ink-900 text-sm text-slate-400">
          Loading Google Map…
        </div>
      ) : null}
    </div>
  );
}
