import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Languages } from "lucide-react";
import { getPublicAgentsDirectory } from "@/db/queries/profiles";
import { Avatar, Badge, Card } from "@/components/ui";
import { formatListingCount } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Makléři a realitní kanceláře",
  description: "Přehled ověřených realitních makléřů a kanceláří na portálu ReaPorta.",
  alternates: { canonical: "/makleri" },
};

const LANG_LABELS: Record<string, string> = {
  cs: "CZ",
  en: "EN",
  de: "DE",
  sk: "SK",
  uk: "UA",
};

export default async function AgentsDirectoryPage() {
  const agents = await getPublicAgentsDirectory();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl space-y-2">
        <p className="type-eyebrow text-accent-text">Odborníci na nemovitosti</p>
        <h1 className="type-h1 text-strong">Makléři</h1>
        <p className="type-body text-muted">
          Prohlédněte si profily makléřů a soukromých inzerentů včetně jejich aktuálně aktivních
          nabídek.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card
            key={agent.userId}
            padding="md"
            className="flex h-full flex-col justify-between gap-4 transition-shadow hover:shadow-float"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3.5">
                <Avatar name={agent.displayName} size="md" />
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/makleri/${agent.slug}`}
                    className="block truncate type-h3 text-strong hover:text-accent-text hover:underline"
                  >
                    {agent.displayName}
                  </Link>
                  {agent.agency ? (
                    <Link
                      href={`/agentury/${agent.agency.slug}`}
                      className="inline-flex items-center gap-1 type-small text-muted hover:text-accent-text"
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{agent.agency.name}</span>
                    </Link>
                  ) : (
                    <p className="type-small text-muted">Soukromý inzerent</p>
                  )}
                  {agent.verifiedAt ? (
                    <div>
                      <Badge variant="success">Ověřený makléř</Badge>
                    </div>
                  ) : null}
                </div>
              </div>

              {agent.bio ? <p className="line-clamp-3 type-small text-body">{agent.bio}</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-subtle pt-3">
              <span className="type-small font-medium text-strong tnum">
                {formatListingCount(agent.activeListingsCount)}
              </span>
              <span className="inline-flex items-center gap-1 type-caption text-muted">
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                {agent.languages.map((l) => LANG_LABELS[l] ?? l.toUpperCase()).join(" · ")}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
