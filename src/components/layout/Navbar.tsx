"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
  IconButton,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/prodej/vse", label: t("sale"), active: pathname.startsWith("/prodej") },
    { href: "/pronajem/vse", label: t("rent"), active: pathname.startsWith("/pronajem") },
    { href: "/inzerce", label: t("advertise"), active: pathname.startsWith("/inzerce") },
    { href: "/o-nas", label: "O nás", active: pathname === "/o-nas" },
  ];

  return (
    <header
      className={cn(
        "glass-1 sticky top-0 z-20 transition-[height,box-shadow] duration-200 ease-out",
        scrolled ? "h-13 sm:h-16 shadow-card" : "h-15 sm:h-18",
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={t("homeLabel")}
          className="inline-flex items-center rounded-md py-1"
        >
          <Logo variant="full" size="sm" />
        </Link>

        <nav aria-label="Hlavní navigace" className="hidden items-center gap-1 md:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex h-10 items-center rounded-md px-3.5 type-small font-medium transition-colors duration-150",
                item.active
                  ? "bg-violet-100 text-violet-800"
                  : "text-body hover:bg-hover hover:text-strong",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/inzerce">{t("addListing")}</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/prodej/vse">{t("sale")}</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Drawer>
            <DrawerTrigger asChild>
              <IconButton variant="ghost" size="md" aria-label={t("openMenu")}>
                <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
            </DrawerTrigger>
            <DrawerContent title="Navigace" side="right" closeLabel={t("closeMenu")}>
              <nav aria-label="Mobilní navigace" className="flex flex-col gap-1.5">
                {links.map((item) => (
                  <DrawerClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-11 items-center rounded-md px-4 type-body font-medium transition-colors duration-150",
                        item.active
                          ? "bg-violet-100 text-violet-800"
                          : "text-strong hover:bg-hover",
                      )}
                    >
                      {item.label}
                    </Link>
                  </DrawerClose>
                ))}
                <div className="mt-4 border-t border-line-subtle pt-4">
                  <DrawerClose asChild>
                    <Button variant="primary" size="md" className="w-full" asChild>
                      <Link href="/inzerce">{t("addListing")}</Link>
                    </Button>
                  </DrawerClose>
                </div>
              </nav>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  );
}
