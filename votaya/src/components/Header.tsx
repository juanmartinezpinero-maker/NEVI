import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUserBrands } from "@/lib/brands";
import { getBalance, getStreak } from "@/lib/points";
import { rewardsEnabled } from "@/lib/site";
import { IconSearch } from "./Icons";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";

export async function Header() {
  const user = await getCurrentUser();
  const [points, streak] = user?.profileCompleted ? await Promise.all([getBalance(user.id), getStreak(user.id)]) : [null, 0];
  const hasBrand = user && user.role !== "admin" ? (await getUserBrands(user)).length > 0 : false;
  return (
    <header id="site-header" className="sticky top-0 z-30 bg-lime">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4" aria-label="Principal">
        <Link href="/" aria-label="voppi!, inicio" className="shrink-0">
          <Logo />
        </Link>
        <NavLinks rewards={rewardsEnabled()} />
        <form action="/encuestas" role="search" className="ml-auto hidden max-w-xs flex-1 md:block">
          <label htmlFor="header-search" className="sr-only">
            Buscar encuestas
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <IconSearch />
            </span>
            <input
              id="header-search"
              name="q"
              placeholder="Buscar encuestas"
              className="w-full rounded-full bg-white/75 py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-ink"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href="/encuestas" className="grid h-10 w-10 place-items-center rounded-full md:hidden" aria-label="Buscar encuestas">
            <IconSearch />
          </Link>
          {hasBrand && (
            <Link href="/marca" className="hidden rounded-full px-3 py-2 text-sm font-bold sm:inline">
              Panel de marca
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className="hidden rounded-full px-3 py-2 text-sm font-bold sm:inline">
              Admin
            </Link>
          )}
          {user ? (
            <>
              {points !== null && (
                <Link
                  href={rewardsEnabled() ? "/recompensas" : "/perfil"}
                  className="rounded-full bg-ink px-3 py-1.5 text-sm font-extrabold tabular-nums text-lime"
                  title={streak ? `${streak} días seguidos votando` : "Tus puntos"}
                >
                  {streak > 0 ? `${streak}d · ` : ""}
                  {points.toLocaleString("es-ES")} pts
                </Link>
              )}
              <Link href="/crear" className="hidden rounded-full bg-pink px-4 py-2 text-sm font-extrabold text-white lg:inline">
                Crear encuesta
              </Link>
              <Link href="/perfil" className="grid h-9 w-9 place-items-center rounded-full bg-ink font-bold text-lime" aria-label="Mi perfil">
                {user.email[0].toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link href="/entrar" className="hidden rounded-full px-4 py-2 text-sm font-bold sm:inline">
                Entrar
              </Link>
              <Link href="/entrar" className="rounded-full bg-ink px-4 py-2.5 text-sm font-extrabold text-lime">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
