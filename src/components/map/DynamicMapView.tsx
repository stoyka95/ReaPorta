"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";
import type { MapViewProps } from "./MapView";

const LazyMapView = dynamic<MapViewProps>(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full min-h-80" rounded="xl" />,
});

export function DynamicMapView(props: MapViewProps) {
  return <LazyMapView {...props} />;
}
