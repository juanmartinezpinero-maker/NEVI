import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getBalance } from "@/lib/points";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";

export async function Header() {
  const user = await getCurrentUser();
  const points = user?.profileCompleted ? await getBalance(user.id) : null;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4" aria-label="Principal">
        <Link href="/" aria-label="VotaYa, inicio" className="shrink-0">
          <Logo />
        </Link>
        <NavLinks />
        <form action="/encuestas" role="search" className="ml-auto hidden max-w-xs flex-1 md:block">
          <label htmlFor="header-search" className="sr-only">
            Buscar encuestas
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted" aria-hidden>
              🔍
            </span>
            <input
              id="header-search"
              name="q"
              placeholder="Buscar encuestas…"
              className="w-full rounded-full border border-line bg-page py-2 pl-9 pr-4 text-sm outline-none focus:border-rose-300 focus:bg-white"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href="/encuestas" className="rounded-full p-2 text-lg md:hidden" aria-label="Buscar encuestas">
            🔍
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="hidden rounded-full px-3 py-2 text-sm font-bold text-violet sm:inline">
              Admin
            </Link>
          )}
          {user ? (
            <>
              {points !== null && (
                <Link href="/recompensas" className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700 ring-1 ring-amber-200" title="Tus puntos">
                  ⭐ {points.toLocaleString("es-ES")}
                </Link>
              )}
              <Link
                href="/perfil"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient font-bold text-white"
                aria-label="Mi perfil"
              >
                {user.email[0].toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link href="/entrar" className="hidden rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-slate-50 sm:inline">
                Iniciar sesión
              </Link>
              <Link href="/entrar" className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-dark">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
