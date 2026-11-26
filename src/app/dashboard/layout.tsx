import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { inquiries } from "@/db/schema";
import { requirePageAgent } from "@/lib/auth/session";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageAgent("/dashboard");
  const db = getDb();
  const [unreadRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(inquiries)
    .where(and(eq(inquiries.agentId, user.id), eq(inquiries.status, "new")));

  const navItems: DashboardNavItem[] = [
    { href: "/dashboard", label: "Přehled", icon: "overview", exact: true },
    { href: "/dashboard/inzeraty", label: "Moje inzeráty", icon: "listings", exact: true },
    { href: "/dashboard/inzeraty/novy", label: "Nový inzerát", icon: "new" },
    {
      href: "/dashboard/poptavky",
      label: "Poptávky",
      icon: "inquiries",
      badge: unreadRow?.count ?? 0,
    },
    { href: "/dashboard/statistiky", label: "Statistiky", icon: "stats" },
    { href: "/dashboard/profil", label: "Profil makléře", icon: "profile" },
  ];

  return (
    <DashboardShell
      title="Dashboard makléře"
      subtitle="Správa nabídek a poptávek"
      userName={user.name}
      userEmail={user.email}
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}
