import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button, GlassPanel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Nemáte oprávnění",
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <GlassPanel level={2} padding="lg" radius="2xl" className="w-full space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-danger-bg text-danger">
          <ShieldAlert className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <p className="type-eyebrow text-danger">403 · Přístup odepřen</p>
        <h1 className="type-h1 text-strong">Nemáte oprávnění</h1>
        <p className="mx-auto max-w-md type-body text-muted">
          Pro zobrazení této stránky nemáte potřebnou roli nebo přístupová práva. Pokud se
          domníváte, že jde o chybu, přihlaste se prosím pod jiným účtem.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button variant="primary" asChild>
            <Link href="/">Zpět na úvod</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/prihlaseni">Přihlásit se jinak</Link>
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}
