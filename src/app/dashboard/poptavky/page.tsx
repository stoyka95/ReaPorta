import type { Metadata } from "next";
import { requirePageAgent } from "@/lib/auth/session";
import { getAgentInquiries } from "@/db/queries/profiles";
import { InquiriesInboxClient } from "@/components/dashboard/InquiriesInboxClient";

export const metadata: Metadata = {
  title: "Poptávky — Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardInquiriesPage() {
  const user = await requirePageAgent("/dashboard/poptavky");
  const items = await getAgentInquiries(user.id);
  return <InquiriesInboxClient initialItems={items} />;
}
