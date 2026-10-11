import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "./Logo";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="VotaYa, inicio">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
          <Link href="/buscar" className="rounded-full px-3 py-2 text-muted hover:bg-ink-3 hover:text-white" aria-label="Buscar encuestas">
            <span aria-hidden>🔍</span>
            <span className="ml-1 hidden sm:inline">Buscar</span>
          </Link>
          <Link href="/rankings" className="hidden rounded-full px-3 py-2 text-muted hover:bg-ink-3 hover:text-white sm:inline">
            Rankings
          </Link>
          <Link href="/crear" className="hidden rounded-full px-3 py-2 text-muted hover:bg-ink-3 hover:text-white sm:inline">
            Crear
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="rounded-full px-3 py-2 text-amber-300 hover:bg-ink-3">
              Admin
            </Link>
          )}
          {user ? (
            <Link href="/perfil" className="hidden rounded-full bg-ink-3 px-4 py-2 hover:bg-line sm:inline">
              Mi perfil
            </Link>
          ) : (
            <Link href="/entrar" className="bg-brand-gradient rounded-full px-4 py-2 text-white shadow-lg shadow-fuchsia-900/40">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
