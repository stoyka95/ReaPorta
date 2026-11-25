import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { StaticArticlePage } from "@/components/static/StaticArticlePage";

export const metadata: Metadata = {
  title: "Zásady používání cookies",
};

export default function CookiesPage() {
  return (
    <StaticArticlePage
      eyebrow="Soukromí"
      title="Zásady používání cookies"
      lead={`Portál ${BRAND.name} v aktuální verzi používá pouze nezbytné technické cookies.`}
      sections={[
        {
          heading: "Nezbytné cookies",
          paragraphs: [
            "Používáme výhradně technické cookies potřebné pro zabezpečení přihlášení a základní funkčnost webu. Proto nezobrazujeme rušivou marketingovou cookie lištu.",
          ],
        },
        {
          heading: "Analytika a marketing",
          paragraphs: [
            "Žádné analytické ani reklamní cookies třetích stran nejsou aktivní. Pokud se to v budoucnu změní, doplníme před jejich spuštěním volbu souhlasu.",
          ],
        },
      ]}
    />
  );
}
