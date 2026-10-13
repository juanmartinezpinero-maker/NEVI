"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChart, IconHome, IconPlus, IconStories, IconUser } from "./Icons";

const ITEMS = [
  { href: "/", label: "Inicio", Icon: IconHome },
  { href: "/descubrir", label: "Encuestas", Icon: IconStories },
  { href: "/crear", label: "Crear", Icon: IconPlus, primary: true },
  { href: "/rankings", label: "Rankings", Icon: IconChart },
  { href: "/perfil", label: "Perfil", Icon: IconUser },
];

export function BottomNav({ rewards = false }: { rewards?: boolean }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  // En el feed de historias la barra se vuelve oscura.
  const dark = path.startsWith("/descubrir");
  const items = rewards ? ITEMS.map((it) => (it.href === "/rankings" ? { ...it, href: "/recompensas", label: "Premios" } : it)) : ITEMS;
  return (
    <nav
      aria-label="Navegación inferior"
      className={`fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden ${dark ? "border-white/10 bg-ink text-white" : "border-line bg-white"}`}
    >
      <ul className="grid h-14 grid-cols-5">
        {items.map(({ href, label, Icon, primary }) => {
          const active = href === "/" ? path === "/" : href === "/descubrir" ? ["/descubrir", "/encuestas", "/p/"].some((x) => path.startsWith(x)) : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={primary ? "Crear encuesta" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold ${
                  active ? (dark ? "text-lime" : "text-ink") : dark ? "text-white/55" : "text-muted"
                }`}
              >
                {primary ? (
                  <span className="grid h-8 w-12 place-items-center rounded-full bg-lime text-ink">
                    <Icon />
                  </span>
                ) : (
                  <>
                    <Icon />
                    {label}
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
