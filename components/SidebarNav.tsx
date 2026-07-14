"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CameraIcon, HomeIcon, ListIcon, PlateIcon, TrendIcon, UserIcon } from "@/components/icons";

const navItems = [
  { href: "/", label: "Inicio", Icon: HomeIcon },
  { href: "/lista", label: "Lista inteligente", Icon: ListIcon },
  { href: "/ahorro", label: "Ahorro y desperdicio", Icon: TrendIcon },
  { href: "/recetas", label: "Ideas de recetas", Icon: PlateIcon },
  { href: "/perfil", label: "Perfil", Icon: UserIcon },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden shrink-0 flex-col border-r border-black/5 bg-white px-4 py-6 md:flex md:w-64">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <Image src="/logo.png" alt="" width={36} height={36} className="rounded-xl" />
        <span className="font-heading text-2xl font-semibold text-ink">nevi</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-sage/10 text-sage" : "text-ink/60 hover:bg-black/5"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/escanear"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sage/30 hover:bg-sage-dark"
      >
        <CameraIcon className="h-4 w-4" />
        Escanear ticket
      </Link>
    </aside>
  );
}
