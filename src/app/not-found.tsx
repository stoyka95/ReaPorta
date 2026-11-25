import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { Button, GlassPanel } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-8">
        <Logo variant="full" size="md" />
      </div>
      <GlassPanel level={2} padding="lg" radius="2xl" className="w-full space-y-4">
        <p className="type-eyebrow text-accent-text">{t("notFoundEyebrow")}</p>
        <h1 className="type-h1 text-strong">{t("notFoundTitle")}</h1>
        <p className="mx-auto max-w-md type-body text-body">{t("notFoundBody")}</p>
        <div className="pt-2">
          <Button variant="primary" size="md" asChild>
            <Link href="/">{t("notFoundAction")}</Link>
          </Button>
        </div>
      </GlassPanel>
    </main>
  );
}
