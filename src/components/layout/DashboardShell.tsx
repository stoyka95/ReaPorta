"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PlusCircle,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useSession } from "@/components/auth/SessionProvider";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
  IconButton,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon:
    | "overview"
    | "listings"
    | "new"
    | "inquiries"
    | "stats"
    | "profile"
    | "moderation"
    | "users"
    | "agencies"
    | "reports"
    | "locations";
  badge?: number;
  exact?: boolean;
}

const ICONS = {
  overview: LayoutDashboard,
  listings: Home,
  new: PlusCircle,
  inquiries: Inbox,
  stats: BarChart3,
  profile: UserCircle,
  moderation: ShieldCheck,
  users: Users,
  agencies: Building2,
  reports: Flag,
  locations: MapPin,
} as const;

export interface DashboardShellProps {
  title: string;
  subtitle?: string;
  userName: string;
  userEmail: string;
  navItems: DashboardNavItem[];
  children: React.ReactNode;
}

export function DashboardShell({
  title,
  subtitle,
  userName,
  userEmail,
  navItems,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useSession();
  const [collapsed, setCollapsed] = React.useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  function renderNavLinks(onNavigate?: () => void) {
    return navItems.map((item) => {
      const Icon = ICONS[item.icon];
      const active = item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
      const content = (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          title={collapsed ? item.label : undefined}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-lg px-3 type-small font-medium transition-colors duration-150",
            active ? "bg-violet-100 text-violet-800" : "text-body hover:bg-hover hover:text-strong",
            collapsed && "lg:justify-center lg:px-2",
          )}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className={cn("flex-1 truncate", collapsed && "lg:sr-only")}>{item.label}</span>
          {item.badge && item.badge > 0 ? (
            <Badge variant="new" className={cn(collapsed && "lg:hidden")}>
              {item.badge}
            </Badge>
          ) : null}
        </Link>
      );

      if (onNavigate) {
        return (
          <DrawerClose key={item.href} asChild>
            {content}
          </DrawerClose>
        );
      }
      return content;
    });
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Mobilní horní lišta */}
      <header className="glass-1 sticky top-0 z-20 flex h-15 items-center justify-between gap-3 px-4 lg:hidden">
        <Link href="/" aria-label="ReaPorta, úvodní stránka" className="inline-flex items-center">
          <Logo variant="full" size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="type-small font-medium text-strong truncate max-w-36">{title}</span>
          <Drawer>
            <DrawerTrigger asChild>
              <IconButton variant="ghost" size="md" aria-label="Otevřít menu dashboardu">
                <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
            </DrawerTrigger>
            <DrawerContent title={title} side="left" closeLabel="Zavřít menu">
              <div className="flex h-full flex-col justify-between gap-6">
                <nav aria-label="Navigace sekce" className="flex flex-col gap-1">
                  {renderNavLinks(() => {})}
                </nav>
                <div className="space-y-2 border-t border-line-subtle pt-4">
                  <DrawerClose asChild>
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full"
                      leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
                      asChild
                    >
                      <Link href="/">Zpět na portál</Link>
                    </Button>
                  </DrawerClose>
                  <Button
                    variant="ghost"
                    size="md"
                    className="w-full text-danger"
                    leftIcon={<LogOut className="h-4 w-4" aria-hidden="true" />}
                    onClick={handleSignOut}
                  >
                    Odhlásit se
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </header>

      {/* Desktop levý skleněný sidebar (264 px / sbalitelný) */}
      <aside
        className={cn(
          "glass-1 sticky top-0 hidden h-dvh shrink-0 flex-col justify-between border-r border-line-subtle p-4 transition-[width] duration-200 lg:flex",
          collapsed ? "w-20" : "w-66",
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              aria-label="ReaPorta, úvodní stránka"
              className="inline-flex items-center overflow-hidden"
            >
              <Logo variant={collapsed ? "mark" : "full"} size="sm" />
            </Link>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label={collapsed ? "Rozbalit postranní panel" : "Sbalit postranní panel"}
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              )}
            </IconButton>
          </div>

          {!collapsed ? (
            <div className="px-2">
              <p className="type-eyebrow text-accent-text">{title}</p>
              {subtitle ? <p className="mt-0.5 type-caption text-muted">{subtitle}</p> : null}
            </div>
          ) : null}

          <nav aria-label="Hlavní navigace dashboardu" className="flex flex-col gap-1">
            {renderNavLinks()}
          </nav>
        </div>

        <div className="space-y-3 border-t border-line-subtle pt-4">
          <div className={cn("flex items-center gap-2.5 px-1", collapsed && "justify-center")}>
            <Avatar name={userName} size="sm" />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate type-small font-semibold text-strong">{userName}</p>
                <p className="truncate type-caption text-muted">{userEmail}</p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              className={cn(
                "flex h-10 items-center gap-2.5 rounded-md px-3 type-small text-body hover:bg-hover hover:text-strong",
                collapsed && "justify-center px-2",
              )}
              title="Zpět na portál"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className={cn(collapsed && "sr-only")}>Zpět na portál</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className={cn(
                "flex h-10 items-center gap-2.5 rounded-md px-3 type-small text-danger hover:bg-danger-bg cursor-pointer",
                collapsed && "justify-center px-2",
              )}
              title="Odhlásit se"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className={cn(collapsed && "sr-only")}>Odhlásit se</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Hlavní obsah */}
      <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
