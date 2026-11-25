import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { StaticArticlePage } from "@/components/static/StaticArticlePage";

export const metadata: Metadata = {
  title: "O nás",
  description: `Poznejte realitní portál ${BRAND.name} a naše zásady přehledné inzerce nemovitostí.`,
};

export default function AboutPage() {
  return (
    <StaticArticlePage
      eyebrow="O portálu"
      title={`O portálu ${BRAND.name}`}
      lead={`Stavíme klidné a přehledné místo pro hledání i inzerci nemovitostí v České republice.`}
      sections={[
        {
          heading: "Naše filozofie",
          paragraphs: [
            `${BRAND.name} vznikla s jednoduchým cílem: nechat vyniknout samotné nemovitosti a poskytnout zájemcům pravdivá, srozumitelně uspořádaná data bez reklamního hluku.`,
            "Všechny parametry, energetické štítky i poloha na mapě mají jasnou strukturu, která usnadňuje porovnávání nabídek na telefonu i počítači.",
          ],
        },
        {
          heading: "Transparentní pravidla",
          paragraphs: [
            "Každý nový inzerát prochází kontrolou úplnosti a správnosti. Uživatelé mohou kdykoli nahlásit nesrovnalost nebo neaktuální nabídku.",
          ],
        },
      ]}
    />
  );
}
