"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/encuestas", label: "Encuestas", icon: "🗳️" },
  { href: "/crear", label: "Crear", icon: "＋", primary: true },
  { href: "/descubrir", label: "Rápido", icon: "⚡" },
  { href: "/perfil", label: "Perfil", icon: "👤" },
];

export function BottomNav({ rewards = false }: { rewards?: boolean }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  const items = rewards ? ITEMS.map((it) => (it.href === "/descubrir" ? { href: "/recompensas", label: "Premios", icon: "🎁" } : it)) : ITEMS;
  return (
    <nav aria-label="Navegación inferior" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? "text-brand" : "text-muted"}`}
              >
                {it.primary ? (
                  <span className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-2xl font-bold text-white shadow-lg shadow-rose-200" aria-hidden>
                    {it.icon}
                  </span>
                ) : (
                  <span aria-hidden className={`text-xl ${active ? "" : "opacity-60 grayscale"}`}>
                    {it.icon}
                  </span>
                )}
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
