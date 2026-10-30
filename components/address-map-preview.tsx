"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

const pinIcon = L.divIcon({
  className: "",
  html: `<span style="display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#65452F,#C7A46A);border:2px solid #FFFCF6;box-shadow:0 6px 22px rgba(101,69,47,.4);color:#FFFCF6;font-size:15px;font-weight:800">★</span>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function AddressMapPreview({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  return (
    <div className="h-[200px] overflow-hidden rounded-xl border border-brand-500/10">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
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
        <Recenter lat={lat} lng={lng} />
        <Marker position={[lat, lng]} icon={pinIcon}>
          <Popup>{label || "Selected location"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
