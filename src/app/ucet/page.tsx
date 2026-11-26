import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { getUserInquiries } from "@/db/queries/account";
import { ProfileClient } from "@/components/account/ProfileClient";

export const metadata: Metadata = {
  title: "Můj účet",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requirePageUser("/ucet");
  const inquiries = await getUserInquiries(user.id);

  return <ProfileClient user={user} inquiries={inquiries} />;
}
