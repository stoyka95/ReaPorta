"use client";

import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Minus, Plus } from "lucide-react";
import { IconButton } from "@/components/ui";

const DEFAULT_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/positron";

export interface PinPickerMapProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
}

export function PinPickerMap({ lat, lng, onChange }: PinPickerMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = new maplibregl.Map({
      container: el,
      style: DEFAULT_STYLE_URL,
      center: [lng, lat],
      zoom: 13.5,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    const pinEl = document.createElement("div");
    pinEl.className =
      "h-6 w-6 rounded-pill border-2 border-gray-0 bg-accent shadow-accent cursor-grab active:cursor-grabbing";

    const marker = new maplibregl.Marker({
      element: pinEl,
      draggable: true,
      anchor: "center",
    })
      .setLngLat([lng, lat])
      .addTo(map);

    pinEl.removeAttribute("role");
    pinEl.removeAttribute("aria-label");
    pinEl.removeAttribute("tabindex");

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      onChangeRef.current({
        lat: Number(pos.lat.toFixed(6)),
        lng: Number(pos.lng.toFixed(6)),
      });
    });

    map.on("click", (ev) => {
      marker.setLngLat([ev.lngLat.lng, ev.lngLat.lat]);
      onChangeRef.current({
        lat: Number(ev.lngLat.lat.toFixed(6)),
        lng: Number(ev.lngLat.lng.toFixed(6)),
      });
    });

    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    const current = markerRef.current.getLngLat();
    if (Math.abs(current.lat - lat) > 0.0001 || Math.abs(current.lng - lng) > 0.0001) {
      markerRef.current.setLngLat([lng, lat]);
      mapRef.current.easeTo({ center: [lng, lat], duration: 300 });
    }
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <div className="relative h-72 w-full overflow-hidden rounded-xl border border-line bg-gray-100 shadow-card">
        <div
          ref={containerRef}
          className="h-full w-full"
          aria-label="Interaktivní mapa pro výběr polohy nemovitosti"
        />
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <IconButton
            type="button"
            variant="glass"
            size="sm"
            aria-label="Přiblížit mapu"
            onClick={() => mapRef.current?.zoomIn({ duration: 200 })}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton
            type="button"
            variant="glass"
            size="sm"
            aria-label="Oddálit mapu"
            onClick={() => mapRef.current?.zoomOut({ duration: 200 })}
          >
            <Minus className="h-4 w-4" strokeWidth={2} />
          </IconButton>
        </div>
      </div>
      <p className="type-caption text-muted tnum">
        Přetáhněte fialový bod nebo klikněte do mapy. Souřadnice: {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
    </div>
  );
}
