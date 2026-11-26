"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, Heart, LayoutDashboard, LogOut, Menu, ShieldCheck, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import { useSession } from "@/components/auth/SessionProvider";
import {
  Avatar,
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { user, favoriteIds, signOut } = useSession();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

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

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

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

        <nav aria-label="Hlavní navigace" className="hidden items-center gap-1 lg:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex h-10 items-center whitespace-nowrap rounded-md px-3.5 type-small font-medium transition-colors duration-150",
                item.active
                  ? "bg-violet-100 text-violet-800"
                  : "text-body hover:bg-hover hover:text-strong",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          {user ? (
            <>
              <Link
                href="/ucet/oblibene"
                className="inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 type-small font-medium text-body transition-colors hover:bg-hover hover:text-strong"
              >
                <Heart className="h-4 w-4 text-accent" strokeWidth={1.75} aria-hidden="true" />
                <span className="sr-only">Oblíbené nabídky: </span>
                <span className="tnum">{favoriteIds.size}</span>
              </Link>

              {user.role === "agent" || user.role === "admin" ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/inzerce">{t("addListing")}</Link>
                </Button>
              )}

              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-pill border border-line bg-surface pl-1 pr-3 type-small font-medium text-strong transition-colors hover:bg-hover cursor-pointer"
                  >
                    <span className="sr-only">Menu účtu: </span>
                    <span aria-hidden="true">
                      <Avatar name={user.name} size="sm" />
                    </span>
                    <span className="max-w-28 truncate">{user.name}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-60 p-2">
                  <div className="border-b border-line-subtle px-3 py-2">
                    <p className="truncate type-small font-semibold text-strong">{user.name}</p>
                    <p className="truncate type-caption text-muted">{user.email}</p>
                  </div>
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    <Link
                      href="/ucet"
                      onClick={() => setMenuOpen(false)}
                      className="flex h-10 items-center gap-2.5 rounded-md px-3 type-small text-body hover:bg-hover hover:text-strong"
                    >
                      <User className="h-4 w-4 text-muted" aria-hidden="true" />
                      <span>Můj účet</span>
                    </Link>
                    <Link
                      href="/ucet/oblibene"
                      onClick={() => setMenuOpen(false)}
                      className="flex h-10 items-center gap-2.5 rounded-md px-3 type-small text-body hover:bg-hover hover:text-strong"
                    >
                      <Heart className="h-4 w-4 text-muted" aria-hidden="true" />
                      <span>Oblíbené ({favoriteIds.size})</span>
                    </Link>
                    <Link
                      href="/ucet/hledani"
                      onClick={() => setMenuOpen(false)}
                      className="flex h-10 items-center gap-2.5 rounded-md px-3 type-small text-body hover:bg-hover hover:text-strong"
                    >
                      <Bookmark className="h-4 w-4 text-muted" aria-hidden="true" />
                      <span>Uložená hledání</span>
                    </Link>
                    {user.role === "agent" || user.role === "admin" ? (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex h-10 items-center gap-2.5 rounded-md px-3 type-small text-body hover:bg-hover hover:text-strong"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted" aria-hidden="true" />
                        <span>Dashboard makléře</span>
                      </Link>
                    ) : null}
                    {user.role === "admin" ? (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex h-10 items-center gap-2.5 rounded-md px-3 type-small text-body hover:bg-hover hover:text-strong"
                      >
                        <ShieldCheck className="h-4 w-4 text-muted" aria-hidden="true" />
                        <span>Administrace</span>
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-1.5 border-t border-line-subtle pt-1.5">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex h-10 w-full items-center gap-2.5 rounded-md px-3 type-small text-danger hover:bg-danger-bg cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      <span>Odhlásit se</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/inzerce">{t("addListing")}</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/prihlaseni">{t("login")}</Link>
              </Button>
            </>
          )}
        </div>

        <div className="lg:hidden">
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

                <div className="mt-4 space-y-2 border-t border-line-subtle pt-4">
                  {user ? (
                    <>
                      <DrawerClose asChild>
                        <Link
                          href="/ucet"
                          className="flex min-h-11 items-center gap-2.5 rounded-md px-4 type-body font-medium text-strong hover:bg-hover"
                        >
                          <User className="h-4 w-4 text-muted" aria-hidden="true" />
                          <span>Můj účet</span>
                        </Link>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Link
                          href="/ucet/oblibene"
                          className="flex min-h-11 items-center gap-2.5 rounded-md px-4 type-body font-medium text-strong hover:bg-hover"
                        >
                          <Heart className="h-4 w-4 text-accent" aria-hidden="true" />
                          <span>Oblíbené ({favoriteIds.size})</span>
                        </Link>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Link
                          href="/ucet/hledani"
                          className="flex min-h-11 items-center gap-2.5 rounded-md px-4 type-body font-medium text-strong hover:bg-hover"
                        >
                          <Bookmark className="h-4 w-4 text-muted" aria-hidden="true" />
                          <span>Uložená hledání</span>
                        </Link>
                      </DrawerClose>
                      {user.role === "agent" || user.role === "admin" ? (
                        <DrawerClose asChild>
                          <Link
                            href="/dashboard"
                            className="flex min-h-11 items-center gap-2.5 rounded-md px-4 type-body font-medium text-strong hover:bg-hover"
                          >
                            <LayoutDashboard className="h-4 w-4 text-muted" aria-hidden="true" />
                            <span>Dashboard makléře</span>
                          </Link>
                        </DrawerClose>
                      ) : null}
                      {user.role === "admin" ? (
                        <DrawerClose asChild>
                          <Link
                            href="/admin"
                            className="flex min-h-11 items-center gap-2.5 rounded-md px-4 type-body font-medium text-strong hover:bg-hover"
                          >
                            <ShieldCheck className="h-4 w-4 text-muted" aria-hidden="true" />
                            <span>Administrace</span>
                          </Link>
                        </DrawerClose>
                      ) : null}
                      <DrawerClose asChild>
                        <Button
                          variant="secondary"
                          size="md"
                          className="w-full"
                          onClick={handleSignOut}
                        >
                          Odhlásit se
                        </Button>
                      </DrawerClose>
                    </>
                  ) : (
                    <>
                      <DrawerClose asChild>
                        <Button variant="primary" size="md" className="w-full" asChild>
                          <Link href="/prihlaseni">{t("login")}</Link>
                        </Button>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Button variant="secondary" size="md" className="w-full" asChild>
                          <Link href="/registrace">{t("register")}</Link>
                        </Button>
                      </DrawerClose>
                    </>
                  )}
                </div>
              </nav>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  );
}
