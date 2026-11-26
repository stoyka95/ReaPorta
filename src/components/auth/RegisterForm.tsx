"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { CheckCircle2, UserPlus } from "lucide-react";
import { Button, Checkbox, GlassPanel, Input } from "@/components/ui";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Zadejte prosím své jméno (alespoň 2 znaky).")
    .max(80, "Jméno může mít nejvýše 80 znaků."),
  email: z.string().trim().email("Zadejte prosím platný e-mail."),
  password: z
    .string()
    .min(10, "Heslo musí mít alespoň 10 znaků.")
    .max(128, "Heslo může mít nejvýše 128 znaků."),
  wantToAdvertise: z.boolean(),
});

export function RegisterForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [wantToAdvertise, setWantToAdvertise] = React.useState(false);

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setFormError(null);

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      wantToAdvertise,
    });
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
      const res = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
          role: parsed.data.wantToAdvertise ? "agent" : "user",
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
      };

      if (res.status === 429) {
        setFormError(data.message ?? "Příliš mnoho pokusů o registraci. Zkuste to později.");
        return;
      }

      if (!res.ok) {
        if (
          data.code === "USER_ALREADY_EXISTS" ||
          data.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
          (data.message ?? "").toLowerCase().includes("already exists")
        ) {
          setFormError(
            "Registraci s tímto e-mailem nelze dokončit. Zkuste se prosím přihlásit nebo obnovit heslo.",
          );
          return;
        }
        setFormError(data.message ?? "Registraci se nepodařilo dokončit. Zkuste to prosím znovu.");
        return;
      }

      setRegisteredEmail(parsed.data.email);
    } catch {
      setFormError("Registraci se nepodařilo dokončit. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (registeredEmail) {
    return (
      <GlassPanel
        level={2}
        padding="lg"
        radius="2xl"
        className="space-y-4 text-center"
        data-register-success="true"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-success-bg text-success">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="type-h2 text-strong">Ověřte prosím svůj e-mail</h1>
        <p className="type-body text-muted">
          Na adresu <strong className="text-strong">{registeredEmail}</strong> jsme poslali
          ověřovací odkaz. Po kliknutí na odkaz se můžete přihlásit.
        </p>
        <div className="pt-2">
          <Button variant="secondary" asChild>
            <Link href="/prihlaseni">Přejít na přihlášení</Link>
          </Button>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel level={2} padding="lg" radius="2xl" className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="type-h2 text-strong">Vytvořit účet</h1>
        <p className="type-small text-muted">
          Ukládejte si oblíbené nemovitosti, nastavte hlídacího psa nebo začněte inzerovat.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Jméno a příjmení"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          placeholder="Jan Novák"
          required
        />
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          placeholder="jan.novak@email.cz"
          required
        />
        <Input
          label="Heslo"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          helperText="Minimálně 10 znaků."
          required
        />

        <div className="rounded-md border border-line-subtle bg-subtle p-3.5">
          <Checkbox
            checked={wantToAdvertise}
            onCheckedChange={(v) => setWantToAdvertise(Boolean(v))}
            label="Chci inzerovat nemovitosti (účet makléře / vlastníka)"
          />
        </div>

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
          leftIcon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
          className="w-full"
        >
          Zaregistrovat se
        </Button>
      </form>

      <p className="border-t border-line-subtle pt-4 text-center type-small text-muted">
        Už máte účet?{" "}
        <Link href="/prihlaseni" className="font-medium text-accent-text hover:underline">
          Přihlásit se
        </Link>
      </p>
    </GlassPanel>
  );
}
