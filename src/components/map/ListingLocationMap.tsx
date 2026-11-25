"use client";

import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconButton } from "@/components/ui";

const DEFAULT_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/positron";

export interface ListingLocationMapProps {
  lat: number;
  lng: number;
  showExactLocation: boolean;
  label: string;
}

export function ListingLocationMap({
  lat,
  lng,
  showExactLocation,
  label,
}: ListingLocationMapProps) {
  const t = useTranslations("map");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const [tileError, setTileError] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = new maplibregl.Map({
      container: el,
      style: DEFAULT_STYLE_URL,
      center: [lng, lat],
      zoom: showExactLocation ? 15 : 13.5,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    const markerEl = document.createElement("div");
    if (showExactLocation) {
      markerEl.className = "h-5 w-5 rounded-pill border-2 border-gray-0 bg-accent shadow-accent";
      markerEl.setAttribute("data-exact-marker", "true");
    } else {
      // Kruh ~300 m (přibližná oblast místo přesného bodu dle AC-3.4 / QA A19)
      markerEl.className = "approx-area-ring h-24 w-24 rounded-pill";
      markerEl.setAttribute("data-approx-circle", "true");
    }
    markerEl.setAttribute("aria-label", label);

    new maplibregl.Marker({ element: markerEl, anchor: "center" }).setLngLat([lng, lat]).addTo(map);

    map.on("error", () => setTileError(true));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, showExactLocation, label]);

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl border border-line-subtle bg-gray-100 shadow-card">
      <div ref={containerRef} className="h-full w-full" aria-label={`Mapa polohy: ${label}`} />

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <IconButton
          variant="glass"
          size="sm"
          aria-label={t("zoomIn")}
          onClick={() => mapRef.current?.zoomIn({ duration: 200 })}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
        </IconButton>
        <IconButton
          variant="glass"
          size="sm"
          aria-label={t("zoomOut")}
          onClick={() => mapRef.current?.zoomOut({ duration: 200 })}
        >
          <Minus className="h-4 w-4" strokeWidth={2} />
        </IconButton>
      </div>

      {!showExactLocation ? (
        <div className="glass-3 absolute bottom-3 left-3 z-10 rounded-pill px-3 py-1.5 type-caption text-strong">
          {t("approximateNote")}
        </div>
      ) : null}

      {tileError ? (
        <div
          role="alert"
          className="glass-3 absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg px-3 py-2 type-caption text-strong"
        >
          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
          <span>{t("tilesErrorTitle")}</span>
        </div>
      ) : null}
    </div>
  );
}
