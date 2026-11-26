"use client";

import { Card } from "@/components/ui";

export interface DailyViewPoint {
  day: string;
  views: number;
}

export function ViewsChart({
  data,
  title = "Zobrazení za posledních 30 dní",
}: {
  data: DailyViewPoint[];
  title?: string;
}) {
  const maxVal = Math.max(1, ...data.map((d) => d.views));
  const total = data.reduce((sum, d) => sum + d.views, 0);
  const firstLabel = data[0]?.day.slice(5).split("-").reverse().join(".") ?? "";
  const midLabel =
    data[Math.floor(data.length / 2)]?.day.slice(5).split("-").reverse().join(".") ?? "";
  const lastLabel = data[data.length - 1]?.day.slice(5).split("-").reverse().join(".") ?? "";

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-h3 text-strong">{title}</h2>
        <p className="type-small text-muted tnum">
          Celkem <strong className="text-strong">{total.toLocaleString("cs-CZ")}</strong> zobrazení
        </p>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox="0 0 600 180"
          role="img"
          aria-label={`${title}: celkem ${total} zobrazení`}
          className="h-44 w-full"
          preserveAspectRatio="none"
        >
          {/* Vodorovné pomocné linky */}
          <line x1="0" y1="30" x2="600" y2="30" className="stroke-line-subtle" strokeWidth="1" />
          <line x1="0" y1="90" x2="600" y2="90" className="stroke-line-subtle" strokeWidth="1" />
          <line x1="0" y1="150" x2="600" y2="150" className="stroke-line" strokeWidth="1" />

          {data.map((point, idx) => {
            const barWidth = 600 / Math.max(1, data.length);
            const h = Math.max(3, Math.round((point.views / maxVal) * 135));
            const x = idx * barWidth + 2;
            const y = 150 - h;
            return (
              <rect
                key={point.day}
                x={x}
                y={y}
                width={Math.max(4, barWidth - 5)}
                height={h}
                rx="3"
                className="fill-violet-500 transition-opacity duration-150 hover:fill-accent"
              >
                <title>{`${point.day}: ${point.views} zobrazení`}</title>
              </rect>
            );
          })}
        </svg>

        <div className="mt-1 flex items-center justify-between type-caption text-muted tnum">
          <span>{firstLabel}</span>
          <span>{midLabel}</span>
          <span>{lastLabel}</span>
        </div>
      </div>
    </Card>
  );
}
