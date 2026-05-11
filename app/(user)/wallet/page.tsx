import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getUserTickets } from "@/lib/actions/orders";
import WalletClient from "./WalletClient";

export const metadata = {
  title: "Billetera Digital — StageFront Tickets",
  description:
    "Tu billetera digital segura con boletos protegidos por firma criptográfica TOTP.",
};

export default async function WalletPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const rawTickets = await getUserTickets();

  return <WalletClient session={session} rawTickets={rawTickets} />;
}
