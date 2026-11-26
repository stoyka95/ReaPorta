import { listAdminReports } from "@/db/queries/admin";
import { requirePageAdmin } from "@/lib/auth/session";
import { AdminReportsClient } from "@/components/admin/AdminReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requirePageAdmin("/admin/nahlaseni");
  const reports = await listAdminReports();

  return (
    <div className="space-y-6">
      <header>
        <p className="type-eyebrow text-accent-text">Bezpečnost obsahu</p>
        <h1 className="type-h1 text-strong">Nahlášení inzerátů</h1>
        <p className="mt-1 type-body text-muted">
          Vyřiďte podněty od uživatelů. Skrytím se inzerát okamžitě pozastaví a zmizí z veřejných
          výpisů i mapy.
        </p>
      </header>

      <AdminReportsClient initialReports={reports} />
    </div>
  );
}
