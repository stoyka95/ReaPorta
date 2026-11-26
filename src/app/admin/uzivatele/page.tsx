import { listAdminUsers } from "@/db/queries/admin";
import { requirePageAdmin } from "@/lib/auth/session";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requirePageAdmin("/admin/uzivatele");
  const users = await listAdminUsers();

  return (
    <div className="space-y-6">
      <header>
        <p className="type-eyebrow text-accent-text">Správa účtů</p>
        <h1 className="type-h1 text-strong">Uživatelé</h1>
        <p className="mt-1 type-body text-muted">
          Vyhledávejte uživatele, měňte jejich role a v případě porušení pravidel účet zablokujte.
          Zablokovaný uživatel je okamžitě odhlášen a nemůže se znovu přihlásit.
        </p>
      </header>

      <AdminUsersClient initialUsers={users} currentAdminId={admin.id} />
    </div>
  );
}
