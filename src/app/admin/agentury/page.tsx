import { listAdminAgenciesAndAgents } from "@/db/queries/admin";
import { requirePageAdmin } from "@/lib/auth/session";
import { AdminAgenciesClient } from "@/components/admin/AdminAgenciesClient";

export const dynamic = "force-dynamic";

export default async function AdminAgenciesPage() {
  await requirePageAdmin("/admin/agentury");
  const { agencies, agents } = await listAdminAgenciesAndAgents();

  return (
    <div className="space-y-6">
      <header>
        <p className="type-eyebrow text-accent-text">Partneři</p>
        <h1 className="type-h1 text-strong">Agentury a makléři</h1>
        <p className="mt-1 type-body text-muted">
          Vytvářejte a upravujte realitní kanceláře a přiřazujte k nim registrované makléře.
        </p>
      </header>

      <AdminAgenciesClient initialAgencies={agencies} initialAgents={agents} />
    </div>
  );
}
