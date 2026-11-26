"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { CheckCircle2, Mail } from "lucide-react";
import { Button, GlassPanel, Input } from "@/components/ui";

const forgotSchema = z.object({
  email: z.string().trim().email("Zadejte prosím platný e-mail."),
});

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Zadejte platný e-mail.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.data.email,
          redirectTo: "/obnova-hesla",
        }),
      });

      if (res.status === 429) {
        setError("Příliš mnoho žádostí o obnovu hesla. Zkuste to prosím později.");
        return;
      }

      // Vždy zobrazíme neutrální potvrzení (neprozrazujeme existenci účtu)
      setSent(true);
    } catch {
      setError("Žádost se nepodařilo odeslat. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <GlassPanel
        level={2}
        padding="lg"
        radius="2xl"
        className="space-y-4 text-center"
        data-forgot-sent="true"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-success-bg text-success">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="type-h2 text-strong">Odkaz je na cestě</h1>
        <p className="type-body text-muted">
          Pokud u nás evidujeme účet s tímto e-mailem, poslali jsme vám odkaz pro nastavení nového
          hesla.
        </p>
        <Button variant="secondary" asChild>
          <Link href="/prihlaseni">Zpět na přihlášení</Link>
        </Button>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel level={2} padding="lg" radius="2xl" className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="type-h2 text-strong">Zapomenuté heslo</h1>
        <p className="type-small text-muted">
          Zadejte e-mail, pod kterým jste se registrovali. Pošleme vám jednorázový odkaz pro obnovu
          hesla.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error ?? undefined}
          placeholder="vas@email.cz"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
          className="w-full"
        >
          Odeslat odkaz pro obnovu
        </Button>
      </form>

      <p className="border-t border-line-subtle pt-4 text-center type-small text-muted">
        <Link href="/prihlaseni" className="font-medium text-accent-text hover:underline">
          Zpět na přihlášení
        </Link>
      </p>
    </GlassPanel>
  );
}
