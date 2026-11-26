"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { LogIn } from "lucide-react";
import { Button, GlassPanel, Input, useToast } from "@/components/ui";
import { useSession } from "@/components/auth/SessionProvider";

const loginSchema = z.object({
  email: z.string().trim().email("Zadejte prosím platný e-mail."),
  password: z.string().min(1, "Zadejte prosím heslo."),
});

interface LoginFormProps {
  nextPath: string;
  favoriteListingId?: string | null;
}

export function LoginForm({ nextPath, favoriteListingId }: LoginFormProps) {
  const router = useRouter();
  const { refreshSession } = useSession();
  const { push } = useToast();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
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
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
      };

      if (res.status === 429) {
        setFormError(
          data.message ??
            "Příliš mnoho chybných pokusů o přihlášení. Zkuste to prosím za několik minut.",
        );
        return;
      }

      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setFormError(
            "Váš e-mail ještě není ověřen. Otevřete prosím ověřovací odkaz, který jsme vám poslali.",
          );
          return;
        }
        setFormError("Neplatný e-mail nebo heslo, případně je účet zablokován.");
        return;
      }

      // Pokud se nepřihlášený uživatel přihlašoval kvůli kliku na srdce (QA B5)
      if (favoriteListingId) {
        await fetch("/api/favorites/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: favoriteListingId, mode: "add" }),
        }).catch(() => {});
      }

      await refreshSession();
      push({
        tone: "success",
        title: "Přihlášení proběhlo úspěšně",
        description: favoriteListingId
          ? "Vybraná nabídka byla přidána mezi vaše oblíbené."
          : undefined,
      });

      // Bezpečný lokální redirect
      const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/ucet";
      router.push(safeNext);
      router.refresh();
    } catch {
      setFormError("Přihlášení se nezdařilo. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassPanel level={2} padding="lg" radius="2xl" className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="type-h2 text-strong">Přihlášení</h1>
        <p className="type-small text-muted">
          Přihlaste se ke svému účtu pro správu oblíbených nabídek, uložených hledání nebo inzerátů.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          placeholder="vas@email.cz"
          required
        />
        <Input
          label="Heslo"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <div className="flex justify-end">
          <Link
            href="/zapomenute-heslo"
            className="type-small font-medium text-accent-text hover:underline"
          >
            Zapomenuté heslo?
          </Link>
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
          leftIcon={<LogIn className="h-4 w-4" aria-hidden="true" />}
          className="w-full"
        >
          Přihlásit se
        </Button>
      </form>

      <p className="border-t border-line-subtle pt-4 text-center type-small text-muted">
        Ještě nemáte účet?{" "}
        <Link href="/registrace" className="font-medium text-accent-text hover:underline">
          Zaregistrovat se
        </Link>
      </p>
    </GlassPanel>
  );
}
