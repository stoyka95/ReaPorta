"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { Button, Dialog, DialogClose, DialogContent, useToast } from "@/components/ui";

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  favoriteIds: ReadonlySet<string>;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { push } = useToast();
  const pathname = usePathname();

  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(() => new Set());
  const [pendingFav, setPendingFav] = React.useState<{
    listingId: string;
    returnUrl: string;
  } | null>(null);

  const refreshSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        setFavoriteIds(new Set());
        return;
      }
      const data = (await res.json()) as {
        user: SessionUser | null;
        favoriteIds: string[];
      };
      setUser(data.user);
      setFavoriteIds(new Set(data.favoriteIds ?? []));
    } catch {
      // síťová chyba při načítání session — ponecháme výchozí nepřihlášený stav
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const isFavorite = React.useCallback(
    (listingId: string) => favoriteIds.has(listingId),
    [favoriteIds],
  );

  const toggleFavorite = React.useCallback(
    async (listingId: string) => {
      if (!user) {
        const returnUrl =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : pathname;
        setPendingFav({ listingId, returnUrl });
        return;
      }

      const wasFav = favoriteIds.has(listingId);
      // Optimistická aktualizace
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.delete(listingId);
        else next.add(listingId);
        return next;
      });

      try {
        const res = await fetch("/api/favorites/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        });
        if (!res.ok) {
          throw new Error("toggle_failed");
        }
        const data = (await res.json()) as { favorited: boolean };
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (data.favorited) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      } catch {
        // Vrácení zpět při chybě
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFav) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
        push({
          tone: "danger",
          title: "Oblíbenou nabídku se nepodařilo aktualizovat.",
        });
      }
    },
    [user, favoriteIds, push, pathname],
  );

  const signOut = React.useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    } finally {
      setUser(null);
      setFavoriteIds(new Set());
    }
  }, []);

  const loginWithFavoriteHref = pendingFav
    ? `/prihlaseni?next=${encodeURIComponent(pendingFav.returnUrl)}&favorite=${encodeURIComponent(pendingFav.listingId)}`
    : `/prihlaseni?next=${encodeURIComponent(pathname)}`;

  const value = React.useMemo<SessionContextValue>(
    () => ({
      user,
      loading,
      favoriteIds,
      isFavorite,
      toggleFavorite,
      refreshSession,
      signOut,
    }),
    [user, loading, favoriteIds, isFavorite, toggleFavorite, refreshSession, signOut],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
      <Dialog
        open={pendingFav !== null}
        onOpenChange={(open) => {
          if (!open) setPendingFav(null);
        }}
      >
        <DialogContent
          title="Uložit mezi oblíbené"
          description="Pro ukládání oblíbených nabídek se prosím přihlaste. Po přihlášení se tato nabídka automaticky přidá k vašim oblíbeným."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="ghost">Zavřít</Button>
            </DialogClose>
            <Button
              variant="primary"
              leftIcon={<Heart className="h-4 w-4" aria-hidden="true" />}
              asChild
              onClick={() => setPendingFav(null)}
            >
              <Link href={loginWithFavoriteHref}>Přihlásit se a uložit</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = React.useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession musí být použit uvnitř SessionProvider.");
  }
  return ctx;
}
