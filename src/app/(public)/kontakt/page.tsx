import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { StaticArticlePage } from "@/components/static/StaticArticlePage";

export const metadata: Metadata = {
  title: "Kontakt",
  description: `Kontaktní údaje podpory realitního portálu ${BRAND.name}.`,
};

export default function ContactPage() {
  return (
    <StaticArticlePage
      eyebrow="Podpora"
      title="Kontakt"
      lead="Máte dotaz k inzerci, účtu nebo technickému fungování portálu? Rádi vám pomůžeme."
      sections={[
        {
          heading: "Provozovatel portálu",
          paragraphs: [
            `${BRAND.company}, IČO: ${BRAND.ico}`,
            `Adresa: ${BRAND.address}`,
            `E-mail: ${BRAND.email} · Telefon: ${BRAND.phone}`,
          ],
        },
        {
          heading: "Dotazy ke konkrétní nemovitosti",
          paragraphs: [
            "Pro domluvení prohlídky nebo podrobnosti o vybraném inzerátu využijte prosím kontaktní formulář přímo na stránce dané nabídky. Vaše zpráva se doručí přímo makléři.",
          ],
        },
      ]}
    />
  );
}
