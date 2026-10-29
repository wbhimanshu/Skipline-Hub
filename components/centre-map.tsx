"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui";
import type { MapPoint } from "@/components/map-canvas";

const MapCanvas = dynamic(() => import("@/components/map-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-2xl" />,
});

const GoogleMapCanvas = dynamic(
  () => import("@/components/google-map-canvas"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-2xl" />,
  },
);

export function CentreMap(props: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}) {
  const configuredKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const googleKey =
    configuredKey && !configuredKey.startsWith("YOUR_") ? configuredKey : "";
  const [googleFailed, setGoogleFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ height: props.height ?? "420px" }}>
      {visible ? (
        googleKey && !googleFailed ? (
          <GoogleMapCanvas
            {...props}
            apiKey={googleKey}
            onError={() => setGoogleFailed(true)}
          />
        ) : (
          <MapCanvas {...props} />
        )
      ) : (
        <Skeleton className="h-full w-full rounded-2xl" />
      )}
    </div>
  );
}
