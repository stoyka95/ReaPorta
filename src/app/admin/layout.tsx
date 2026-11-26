import type { Metadata } from "next";
import { getAdminSidebarCounts } from "@/db/queries/admin";
import { requirePageAdmin } from "@/lib/auth/session";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: { default: "Administrace", template: "%s — Administrace · ReaPorta" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePageAdmin("/admin");
  const counts = await getAdminSidebarCounts();

  const navItems: DashboardNavItem[] = [
    { href: "/admin", label: "Přehled", icon: "overview", exact: true },
    {
      href: "/admin/moderace",
      label: "Moderace",
      icon: "moderation",
      badge: counts.pendingListings,
    },
    { href: "/admin/uzivatele", label: "Uživatelé", icon: "users" },
    { href: "/admin/agentury", label: "Agentury", icon: "agencies" },
    {
      href: "/admin/nahlaseni",
      label: "Nahlášení",
      icon: "reports",
      badge: counts.openReports,
    },
    { href: "/admin/lokality", label: "Lokality", icon: "locations" },
  ];

  return (
    <DashboardShell
      title="Administrace"
      subtitle="Moderace a správa portálu"
      userName={admin.name}
      userEmail={admin.email}
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}
