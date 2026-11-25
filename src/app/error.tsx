"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import { Button, GlassPanel } from "@/components/ui";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-8">
        <Logo variant="full" size="md" />
      </div>
      <GlassPanel level={2} padding="lg" radius="2xl" className="w-full space-y-4">
        <p className="type-eyebrow text-danger">{t("serverEyebrow")}</p>
        <h1 className="type-h1 text-strong">{t("serverTitle")}</h1>
        <p className="mx-auto max-w-md type-body text-body">{t("serverBody")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="md" onClick={reset}>
            {t("retry")}
          </Button>
          <Button variant="secondary" size="md" asChild>
            <Link href="/">{t("notFoundAction")}</Link>
          </Button>
        </div>
      </GlassPanel>
    </main>
  );
}
