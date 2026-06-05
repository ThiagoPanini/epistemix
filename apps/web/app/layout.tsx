import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "epistemix",
  description: "Hub pessoal de aprendizado.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
