import type { Metadata } from "next";
import { requirePageAgent } from "@/lib/auth/session";
import { ListingWizard } from "@/components/dashboard/ListingWizard";

export const metadata: Metadata = {
  title: "Nový inzerát — Dashboard",
  robots: { index: false, follow: false },
};

export default async function NewListingPage() {
  await requirePageAgent("/dashboard/inzeraty/novy");
  return <ListingWizard />;
}
