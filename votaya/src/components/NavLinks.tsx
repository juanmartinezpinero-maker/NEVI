"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const MAIN_NAV = [
  { href: "/", label: "Inicio" },
  { href: "/encuestas", label: "Encuestas" },
  { href: "/rankings", label: "Rankings" },
  { href: "/tendencias", label: "Tendencias" },
  { href: "/descubrir", label: "⚡ Modo rápido" },
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
              className={`relative px-3 py-5 text-sm font-semibold ${active ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              {it.label}
              {active && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-brand" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
