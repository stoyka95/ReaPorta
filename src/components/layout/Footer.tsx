import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { BRAND } from "@/config/brand";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" aria-label={`${BRAND.name}, úvodní stránka`} className="inline-flex">
              <Logo variant="full" size="md" />
            </Link>
            <p className="max-w-xs type-small text-muted">{t("tagline")}</p>
            <p className="type-caption text-muted">
              {BRAND.email} · {BRAND.phone}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="type-small font-semibold text-strong">{t("colOffers")}</h2>
            <ul className="space-y-2.5 type-small text-body">
              <li>
                <Link href="/prodej/byty" className="transition-colors hover:text-accent-text">
                  {t("saleFlats")}
                </Link>
              </li>
              <li>
                <Link href="/prodej/domy" className="transition-colors hover:text-accent-text">
                  {t("saleHouses")}
                </Link>
              </li>
              <li>
                <Link href="/pronajem/byty" className="transition-colors hover:text-accent-text">
                  {t("rentFlats")}
                </Link>
              </li>
              <li>
                <Link href="/prodej/pozemky" className="transition-colors hover:text-accent-text">
                  {t("saleLand")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="type-small font-semibold text-strong">{t("colPortal")}</h2>
            <ul className="space-y-2.5 type-small text-body">
              <li>
                <Link href="/o-nas" className="transition-colors hover:text-accent-text">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="transition-colors hover:text-accent-text">
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link href="/inzerce" className="transition-colors hover:text-accent-text">
                  {t("advertise")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="type-small font-semibold text-strong">{t("colLegal")}</h2>
            <ul className="space-y-2.5 type-small text-body">
              <li>
                <Link href="/podminky" className="transition-colors hover:text-accent-text">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href="/ochrana-udaju" className="transition-colors hover:text-accent-text">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="transition-colors hover:text-accent-text">
                  {t("cookies")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-line-subtle pt-6 sm:flex-row sm:items-center">
          <p className="type-caption text-muted">
            © {new Date().getFullYear()} {BRAND.name}. {t("rights")}
          </p>
          <p className="type-caption text-muted">{BRAND.address}</p>
        </div>
      </div>
    </footer>
  );
}
