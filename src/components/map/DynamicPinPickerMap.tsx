"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";
import type { PinPickerMapProps } from "./PinPickerMap";

const PinPickerMap = dynamic<PinPickerMapProps>(
  () => import("./PinPickerMap").then((m) => m.PinPickerMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full rounded-xl" />,
  },
);

export function DynamicPinPickerMap(props: PinPickerMapProps) {
  return <PinPickerMap {...props} />;
}
