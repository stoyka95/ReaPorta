"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, Search } from "lucide-react";
import type { AdminUserItem } from "@/db/queries/admin";
import { Badge, Button, Card, EmptyState, Input, Select, useToast } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface AdminUsersClientProps {
  initialUsers: AdminUserItem[];
  currentAdminId: string;
}

const ROLE_OPTIONS = [
  { value: "user", label: "Uživatel" },
  { value: "agent", label: "Makléř" },
  { value: "admin", label: "Správce" },
];

const ROLE_LABELS: Record<"user" | "agent" | "admin", string> = {
  user: "Uživatel",
  agent: "Makléř",
  admin: "Správce",
};

export function AdminUsersClient({ initialUsers, currentAdminId }: AdminUsersClientProps) {
  const router = useRouter();
  const { push } = useToast();
  const [users, setUsers] = React.useState(initialUsers);
  const [query, setQuery] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  async function patchUser(
    userId: string,
    payload: { role?: "user" | "agent" | "admin"; blocked?: boolean },
    successMsg: string,
  ) {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        push({ tone: "danger", title: "Úprava selhala", description: data.error });
        return;
      }
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          return {
            ...u,
            role: payload.role ?? u.role,
            blockedAt:
              payload.blocked === undefined ? u.blockedAt : payload.blocked ? new Date() : null,
          };
        }),
      );
      push({ tone: "success", title: successMsg });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="max-w-md">
        <Input
          label="Vyhledat uživatele"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jméno nebo e-mail…"
          leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Žádný uživatel neodpovídá hledání"
          description="Zkuste upravit hledaný výraz."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line-subtle bg-subtle type-caption font-semibold text-muted">
                  <th className="px-4 py-3">Uživatel</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Stav</th>
                  <th className="px-4 py-3">Aktivita</th>
                  <th className="px-4 py-3">Registrace</th>
                  <th className="px-4 py-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle type-small">
                {filtered.map((user) => {
                  const isSelf = user.id === currentAdminId;
                  const isBlocked = user.blockedAt !== null;
                  const isBusy = busyId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-hover/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-strong">{user.name}</p>
                        <p className="type-caption text-muted">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-36">
                          <Select
                            ariaLabel={`Role pro ${user.email}`}
                            options={ROLE_OPTIONS}
                            value={user.role}
                            disabled={isSelf || isBusy}
                            onValueChange={(nextRole) =>
                              patchUser(
                                user.id,
                                { role: nextRole as "user" | "agent" | "admin" },
                                `Role uživatele ${user.name} změněna na ${ROLE_LABELS[nextRole as "user" | "agent" | "admin"]}.`,
                              )
                            }
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isBlocked ? (
                          <Badge variant="danger">Zablokován</Badge>
                        ) : user.emailVerified ? (
                          <Badge variant="success">Aktivní</Badge>
                        ) : (
                          <Badge variant="warning">Neověřen</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 type-caption text-muted tabular-nums">
                        {user.listingsCount} inzerátů · {user.favoritesCount} obl. ·{" "}
                        {user.inquiriesCount} popt.
                      </td>
                      <td className="px-4 py-3 text-muted tabular-nums">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isSelf ? (
                          <span className="type-caption text-muted">Váš účet</span>
                        ) : isBlocked ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={isBusy}
                            disabled={isBusy}
                            leftIcon={<CheckCircle className="h-4 w-4" aria-hidden="true" />}
                            onClick={() =>
                              patchUser(
                                user.id,
                                { blocked: false },
                                `Účet ${user.email} byl odblokován.`,
                              )
                            }
                          >
                            Odblokovat
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            loading={isBusy}
                            disabled={isBusy}
                            leftIcon={<Ban className="h-4 w-4" aria-hidden="true" />}
                            onClick={() =>
                              patchUser(
                                user.id,
                                { blocked: true },
                                `Účet ${user.email} byl zablokován.`,
                              )
                            }
                          >
                            Zablokovat
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
