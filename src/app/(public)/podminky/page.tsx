import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { StaticArticlePage } from "@/components/static/StaticArticlePage";

export const metadata: Metadata = {
  title: "Podmínky použití",
};

export default function TermsPage() {
  return (
    <StaticArticlePage
      eyebrow="Právní dokument"
      title="Podmínky použití"
      lead={`Vzorové podmínky upravující používání realitního portálu ${BRAND.name}.`}
      sections={[
        {
          heading: "1. Rozsah služby",
          paragraphs: [
            `Portál ${BRAND.name} poskytuje prostor pro zveřejňování a vyhledávání nabídek prodeje a pronájmu nemovitostí. Provozovatel není stranou kupních ani nájemních smluv.`,
          ],
        },
        {
          heading: "2. Odpovědnost za obsah inzerátů",
          paragraphs: [
            "Za pravdivost údajů, právní bezvadnost fotografií a aktuálnost nabídek odpovídá výhradně inzerent. Provozovatel si vyhrazuje právo pozastavit či odstranit nepravdivé nebo duplicitní inzeráty.",
          ],
        },
      ]}
    />
  );
}
