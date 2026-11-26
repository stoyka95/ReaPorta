import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Globe, Mail, MapPin, Phone } from "lucide-react";
import { getPublicAgencyBySlug } from "@/db/queries/profiles";
import { Avatar, Badge, Breadcrumbs, Card, EmptyState, GlassPanel } from "@/components/ui";
import { ListingCard } from "@/components/listing/ListingCard";
import { formatListingCount } from "@/lib/format";

export const revalidate = 60;

interface AgencyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AgencyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getPublicAgencyBySlug(slug);
  if (!agency) return { title: "Realitní kancelář nenalezena" };

  return {
    title: `${agency.name} — realitní kancelář`,
    description:
      agency.description?.slice(0, 150) ??
      `Makléři a aktivní nabídky kanceláře ${agency.name} na portálu ReaPorta.`,
    alternates: { canonical: `/agentury/${agency.slug}` },
  };
}

export default async function PublicAgencyPage({ params }: AgencyPageProps) {
  const { slug } = await params;
  const agency = await getPublicAgencyBySlug(slug);
  if (!agency) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Úvod", href: "/" },
          { label: "Makléři", href: "/makleri" },
          { label: agency.name },
        ]}
      />

      <GlassPanel level={2} padding="lg" radius="2xl" className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
            {agency.logoKey ? (
              <Image
                src={`/media/${agency.logoKey}`}
                alt={`Logo ${agency.name}`}
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            ) : (
              <Building2 className="h-8 w-8 text-accent-text" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2.5">
            <p className="type-eyebrow text-accent-text">Realitní kancelář</p>
            <h1 className="type-h1 text-strong">{agency.name}</h1>
            {agency.description ? (
              <p className="max-w-3xl type-body text-body">{agency.description}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 type-small text-body">
              {agency.address ? (
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{agency.address}</span>
                </span>
              ) : null}
              {agency.phone ? (
                <a
                  href={`tel:${agency.phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 font-medium text-strong hover:text-accent-text tnum"
                >
                  <Phone className="h-4 w-4 text-accent-text" aria-hidden="true" />
                  <span>{agency.phone}</span>
                </a>
              ) : null}
              {agency.email ? (
                <a
                  href={`mailto:${agency.email}`}
                  className="inline-flex items-center gap-1.5 text-strong hover:text-accent-text"
                >
                  <Mail className="h-4 w-4 text-accent-text" aria-hidden="true" />
                  <span>{agency.email}</span>
                </a>
              ) : null}
              {agency.website ? (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-accent-text hover:underline"
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  <span>Web kanceláře</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Makléři kanceláře */}
      <section aria-labelledby="agency-agents-heading" className="space-y-4">
        <h2 id="agency-agents-heading" className="type-h2 text-strong">
          Tým makléřů ({agency.agents.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agency.agents.map((agent) => (
            <Link
              key={agent.userId}
              href={`/makleri/${agent.slug}`}
              className="block rounded-xl focus-visible:outline-none"
            >
              <Card
                padding="md"
                className="flex items-center gap-3.5 transition-shadow hover:shadow-float"
              >
                <Avatar name={agent.displayName} size="md" />
                <div className="min-w-0 space-y-1">
                  <p className="truncate type-body font-semibold text-strong">
                    {agent.displayName}
                  </p>
                  {agent.verifiedAt ? <Badge variant="success">Ověřený makléř</Badge> : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Aktivní nabídky kanceláře */}
      <section aria-labelledby="agency-listings-heading" className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="agency-listings-heading" className="type-h2 text-strong">
            Aktivní nabídky kanceláře
          </h2>
          <span className="type-small text-muted tnum">
            {formatListingCount(agency.listings.length)}
          </span>
        </div>

        {agency.listings.length === 0 ? (
          <EmptyState
            title="Kancelář momentálně nemá aktivní nabídky."
            description="Prohlédněte si ostatní nabídky na portálu."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agency.listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
