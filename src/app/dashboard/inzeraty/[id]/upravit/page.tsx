import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { assertOwnsListingForUser, AuthError, requirePageAgent } from "@/lib/auth/session";
import { getAgentListingForEdit } from "@/db/queries/dashboard";
import { ListingWizard } from "@/components/dashboard/ListingWizard";

export const metadata: Metadata = {
  title: "Upravit inzerát — Dashboard",
  robots: { index: false, follow: false },
};

const uuidSchema = z.string().uuid();

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ krok?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requirePageAgent(`/dashboard/inzeraty/${id}/upravit`);

  if (!uuidSchema.safeParse(id).success) {
    notFound();
  }

  try {
    await assertOwnsListingForUser(user, id);
  } catch (err) {
    if (err instanceof AuthError && err.status === 403) {
      redirect("/nemate-opravneni");
    }
    notFound();
  }

  const listing = await getAgentListingForEdit(id);
  if (!listing) {
    notFound();
  }

  const parsedStep = sp.krok ? Math.max(0, Number(sp.krok) - 1) : 0;
  return (
    <ListingWizard
      initialListing={listing}
      initialStep={Number.isFinite(parsedStep) ? parsedStep : 0}
    />
  );
}
