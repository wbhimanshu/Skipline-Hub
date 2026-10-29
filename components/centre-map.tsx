"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";
import type { MapPoint } from "@/components/map-canvas";

const MapCanvas = dynamic(() => import("@/components/map-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full rounded-2xl" />,
});

export function CentreMap(props: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}) {
  return <MapCanvas {...props} />;
}
