"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CameraIcon, HomeIcon, ListIcon, TrendIcon, UserIcon } from "@/components/icons";

const navItems = [
  { href: "/", label: "Inicio", Icon: HomeIcon },
  { href: "/lista", label: "Lista", Icon: ListIcon },
] as const;

const navItemsRight = [
  { href: "/ahorro", label: "Ahorro", Icon: TrendIcon },
  { href: "/perfil", label: "Perfil", Icon: UserIcon },
] as const;

function NavLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof HomeIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-1 px-3 py-1 ${
        active ? "text-sage" : "text-ink/50"
      }`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-center md:hidden">
      <div className="relative mx-auto w-full max-w-[400px] border-t border-black/5 bg-white/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="flex items-center justify-between">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} active={pathname === item.href} />
          ))}

          <div className="w-16 shrink-0" aria-hidden="true" />

          {navItemsRight.map((item) => (
            <NavLink key={item.href} {...item} active={pathname === item.href} />
          ))}
        </div>

        <Link
          href="/escanear"
          aria-label="Escanear ticket"
          className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-sage text-white shadow-lg shadow-sage/40 ring-4 ring-warm-bg"
        >
          <CameraIcon className="h-7 w-7" />
        </Link>
      </div>
    </nav>
  );
}
