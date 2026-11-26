import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Heart, Inbox, Phone } from "lucide-react";
import { requirePageAgent } from "@/lib/auth/session";
import { getAgentStats } from "@/db/queries/profiles";
import { Badge, Card } from "@/components/ui";
import { ViewsChart } from "@/components/dashboard/ViewsChart";

export const metadata: Metadata = {
  title: "Statistiky — Dashboard",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  active: "Aktivní",
  pending: "Ke schválení",
  draft: "Koncept",
  paused: "Pozastaveno",
  sold: "Prodáno",
  expired: "Expirováno",
  rejected: "Zamítnuto",
};

export default async function DashboardStatsPage() {
  const user = await requirePageAgent("/dashboard/statistiky");
  const stats = await getAgentStats(user.id);

  const cards = [
    { label: "Zobrazení (30 dní)", value: stats.totals.views30d, icon: Eye },
    { label: "Zobrazení telefonu (30 dní)", value: stats.totals.phoneReveals30d, icon: Phone },
    { label: "Uloženo v oblíbených", value: stats.totals.favoritesTotal, icon: Heart },
    { label: "Poptávky celkem", value: stats.totals.inquiriesTotal, icon: Inbox },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="type-h1 text-strong">Statistiky výkonu</h1>
        <p className="mt-1 type-small text-muted">
          Přehled zobrazení, odhalení telefonu, oblíbených a poptávek za posledních 30 dní.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} padding="md" className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="type-caption font-medium text-muted">{c.label}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-100 text-accent-text">
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
              </div>
              <p className="font-display text-3xl font-semibold text-strong tnum">
                {c.value.toLocaleString("cs-CZ")}
              </p>
            </Card>
          );
        })}
      </div>

      <ViewsChart data={stats.dailyViews} />

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-line-subtle px-5 py-4">
          <h2 className="type-h3 text-strong">Výkon po inzerátech (posledních 30 dní)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-subtle">
                <th className="px-4 py-3 type-caption font-semibold text-muted">Inzerát</th>
                <th className="px-3 py-3 type-caption font-semibold text-muted">Stav</th>
                <th className="px-3 py-3 text-right type-caption font-semibold text-muted">
                  Zobrazení
                </th>
                <th className="px-3 py-3 text-right type-caption font-semibold text-muted">
                  Telefon
                </th>
                <th className="px-3 py-3 text-right type-caption font-semibold text-muted">
                  Oblíbené
                </th>
                <th className="px-4 py-3 text-right type-caption font-semibold text-muted">
                  Poptávky
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {stats.perListing.map((row) => (
                <tr key={row.id} className="hover:bg-hover/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/nemovitost/${row.slug}`}
                      className="block max-w-xs truncate type-small font-medium text-strong hover:text-accent-text hover:underline"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Badge variant={row.status === "active" ? "success" : "neutral"}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right type-small font-semibold text-strong tnum">
                    {row.views30d.toLocaleString("cs-CZ")}
                  </td>
                  <td className="px-3 py-3 text-right type-small text-body tnum">
                    {row.phoneReveals30d.toLocaleString("cs-CZ")}
                  </td>
                  <td className="px-3 py-3 text-right type-small text-body tnum">
                    {row.favoritesCount.toLocaleString("cs-CZ")}
                  </td>
                  <td className="px-4 py-3 text-right type-small text-body tnum">
                    {row.inquiriesCount.toLocaleString("cs-CZ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
