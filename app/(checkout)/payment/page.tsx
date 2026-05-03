import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pago | BiasPass Ticketing",
  description: "Finaliza la compra de tus boletos",
};

export default function PaymentPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">Pago</h1>
    </main>
  );
}
