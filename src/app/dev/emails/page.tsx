import { notFound } from "next/navigation";
import {
  buildInquiryAgentEmail,
  buildInquiryConfirmationEmail,
  buildModerationResultEmail,
  buildResetPasswordEmail,
  buildSavedSearchAlertEmail,
  buildVerificationEmail,
} from "@/lib/email";
import { Card } from "@/components/ui";

export default function DevEmailsPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const samples = [
    {
      label: "1. Ověření e-mailu",
      email: buildVerificationEmail({
        name: "Anna Kratochvílová",
        verifyUrl: "http://localhost:3000/overeni-emailu?token=ukazkovy-token",
      }),
    },
    {
      label: "2. Obnova hesla",
      email: buildResetPasswordEmail({
        name: "Anna Kratochvílová",
        resetUrl: "http://localhost:3000/obnova-hesla?token=ukazkovy-reset",
      }),
    },
    {
      label: "3. Nová poptávka (makléři)",
      email: buildInquiryAgentEmail({
        listingTitle: "Prodej bytu 3+kk, 78 m², Praha 5 – Smíchov",
        listingUrl: "http://localhost:3000/nemovitost/ukazkovy-byt",
        senderName: "Petr Zájemce",
        senderEmail: "petr@example.test",
        senderPhone: "+420 602 123 456",
        message: "Dobrý den, měl bych zájem o osobní prohlídku v příštím týdnu.",
      }),
    },
    {
      label: "4. Potvrzení poptávky (zájemci)",
      email: buildInquiryConfirmationEmail({
        listingTitle: "Prodej bytu 3+kk, 78 m², Praha 5 – Smíchov",
        listingUrl: "http://localhost:3000/nemovitost/ukazkovy-byt",
        senderName: "Petr Zájemce",
      }),
    },
    {
      label: "5. Výsledek moderace (zamítnuto s důvodem)",
      email: buildModerationResultEmail({
        agentName: "Tereza Novotná",
        listingTitle: "Prodej rodinného domu, 145 m², Brno – Královo Pole",
        listingUrl: "http://localhost:3000/dashboard/inzeraty",
        approved: false,
        reason: "Prosíme doplňte energetický štítek (PENB) a alespoň 3 fotografie interiéru.",
      }),
    },
    {
      label: "6. Hlídací pes — nové nabídky",
      email: buildSavedSearchAlertEmail({
        userName: "Anna Kratochvílová",
        searchName: "Prodej bytů · Brno do 8 mil.",
        searchUrl: "http://localhost:3000/prodej/byty/brno",
        listings: [
          {
            title: "Prodej bytu 2+kk, 54 m², Brno – Veveří",
            priceText: "6 290 000 Kč",
            location: "Brno – Veveří",
            url: "http://localhost:3000/nemovitost/ukazkovy-byt-1",
          },
          {
            title: "Prodej bytu 3+kk, 76 m², Brno – Žabovřesky",
            priceText: "7 850 000 Kč",
            location: "Brno – Žabovřesky",
            url: "http://localhost:3000/nemovitost/ukazkovy-byt-2",
          },
        ],
      }),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="type-eyebrow text-accent-text">Dev nástroj</p>
        <h1 className="type-h1 text-strong">Náhled všech e-mailových šablon ReaPorta</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {samples.map((sample) => (
          <Card key={sample.label} padding="md" className="space-y-3">
            <div>
              <h2 className="type-h3 text-strong">{sample.label}</h2>
              <p className="type-caption text-muted">Předmět: {sample.email.subject}</p>
            </div>
            <iframe
              title={sample.label}
              srcDoc={sample.email.html}
              loading="eager"
              className="h-96 w-full rounded-lg border border-line bg-page"
              sandbox=""
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
