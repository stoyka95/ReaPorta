"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import type { AdminAgencyItem, AdminAgentAssignmentItem } from "@/db/queries/admin";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  EmptyState,
  Input,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";

interface AdminAgenciesClientProps {
  initialAgencies: AdminAgencyItem[];
  initialAgents: AdminAgentAssignmentItem[];
}

interface AgencyFormState {
  id: string | null;
  name: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  address: string;
}

const EMPTY_FORM: AgencyFormState = {
  id: null,
  name: "",
  description: "",
  website: "",
  email: "",
  phone: "",
  address: "",
};

export function AdminAgenciesClient({ initialAgencies, initialAgents }: AdminAgenciesClientProps) {
  const router = useRouter();
  const { push } = useToast();
  const [agencies, setAgencies] = React.useState(initialAgencies);
  const [agents, setAgents] = React.useState(initialAgents);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<AgencyFormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const agencyOptions = React.useMemo(
    () => [
      { value: "__none__", label: "Nezávislý makléř" },
      ...agencies.map((a) => ({ value: a.id, label: a.name })),
    ],
    [agencies],
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(agency: AdminAgencyItem) {
    setForm({
      id: agency.id,
      name: agency.name,
      description: agency.description ?? "",
      website: agency.website ?? "",
      email: agency.email ?? "",
      phone: agency.phone ?? "",
      address: agency.address ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError("Zadejte prosím název realitní kanceláře.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        website: form.website.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      };
      const url = form.id ? `/api/admin/agencies/${form.id}` : "/api/admin/agencies";
      const method = form.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        agency?: { id: string; slug: string };
      };
      if (!res.ok) {
        setFormError(data.error ?? "Uložení kanceláře selhalo.");
        return;
      }

      if (form.id) {
        setAgencies((prev) => prev.map((a) => (a.id === form.id ? { ...a, ...payload } : a)));
        push({ tone: "success", title: "Kancelář byla upravena" });
      } else if (data.agency) {
        setAgencies((prev) => [
          ...prev,
          {
            id: data.agency!.id,
            slug: data.agency!.slug,
            ...payload,
            agentsCount: 0,
            listingsCount: 0,
          },
        ]);
        push({ tone: "success", title: "Nová kancelář byla vytvořena" });
      }

      setDialogOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(agency: AdminAgencyItem) {
    setBusyId(agency.id);
    try {
      const res = await fetch(`/api/admin/agencies/${agency.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        push({ tone: "danger", title: "Smazání selhalo", description: data.error });
        return;
      }
      setAgencies((prev) => prev.filter((a) => a.id !== agency.id));
      setAgents((prev) =>
        prev.map((ag) =>
          ag.agencyId === agency.id ? { ...ag, agencyId: null, agencyName: null } : ag,
        ),
      );
      push({ tone: "info", title: `Kancelář „${agency.name}“ byla odstraněna` });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleAssign(agentUserId: string, nextValue: string) {
    const agencyId = nextValue === "__none__" ? null : nextValue;
    setBusyId(agentUserId);
    try {
      const res = await fetch("/api/admin/agencies/assign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentUserId, agencyId }),
      });
      if (!res.ok) {
        push({ tone: "danger", title: "Přiřazení makléře selhalo" });
        return;
      }
      const nextAgency = agencies.find((a) => a.id === agencyId);
      setAgents((prev) =>
        prev.map((ag) =>
          ag.userId === agentUserId
            ? { ...ag, agencyId, agencyName: nextAgency?.name ?? null }
            : ag,
        ),
      );
      push({ tone: "success", title: "Přiřazení makléře bylo uloženo" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="type-h2 text-strong">Realitní kanceláře ({agencies.length})</h2>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={openCreate}
          >
            Přidat kancelář
          </Button>
        </div>

        {agencies.length === 0 ? (
          <EmptyState
            title="Zatím žádné realitní kanceláře"
            description="Přidejte první kancelář a přiřaďte k ní makléře."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {agencies.map((agency) => (
              <Card key={agency.id} padding="md" className="flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="type-h3 text-strong">{agency.name}</h3>
                    <span className="type-caption text-muted tabular-nums">
                      {agency.agentsCount} makléřů · {agency.listingsCount} nabídek
                    </span>
                  </div>
                  {agency.address ? (
                    <p className="type-small text-muted">{agency.address}</p>
                  ) : null}
                  {agency.description ? (
                    <p className="type-small text-body line-clamp-2">{agency.description}</p>
                  ) : null}
                  <p className="type-caption text-muted">
                    {[agency.email, agency.phone].filter(Boolean).join(" · ") || "Bez kontaktu"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
                    asChild
                  >
                    <Link href={`/agentury/${agency.slug}`} target="_blank" rel="noreferrer">
                      Profil
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
                    onClick={() => openEdit(agency)}
                  >
                    Upravit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    disabled={busyId === agency.id}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    onClick={() => handleDelete(agency)}
                  >
                    Smazat
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="type-h2 text-strong">Přiřazení makléřů ke kancelářím</h2>
          <p className="type-small text-muted">
            Změna kanceláře aktualizuje profil makléře i vazbu na jeho inzeráty.
          </p>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line-subtle bg-subtle type-caption font-semibold text-muted">
                  <th className="px-4 py-3">Makléř</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Kancelář</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle type-small">
                {agents.map((agent) => (
                  <tr key={agent.userId} className="hover:bg-hover/50">
                    <td className="px-4 py-3 font-medium text-strong">
                      <Link
                        href={`/makleri/${agent.slug}`}
                        className="hover:text-accent-text hover:underline"
                      >
                        {agent.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{agent.email}</td>
                    <td className="px-4 py-3">
                      <div className="w-64">
                        <Select
                          ariaLabel={`Kancelář pro makléře ${agent.displayName}`}
                          options={agencyOptions}
                          value={agent.agencyId ?? "__none__"}
                          disabled={busyId === agent.userId}
                          onValueChange={(val) => handleAssign(agent.userId, val)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title={form.id ? "Upravit kancelář" : "Nová realitní kancelář"}
          description="Údaje se zobrazují na veřejné stránce kanceláře a u karet jejích makléřů."
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Název kanceláře"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Textarea
              label="Popis"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                label="Telefon"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <Input
              label="Adresa sídla"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
            <Input
              label="Webová stránka"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://..."
            />
            {formError ? (
              <p role="alert" className="type-small text-danger">
                {formError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                Zrušit
              </Button>
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                Uložit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
