"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Button, GlassPanel, Input } from "@/components/ui";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(10, "Nové heslo musí mít alespoň 10 znaků.")
      .max(128, "Heslo může mít nejvýše 128 znaků."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Hesla se neshodují.",
  });

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(
    token ? null : "Odkaz pro obnovu hesla je neplatný nebo chybí token.",
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || submitting) return;
    setFieldErrors({});
    setFormError(null);

    const parsed = resetSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: parsed.data.password,
          token,
        }),
      });
      if (!res.ok) {
        setFormError("Odkaz pro obnovu hesla je neplatný, již byl použit nebo vypršel.");
        return;
      }
      setDone(true);
    } catch {
      setFormError("Heslo se nepodařilo změnit. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <GlassPanel
        level={2}
        padding="lg"
        radius="2xl"
        className="space-y-4 text-center"
        data-reset-success="true"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-success-bg text-success">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="type-h2 text-strong">Heslo bylo změněno</h1>
        <p className="type-body text-muted">
          Nyní se můžete přihlásit s novým heslem. Starý odkaz pro obnovu je již neplatný.
        </p>
        <Button variant="primary" size="lg" className="w-full" asChild>
          <Link href="/prihlaseni">Přihlásit se</Link>
        </Button>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel level={2} padding="lg" radius="2xl" className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="type-h2 text-strong">Nastavit nové heslo</h1>
        <p className="type-small text-muted">Zvolte si nové heslo o délce alespoň 10 znaků.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Nové heslo"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          helperText="Minimálně 10 znaků."
          disabled={!token}
          required
        />
        <Input
          label="Potvrzení hesla"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
          disabled={!token}
          required
        />

        {formError ? (
          <div
            role="alert"
            className="rounded-md border border-danger bg-danger-bg px-3.5 py-2.5 type-small text-strong"
          >
            {formError}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={!token}
          leftIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
          className="w-full"
        >
          Uložit nové heslo
        </Button>
      </form>
    </GlassPanel>
  );
}
