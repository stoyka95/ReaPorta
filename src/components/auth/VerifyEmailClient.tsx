"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button, GlassPanel, Spinner } from "@/components/ui";

export function VerifyEmailClient({ token }: { token: string | null }) {
  const [status, setStatus] = React.useState<"loading" | "ok" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = React.useState<string>(
    token ? "Ověřujeme váš e-mail…" : "Chybí ověřovací token.",
  );

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
        });
        if (cancelled) return;
        if (res.ok) {
          setStatus("ok");
          setMessage("Váš e-mail je ověřen. Nyní se můžete přihlásit ke svému účtu.");
        } else {
          setStatus("error");
          setMessage("Ověřovací odkaz je neplatný nebo již vypršel.");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Ověření se nezdařilo. Zkuste to prosím znovu.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <GlassPanel
      level={2}
      padding="lg"
      radius="2xl"
      className="space-y-5 text-center"
      data-verify-status={status}
    >
      {status === "loading" ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <Spinner size="lg" />
          <p className="type-body text-muted">{message}</p>
        </div>
      ) : status === "ok" ? (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-success-bg text-success">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="type-h2 text-strong">E-mail ověřen</h1>
          <p className="type-body text-muted">{message}</p>
          <Button variant="primary" size="lg" className="w-full" asChild>
            <Link href="/prihlaseni">Přihlásit se</Link>
          </Button>
        </>
      ) : (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-danger-bg text-danger">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="type-h2 text-strong">Ověření se nezdařilo</h1>
          <p className="type-body text-muted">{message}</p>
          <Button variant="secondary" asChild>
            <Link href="/prihlaseni">Zpět na přihlášení</Link>
          </Button>
        </>
      )}
    </GlassPanel>
  );
}
