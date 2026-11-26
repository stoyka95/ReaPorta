import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Languages, Mail, Phone } from "lucide-react";
import { getPublicAgentBySlug } from "@/db/queries/profiles";
import { Avatar, Badge, Breadcrumbs, EmptyState, GlassPanel } from "@/components/ui";
import { ListingCard } from "@/components/listing/ListingCard";
import { formatListingCount } from "@/lib/format";

export const revalidate = 60;

const LANG_LABELS: Record<string, string> = {
  cs: "Čeština",
  en: "Angličtina",
  de: "Němčina",
  sk: "Slovenština",
  uk: "Ukrajinština",
};

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getPublicAgentBySlug(slug);
  if (!agent) return { title: "Makléř nenalezen" };

  return {
    title: `${agent.displayName} — profil makléře`,
    description:
      agent.bio?.slice(0, 150) ??
      `Aktivní nabídky a kontaktní údaje makléře ${agent.displayName} na portálu ReaPorta.`,
    alternates: { canonical: `/makleri/${agent.slug}` },
  };
}

export default async function PublicAgentProfilePage({ params }: AgentPageProps) {
  const { slug } = await params;
  const agent = await getPublicAgentBySlug(slug);
  if (!agent) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Úvod", href: "/" },
          { label: "Makléři", href: "/makleri" },
          { label: agent.displayName },
        ]}
      />

      <GlassPanel level={2} padding="lg" radius="2xl" className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={agent.displayName} size="lg" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="type-h1 text-strong">{agent.displayName}</h1>
              {agent.verifiedAt ? <Badge variant="success">Ověřený makléř</Badge> : null}
            </div>

            {agent.agency ? (
              <Link
                href={`/agentury/${agent.agency.slug}`}
                className="inline-flex items-center gap-1.5 type-body font-medium text-accent-text hover:underline"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>{agent.agency.name}</span>
              </Link>
            ) : (
              <p className="type-small text-muted">Soukromý inzerent</p>
            )}

            {agent.bio ? <p className="max-w-3xl type-body text-body">{agent.bio}</p> : null}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 type-small text-body">
              {agent.phonePublic ? (
                <a
                  href={`tel:${agent.phonePublic.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 font-medium text-strong hover:text-accent-text tnum"
                >
                  <Phone className="h-4 w-4 text-accent-text" aria-hidden="true" />
                  <span>{agent.phonePublic}</span>
                </a>
              ) : null}
              {agent.emailPublic ? (
                <a
                  href={`mailto:${agent.emailPublic}`}
                  className="inline-flex items-center gap-1.5 text-strong hover:text-accent-text"
                >
                  <Mail className="h-4 w-4 text-accent-text" aria-hidden="true" />
                  <span>{agent.emailPublic}</span>
                </a>
              ) : null}
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Languages className="h-4 w-4" aria-hidden="true" />
                <span>{agent.languages.map((l) => LANG_LABELS[l] ?? l).join(", ")}</span>
              </span>
            </div>
          </div>
        </div>
      </GlassPanel>

      <section aria-labelledby="agent-listings-heading" className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="agent-listings-heading" className="type-h2 text-strong">
            Aktivní nabídky makléře
          </h2>
          <span className="type-small text-muted tnum">
            {formatListingCount(agent.listings.length)}
          </span>
        </div>

        {agent.listings.length === 0 ? (
          <EmptyState
            title="Makléř momentálně nemá žádné aktivní nabídky."
            description="Zkuste se podívat později nebo prohlédnout ostatní nabídky na portálu."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agent.listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
