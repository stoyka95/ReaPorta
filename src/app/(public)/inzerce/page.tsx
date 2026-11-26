import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BRAND } from "@/config/brand";
import { Button, Card, GlassPanel } from "@/components/ui";
import { nbsp } from "@/lib/format";

export const metadata: Metadata = {
  title: "Inzerce pro makléře a vlastníky",
  description: `Inzerujte nemovitosti na portálu ${BRAND.name}.`,
};

const BENEFITS = [
  "Čistá prezentace fotografií ve vysokém rozlišení a bez reklamních bannerů",
  "Přehledný průvodce vložením inzerátu s automatickým ukládáním konceptu",
  "Okamžité statistiky zobrazení, odhalení telefonu a přehledná schránka poptávek",
  "Veřejný profil makléře a realitní kanceláře napojený na aktivní nabídky",
];

export default function AdvertisePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <GlassPanel level={2} padding="lg" radius="2xl" className="space-y-5">
        <p className="type-eyebrow text-accent-text">Pro makléře i soukromé vlastníky</p>
        <h1 className="type-h1 text-strong max-w-2xl">
          {nbsp(`Prezentujte své nemovitosti na ${BRAND.name} v designu, který prodává.`)}
        </h1>
        <p className="type-body-lg max-w-2xl text-body">
          {nbsp(
            "Vytvořte si makléřský účet a během několika minut přidejte první nabídku s mapou, galerií fotografií a přehledem poptávek i statistik.",
          )}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="primary" size="lg" asChild>
            <Link href="/dashboard/inzeraty/novy">Vložit inzerát</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/registrace">Vytvořit účet makléře</Link>
          </Button>
        </div>
      </GlassPanel>

      <Card padding="lg" className="space-y-4">
        <h2 className="type-h3 text-strong">Co inzerentům přinášíme</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {BENEFITS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 type-body text-body">
              <CheckCircle2
                className="mt-1 h-5 w-5 shrink-0 text-accent-text"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>{nbsp(item)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
