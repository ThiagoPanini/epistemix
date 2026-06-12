import type { Metadata } from "next";
import { Archivo, Source_Serif_4, Spline_Sans_Mono } from "next/font/google";
import { SITE_NAME, SITE_TWITTER, SITE_URL } from "@/lib/site/meta";
import "./globals.css";

const DESCRIPTION =
  "Hub pessoal de aprendizado — posts, cursos, livros, certificações e palestras.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    locale: "pt_BR",
    type: "website",
    title: SITE_NAME,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    creator: SITE_TWITTER,
    title: SITE_NAME,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const archivo = Archivo({
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const sourceSerif4 = Source_Serif_4({
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const splineSansMono = Spline_Sans_Mono({
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${sourceSerif4.variable} ${splineSansMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
