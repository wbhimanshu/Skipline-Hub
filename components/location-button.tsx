"use client";

import { useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers";

export function LocationButton({ className }: { className?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  function locate() {
    if (!navigator.geolocation) {
      push("error", "Location is not supported by this browser.", "Unable to locate");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(window.location.search);
        params.set("lat", position.coords.latitude.toFixed(5));
        params.set("lng", position.coords.longitude.toFixed(5));
        params.set("sort", "distance");
        router.push(`/centres?${params.toString()}`);
        setLoading(false);
      },
      () => {
        setLoading(false);
        push("info", "Location permission was not granted. You can still search by area.", "Location unavailable");
      },
      { timeout: 8000, maximumAge: 300_000 },
    );
  }

  return (
    <button type="button" onClick={locate} disabled={loading} className={className ?? "btn-secondary"}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
      Near me
    </button>
  );
}
