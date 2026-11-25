"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";
import type { ListingLocationMapProps } from "./ListingLocationMap";

const LazyLocationMap = dynamic<ListingLocationMapProps>(
  () => import("./ListingLocationMap").then((m) => m.ListingLocationMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-80 w-full" rounded="xl" />,
  },
);

export function DynamicListingLocationMap(props: ListingLocationMapProps) {
  return <LazyLocationMap {...props} />;
}
