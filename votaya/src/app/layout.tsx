import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { CookieNotice } from "@/components/CookieNotice";
import { Header } from "@/components/Header";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display-face", weight: ["600", "700", "800"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "VotaYa — El mundo opina. ¿Y tú?", template: "%s · VotaYa" },
  description: "Vota preguntas divertidas, curiosas y polémicas, descubre qué opina el mundo y comparte los resultados.",
  applicationName: "VotaYa",
  openGraph: { type: "website", siteName: "VotaYa", locale: "es_ES" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0c0a1d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-ink">
          Saltar al contenido
        </a>
        <Header />
        <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:pb-12">
          {children}
        </main>
        <footer className="mx-auto max-w-6xl px-4 pb-28 text-xs text-muted sm:pb-8">
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line/60 pt-6">
            <span>© {new Date().getFullYear()} VotaYa</span>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/terminos">Condiciones</Link>
            <Link href="/empresas">Empresas y marcas</Link>
            <span>Las votaciones populares no son estudios representativos.</span>
          </div>
        </footer>
        <BottomNav />
        <CookieNotice />
      </body>
    </html>
  );
}
