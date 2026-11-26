import { listAdminLocations } from "@/db/queries/admin";
import { requirePageAdmin } from "@/lib/auth/session";
import { AdminLocationsClient } from "@/components/admin/AdminLocationsClient";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  await requirePageAdmin("/admin/lokality");
  const locations = await listAdminLocations();

  return (
    <div className="space-y-6">
      <header>
        <p className="type-eyebrow text-accent-text">Číselník území</p>
        <h1 className="type-h1 text-strong">Lokality ČR</h1>
        <p className="mt-1 type-body text-muted">
          Prohlížejte hierarchii krajů, okresů, obcí a městských částí a spravujte jejich názvy i
          souřadnice pro mapu a vyhledávání.
        </p>
      </header>

      <AdminLocationsClient initialLocations={locations} />
    </div>
  );
}
