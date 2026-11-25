"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster, { type ClusterFeature, type PointFeature } from "supercluster";
import { AlertTriangle, Crosshair, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MapPoint } from "@/db/queries/listings";
import { IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ClusterPin } from "./ClusterPin";
import { PricePin } from "./PricePin";
import { MapPreviewCard } from "./MapPreviewCard";

const DEFAULT_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/positron";

const CZECH_CENTER: [number, number] = [15.4729, 49.8175];
const DEFAULT_ZOOM = 6.6;

interface PointProps {
  point: MapPoint;
}

type MapFeature = ClusterFeature<{ point?: MapPoint }> | PointFeature<PointProps>;

interface RenderedMarker {
  key: string;
  lng: number;
  lat: number;
  container: HTMLDivElement;
  feature: MapFeature;
}

export interface MapViewProps {
  points: MapPoint[];
  highlightedId: string | null;
  onHoverListing: (id: string | null) => void;
  searchOnMove: boolean;
  onSearchOnMoveChange: (enabled: boolean) => void;
  onBboxChange: (bbox: string) => void;
  initialBbox?: string | null;
  className?: string;
  isMobileSheet?: boolean;
}

function isClusterFeature(feature: MapFeature): feature is ClusterFeature<{ point?: MapPoint }> {
  return Boolean((feature.properties as { cluster?: boolean }).cluster);
}

export function MapView({
  points,
  highlightedId,
  onHoverListing,
  searchOnMove,
  onSearchOnMoveChange,
  onBboxChange,
  initialBbox,
  className,
  isMobileSheet = false,
}: MapViewProps) {
  const t = useTranslations("map");
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markersRef = React.useRef<Map<string, { marker: maplibregl.Marker; el: HTMLDivElement }>>(
    new Map(),
  );

  const [mapReady, setMapReady] = React.useState(false);
  const [tileError, setTileError] = React.useState(false);
  const [selectedPoint, setSelectedPoint] = React.useState<MapPoint | null>(null);
  const [visitedIds, setVisitedIds] = React.useState<Set<string>>(() => new Set());
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [viewport, setViewport] = React.useState<{
    bounds: [number, number, number, number];
    zoom: number;
  }>({
    bounds: [11.8, 48.3, 19.0, 51.2],
    zoom: DEFAULT_ZOOM,
  });

  const searchOnMoveRef = React.useRef(searchOnMove);
  searchOnMoveRef.current = searchOnMove;
  const onBboxChangeRef = React.useRef(onBboxChange);
  onBboxChangeRef.current = onBboxChange;
  const lastEmittedBboxRef = React.useRef<string | null>(initialBbox ?? null);
  const hasFitInitialRef = React.useRef(false);

  // Build supercluster index whenever points change
  const clusterIndex = React.useMemo(() => {
    const index = new Supercluster<PointProps>({
      radius: 56,
      maxZoom: 15,
      minPoints: 2,
    });
    const features: Array<PointFeature<PointProps>> = points.map((p) => ({
      type: "Feature",
      properties: { point: p },
      geometry: {
        type: "Point",
        coordinates: [p.lng, p.lat],
      },
    }));
    index.load(features);
    return index;
  }, [points]);

  // Initialize MapLibre once
  React.useEffect(() => {
    const el = mapContainerRef.current;
    if (!el || mapRef.current) return;

    const map = new maplibregl.Map({
      container: el,
      style: DEFAULT_STYLE_URL,
      center: CZECH_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    const syncViewport = (emitBbox: boolean) => {
      const b = map.getBounds();
      const nextBounds: [number, number, number, number] = [
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth(),
      ];
      setViewport({
        bounds: nextBounds,
        zoom: map.getZoom(),
      });

      if (emitBbox && searchOnMoveRef.current) {
        const formatted = nextBounds.map((n) => n.toFixed(4)).join(",");
        if (formatted !== lastEmittedBboxRef.current) {
          lastEmittedBboxRef.current = formatted;
          onBboxChangeRef.current(formatted);
        }
      }
    };

    map.on("load", () => {
      setMapReady(true);
      syncViewport(false);
    });

    map.on("moveend", () => {
      syncViewport(true);
    });

    map.on("error", () => {
      setTileError(true);
      // Mark ready even if tiles fail so HTML markers still render cleanly!
      setMapReady(true);
    });

    // Fallback readiness if style load stalls when offline (QA A20)
    const fallbackTimer = window.setTimeout(() => {
      setMapReady(true);
      syncViewport(false);
    }, 1800);

    const existingMarkers = markersRef.current;
    return () => {
      window.clearTimeout(fallbackTimer);
      existingMarkers.forEach(({ marker }) => marker.remove());
      existingMarkers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fit bounds once on initial points load (unless user already passed bbox)
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || hasFitInitialRef.current || points.length === 0) return;

    hasFitInitialRef.current = true;
    if (initialBbox) {
      const parts = initialBbox.split(",").map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite)) {
        map.fitBounds(
          [
            [parts[0]!, parts[1]!],
            [parts[2]!, parts[3]!],
          ],
          { padding: 20, duration: 0 },
        );
        return;
      }
    }

    if (points.length === 1) {
      map.setCenter([points[0]!.lng, points[0]!.lat]);
      map.setZoom(13);
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    points.forEach((p) => bounds.extend([p.lng, p.lat]));
    map.fitBounds(bounds, { padding: 48, maxZoom: 13.5, duration: 0 });
  }, [mapReady, points, initialBbox]);

  // Compute visible clusters/pins for current viewport
  const visibleFeatures = React.useMemo<MapFeature[]>(() => {
    if (!mapReady) return [];
    const zoom = Math.floor(viewport.zoom);
    return clusterIndex.getClusters(viewport.bounds, zoom) as MapFeature[];
  }, [clusterIndex, viewport, mapReady]);

  // Synchronize MapLibre HTML Marker containers with visible features
  const [renderedMarkers, setRenderedMarkers] = React.useState<RenderedMarker[]>([]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const currentPool = markersRef.current;
    const nextKeys = new Set<string>();
    const nextList: RenderedMarker[] = [];

    for (const feature of visibleFeatures) {
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const key = isClusterFeature(feature)
        ? `cluster-${feature.properties.cluster_id}`
        : `point-${feature.properties.point.id}`;
      nextKeys.add(key);

      let entry = currentPool.get(key);
      if (!entry) {
        const el = document.createElement("div");
        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(map);
        el.removeAttribute("role");
        el.removeAttribute("aria-label");
        el.removeAttribute("tabindex");
        entry = { marker, el };
        currentPool.set(key, entry);
      } else {
        entry.marker.setLngLat([lng, lat]);
      }

      // Elevate highlighted / selected marker z-index
      const isHighlighted =
        !isClusterFeature(feature) &&
        (feature.properties.point.id === highlightedId ||
          feature.properties.point.id === selectedPoint?.id);
      entry.el.style.zIndex = isHighlighted ? "30" : isClusterFeature(feature) ? "20" : "10";

      nextList.push({ key, lng, lat, container: entry.el, feature });
    }

    for (const [key, entry] of currentPool.entries()) {
      if (!nextKeys.has(key)) {
        entry.marker.remove();
        currentPool.delete(key);
      }
    }

    setRenderedMarkers(nextList);
  }, [visibleFeatures, mapReady, highlightedId, selectedPoint?.id]);

  // Trigger bbox update immediately if user turns on "Hledat při pohybu mapy"
  function handleToggleSearchOnMove() {
    const next = !searchOnMove;
    onSearchOnMoveChange(next);
    if (next && mapRef.current) {
      const b = mapRef.current.getBounds();
      const formatted = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
        .map((n) => n.toFixed(4))
        .join(",");
      lastEmittedBboxRef.current = formatted;
      onBboxChange(formatted);
    }
  }

  function handleZoomIn() {
    mapRef.current?.zoomIn({ duration: 200 });
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut({ duration: 200 });
  }

  function handleLocate() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 12.5,
        });
      },
      () => {
        // Uživatel polohu zamítl
      },
    );
  }

  function handleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el
        .requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => undefined);
    } else {
      void document
        .exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => undefined);
    }
  }

  return (
    <div
      ref={wrapperRef}
      data-map-view="true"
      className={cn(
        "relative h-full w-full overflow-hidden rounded-xl border border-line-subtle bg-gray-100 shadow-card",
        className,
      )}
    >
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        aria-label="Interaktivní mapa nemovitostí"
      />

      {/* Portaled React Markers (ClusterPin & PricePin) */}
      {renderedMarkers.map(({ key, container, feature, lng, lat }) =>
        createPortal(
          isClusterFeature(feature) ? (
            <ClusterPin
              count={feature.properties.point_count}
              onClick={() => {
                const map = mapRef.current;
                if (!map) return;
                const expansionZoom = Math.min(
                  clusterIndex.getClusterExpansionZoom(feature.properties.cluster_id),
                  15,
                );
                map.easeTo({ center: [lng, lat], zoom: expansionZoom, duration: 300 });
              }}
            />
          ) : (
            <PricePin
              id={feature.properties.point.id}
              price={feature.properties.point.price}
              priceOnRequest={feature.properties.point.priceOnRequest}
              title={feature.properties.point.title}
              showExactLocation={feature.properties.point.showExactLocation}
              highlighted={highlightedId === feature.properties.point.id}
              selected={selectedPoint?.id === feature.properties.point.id}
              visited={visitedIds.has(feature.properties.point.id)}
              onMouseEnter={() => onHoverListing(feature.properties.point.id)}
              onMouseLeave={() => onHoverListing(null)}
              onClick={() => {
                setSelectedPoint(feature.properties.point);
                setVisitedIds((prev) => new Set(prev).add(feature.properties.point.id));
              }}
            />
          ),
          container,
          key,
        ),
      )}

      {/* Horní skleněná pilulka: Hledat při pohybu mapy */}
      <div className="pointer-events-none absolute top-3 right-14 left-3 z-20 flex justify-center sm:right-16 sm:left-16">
        <button
          type="button"
          role="switch"
          aria-checked={searchOnMove}
          onClick={handleToggleSearchOnMove}
          className={cn(
            "pointer-events-auto inline-flex h-10 items-center gap-2 rounded-pill px-4 type-caption font-medium transition-colors duration-150 cursor-pointer",
            searchOnMove
              ? "bg-accent text-on-accent shadow-accent"
              : "glass-3 text-strong hover:bg-surface",
          )}
        >
          <span
            aria-hidden="true"
            className={cn("h-2 w-2 rounded-pill", searchOnMove ? "bg-gray-0" : "bg-violet-500")}
          />
          <span>{t("searchOnMove")}</span>
        </button>
      </div>

      {/* Skleněné ovládací prvky vpravo (DESIGN.md kap. 8) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <IconButton variant="glass" size="sm" aria-label={t("zoomIn")} onClick={handleZoomIn}>
          <Plus className="h-4 w-4" strokeWidth={2} />
        </IconButton>
        <IconButton variant="glass" size="sm" aria-label={t("zoomOut")} onClick={handleZoomOut}>
          <Minus className="h-4 w-4" strokeWidth={2} />
        </IconButton>
        <IconButton variant="glass" size="sm" aria-label={t("myLocation")} onClick={handleLocate}>
          <Crosshair className="h-4 w-4" strokeWidth={1.75} />
        </IconButton>
        {!isMobileSheet ? (
          <IconButton
            variant="glass"
            size="sm"
            aria-label={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
            onClick={handleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
            )}
          </IconButton>
        ) : null}
      </div>

      {/* Zachycení výpadku mapových dlaždic (QA A20) */}
      {tileError ? (
        <div
          role="alert"
          data-map-tile-error="true"
          className="glass-3 absolute top-16 right-14 left-3 z-20 flex items-start gap-2.5 rounded-lg p-3 sm:max-w-sm"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-warning"
            strokeWidth={2}
            aria-hidden="true"
          />
          <div className="space-y-0.5">
            <p className="type-caption font-semibold text-strong">{t("tilesErrorTitle")}</p>
            <p className="type-caption text-muted font-normal">{t("tilesErrorDesc")}</p>
          </div>
        </div>
      ) : null}

      {/* Náhled vybrané nabídky (desktop vlevo dole / mobil bottom sheet) */}
      {selectedPoint ? (
        <div
          className={cn(
            "absolute right-3 bottom-3 left-3 z-30 flex justify-center",
            !isMobileSheet && "sm:right-auto sm:justify-start",
          )}
        >
          <MapPreviewCard
            point={selectedPoint}
            onClose={() => setSelectedPoint(null)}
            className={isMobileSheet ? "max-w-none" : undefined}
          />
        </div>
      ) : null}
    </div>
  );
}
