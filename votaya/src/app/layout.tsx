import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { CookieNotice } from "@/components/CookieNotice";
import { Header } from "@/components/Header";
import { rewardsEnabled } from "@/lib/site";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700", "800", "900"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "voppi! — El mundo opina. ¿Y tú?", template: "%s · voppi!" },
  description: "Vota preguntas divertidas, curiosas y polémicas, descubre qué opina el mundo y comparte los resultados.",
  applicationName: "voppi!",
  openGraph: { type: "website", siteName: "voppi!", locale: "es_ES" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#e6ff7f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={body.variable}>
      <body className="font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
          Saltar al contenido
        </a>
        <Header />
        <main id="main" className="mx-auto max-w-7xl px-4 pb-24 pt-6 lg:pb-14">
          {children}
        </main>
        <footer className="bg-ink pb-20 text-white/70 lg:pb-0">
          <div className="mx-auto flex max-w-7xl flex-wrap items-baseline gap-x-6 gap-y-3 px-4 py-6 text-xs">
            <span className="text-2xl font-black tracking-[-0.06em] text-lime">
              voppi<span className="tracking-normal text-pink">!</span>
            </span>
            <span>El mundo opina. ¿Y tú?</span>
            <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Pie de página">
              <Link href="/empresas">Empresas y marcas</Link>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos</Link>
              <Link href="/aviso-legal">Aviso legal</Link>
            </nav>
            <span className="lg:ml-auto">Las votaciones populares no son estudios representativos.</span>
          </div>
        </footer>
        <BottomNav rewards={rewardsEnabled()} />
        <CookieNotice />
      </body>
    </html>
  );
}
