import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageAgent } from "@/lib/auth/session";
import { getAgentProfileForEdit } from "@/db/queries/profiles";
import { AgentProfileForm } from "@/components/dashboard/AgentProfileForm";

export const metadata: Metadata = {
  title: "Profil makléře — Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardProfilePage() {
  const user = await requirePageAgent("/dashboard/profil");
  const profile = await getAgentProfileForEdit(user.id);
  if (!profile) {
    notFound();
  }
  return <AgentProfileForm initialProfile={profile} />;
}
