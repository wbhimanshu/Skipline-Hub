"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";

const DirectionsCanvas = dynamic(
  () => import("@/components/directions-canvas"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-2xl" />,
  },
);

export function DirectionsMap(props: {
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  height?: string;
}) {
  return (
    <div style={{ height: props.height ?? "360px" }}>
      <DirectionsCanvas {...props} />
    </div>
  );
}
