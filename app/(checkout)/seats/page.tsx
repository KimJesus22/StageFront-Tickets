import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Selección de asientos | BiasPass Ticketing",
  description: "Elige tus asientos para el concierto",
};

export default function SeatsPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">Selección de Asientos</h1>
    </main>
  );
}
