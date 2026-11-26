"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Heart, User } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/ucet", label: "Profil", icon: User, exact: true },
  { href: "/ucet/oblibene", label: "Oblíbené", icon: Heart, exact: false },
  { href: "/ucet/hledani", label: "Uložená hledání", icon: Bookmark, exact: false },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigace účtu"
      className="flex flex-wrap gap-2 border-b border-line-subtle pb-4"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-pill px-4 type-small font-medium transition-colors duration-150",
              active
                ? "bg-accent text-on-accent shadow-accent"
                : "border border-line bg-surface text-body hover:bg-hover hover:text-strong",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
