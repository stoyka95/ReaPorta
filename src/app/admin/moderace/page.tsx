import { getPendingModerationQueue } from "@/db/queries/admin";
import { requirePageAdmin } from "@/lib/auth/session";
import { ModerationQueueClient } from "@/components/admin/ModerationQueueClient";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  await requirePageAdmin("/admin/moderace");
  const queue = await getPendingModerationQueue();

  return (
    <div className="space-y-6">
      <header>
        <p className="type-eyebrow text-accent-text">Kontrola kvality</p>
        <h1 className="type-h1 text-strong">Moderace inzerátů</h1>
        <p className="mt-1 type-body text-muted">
          Zkontrolujte nové nabídky čekající na schválení. Po rozhodnutí odešleme makléři e-mail a
          zaznamenáme akci do auditního protokolu.
        </p>
      </header>

      <ModerationQueueClient initialItems={queue} />
    </div>
  );
}
