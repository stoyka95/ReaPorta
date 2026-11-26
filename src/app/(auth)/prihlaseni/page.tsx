import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Přihlášení",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; favorite?: string }>;
}) {
  const sp = await searchParams;
  const nextPath = sp.next ?? "/ucet";
  const favoriteListingId = sp.favorite ?? null;

  return <LoginForm nextPath={nextPath} favoriteListingId={favoriteListingId} />;
}
