"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Save, Trash2 } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import type { UserInquiryItem } from "@/db/queries/account";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Input,
  useToast,
} from "@/components/ui";
import { useSession } from "@/components/auth/SessionProvider";
import { formatDate } from "@/lib/format";

interface ProfileClientProps {
  user: SessionUser;
  inquiries: UserInquiryItem[];
}

export function ProfileClient({ user, inquiries }: ProfileClientProps) {
  const router = useRouter();
  const { refreshSession, signOut } = useSession();
  const { push } = useToast();

  const [name, setName] = React.useState(user.name);
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  const [deleting, setDeleting] = React.useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        push({ tone: "danger", title: data.error ?? "Profil se nepodařilo uložit." });
        return;
      }
      await refreshSession();
      push({ tone: "success", title: "Profil byl aktualizován." });
      router.refresh();
    } catch {
      push({ tone: "danger", title: "Něco se nepovedlo. Zkuste to prosím znovu." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 10) {
      setPasswordError("Nové heslo musí mít alespoň 10 znaků.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        }),
      });
      if (!res.ok) {
        setPasswordError("Současné heslo nesouhlasí nebo se změna nezdařila.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      push({ tone: "success", title: "Heslo bylo změněno." });
    } catch {
      setPasswordError("Heslo se nepodařilo změnit.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        push({ tone: "danger", title: "Účet se nepodařilo smazat." });
        setDeleting(false);
        return;
      }
      await signOut();
      push({ tone: "info", title: "Účet byl smazán." });
      router.push("/");
      router.refresh();
    } catch {
      push({ tone: "danger", title: "Něco se nepovedlo." });
      setDeleting(false);
    }
  }

  const roleLabels: Record<SessionUser["role"], string> = {
    user: "Uživatel",
    agent: "Makléř / inzerent",
    admin: "Administrátor",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <h1 className="type-h1 text-strong">{user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="type-small text-muted">{user.email}</span>
              <Badge variant="new">{roleLabels[user.role]}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Osobní údaje */}
        <Card padding="lg" className="space-y-5">
          <h2 className="type-h3 text-strong">Osobní údaje</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Jméno a příjmení"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Telefon"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+420 602 123 456"
            />
            <Input label="E-mail" value={user.email} disabled />
            <Button
              type="submit"
              variant="primary"
              loading={savingProfile}
              leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
            >
              Uložit změny
            </Button>
          </form>
        </Card>

        {/* Změna hesla */}
        <Card padding="lg" className="space-y-5">
          <h2 className="type-h3 text-strong">Změna hesla</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Současné heslo"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="Nové heslo"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Minimálně 10 znaků."
              error={passwordError ?? undefined}
              required
            />
            <Button
              type="submit"
              variant="secondary"
              loading={changingPassword}
              leftIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
            >
              Změnit heslo
            </Button>
          </form>
        </Card>
      </div>

      {/* Historie odeslaných poptávek */}
      <Card padding="lg" className="space-y-4">
        <h2 className="type-h3 text-strong">Odeslané poptávky</h2>
        {inquiries.length === 0 ? (
          <p className="type-small text-muted">Zatím jste neodeslali žádnou poptávku.</p>
        ) : (
          <div className="divide-y divide-line-subtle">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="flex flex-col gap-1.5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <Link
                    href={`/nemovitost/${inq.listingSlug}`}
                    className="type-body font-medium text-strong hover:text-accent-text hover:underline"
                  >
                    {inq.listingTitle}
                  </Link>
                  <p className="line-clamp-2 type-small text-muted">{inq.message}</p>
                </div>
                <span className="shrink-0 type-caption text-muted tnum">
                  {formatDate(inq.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Smazání účtu */}
      <Card padding="lg" className="border-danger/30 bg-surface space-y-3">
        <h2 className="type-h3 text-danger">Smazání účtu</h2>
        <p className="type-small text-muted">
          Smazáním účtu nenávratně odstraníte svá oblíbená a uložená hledání. Odeslané poptávky
          zůstanou makléřům pouze v anonymizované podobě.
        </p>
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}>
                Smazat účet
              </Button>
            </DialogTrigger>
            <DialogContent
              title="Smazat účet?"
              description="Tuto akci nelze vrátit zpět. Oblíbené nabídky a uložená hledání budou smazány a vaše poptávky anonymizovány."
            >
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="ghost">Zrušit</Button>
                </DialogClose>
                <Button variant="danger" loading={deleting} onClick={handleDeleteAccount}>
                  Trvale smazat účet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
}
