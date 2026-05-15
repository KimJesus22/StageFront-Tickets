import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getUserTickets } from "@/lib/actions/orders";
import WalletClient from "@/app/(user)/wallet/WalletClient";

export const metadata = {
  title: "Mis Boletos — StageFront Tickets",
  description: "Tu billetera digital segura con boletos protegidos.",
};

export default async function ProfileTicketsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const rawTickets = await getUserTickets();

  return (
    <>
      <header className="mb-8 flex flex-col gap-1">
        <h2 className="font-headline-lg text-3xl font-bold text-white">Mis Boletos</h2>
        <p className="text-zinc-400">Accede a tus pases digitales y códigos QR.</p>
      </header>
      <WalletClient session={session} rawTickets={rawTickets} />
    </>
  );
}
