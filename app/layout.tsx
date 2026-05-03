import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiasPass Ticketing",
  description: "Compra tus boletos para los mejores conciertos de K-Pop y más",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
