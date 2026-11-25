import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { StaticArticlePage } from "@/components/static/StaticArticlePage";

export const metadata: Metadata = {
  title: "Ochrana osobních údajů",
};

export default function PrivacyPage() {
  return (
    <StaticArticlePage
      eyebrow="GDPR"
      title="Ochrana osobních údajů"
      lead={`Přehled zpracování osobních údajů na portálu ${BRAND.name}.`}
      sections={[
        {
          heading: "1. Správce osobních údajů",
          paragraphs: [
            `Správcem údajů je ${BRAND.company}, ${BRAND.address}. V otázkách ochrany soukromí nás můžete kontaktovat na adrese ${BRAND.email}.`,
          ],
        },
        {
          heading: "2. Jaké údaje zpracováváme",
          paragraphs: [
            "Při odeslání poptávky zpracováváme jméno, e-mail, případně telefon a text zprávy výhradně za účelem předání kontaktu makléři a ochrany proti zneužití (anonymizovaný hash IP adresy).",
            "V rámci MVP nepoužíváme reklamní ani sledovací nástroje třetích stran.",
          ],
        },
      ]}
    />
  );
}
