import { getTranslations } from "next-intl/server";
import { BRAND } from "@/config/brand";

export default async function HomePage() {
  const t = await getTranslations("stage0");

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="glass-2 w-full max-w-xl rounded-2xl p-8 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-accent-text">
          {BRAND.name} · {t("eyebrow")}
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-strong sm:text-4xl">
          {t("heading")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-body">{t("body")}</p>
      </div>
    </main>
  );
}
