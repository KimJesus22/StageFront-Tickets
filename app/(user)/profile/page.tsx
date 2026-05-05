import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getUserTickets } from "@/lib/actions/orders";
import ProfileTabs from "@/components/ProfileTabs";

export const metadata = {
  title: "Perfil - StageFront",
};

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const rawTickets = await getUserTickets();

  return <ProfileTabs session={session} rawTickets={rawTickets} />;
}
