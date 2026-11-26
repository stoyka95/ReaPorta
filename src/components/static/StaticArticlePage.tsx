import { getTranslations } from "next-intl/server";
import { Badge, Breadcrumbs, Card } from "@/components/ui";
import { nbsp } from "@/lib/format";

export interface StaticSection {
  heading: string;
  paragraphs: string[];
}

export interface StaticArticlePageProps {
  eyebrow: string;
  title: string;
  lead: string;
  sections: StaticSection[];
  showSampleNotice?: boolean;
}

export async function StaticArticlePage({
  eyebrow,
  title,
  lead,
  sections,
  showSampleNotice = true,
}: StaticArticlePageProps) {
  const t = await getTranslations("static");

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Breadcrumbs items={[{ label: "Úvod", href: "/" }, { label: title }]} />

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="type-eyebrow text-accent-text">{eyebrow}</p>
          {showSampleNotice ? <Badge variant="info">Vzorový dokument</Badge> : null}
        </div>
        <h1 className="type-h1 text-strong">{title}</h1>
        <p className="type-body-lg max-w-2xl text-body">{nbsp(lead)}</p>
      </header>

      {showSampleNotice ? (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 type-small text-violet-800">
          {t("sampleNotice")}
        </div>
      ) : null}

      <Card padding="lg" className="space-y-8">
        {sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="type-h3 text-strong">{section.heading}</h2>
            {section.paragraphs.map((p, idx) => (
              <p key={idx} className="max-w-[68ch] type-body text-body">
                {nbsp(p)}
              </p>
            ))}
          </section>
        ))}
      </Card>
    </div>
  );
}
