"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const MAIN_NAV = [
  { href: "/", label: "Inicio" },
  { href: "/encuestas", label: "Explorar" },
  { href: "/rankings", label: "Rankings" },
  { href: "/descubrir", label: "Modo historias" },
  { href: "/recompensas", label: "Premios" },
];

export function NavLinks({ rewards = false }: { rewards?: boolean }) {
  const path = usePathname();
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {MAIN_NAV.filter((it) => rewards || it.href !== "/recompensas").map((it) => {
        const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-bold ${active ? "bg-ink text-lime" : "text-ink-2 hover:bg-white/60"}`}
            >
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
