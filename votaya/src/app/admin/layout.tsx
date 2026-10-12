import type { Metadata } from "next";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Administración", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const db = await getDb();
  const [{ pending }] = await db
    .select({ pending: sql<number>`count(*)::int` })
    .from(schema.polls)
    .where(eq(schema.polls.status, "pending"));
  const tabs = [
    { href: "/admin", label: "Resumen" },
    { href: "/admin/moderacion", label: `Moderación${pending ? ` (${pending})` : ""}` },
    { href: "/admin/encuestas", label: "Encuestas" },
    { href: "/admin/enlaces", label: "Creadores" },
    { href: "/admin/marcas", label: "Marcas" },
    { href: "/admin/premios", label: "Premios" },
    { href: "/admin/usuarios", label: "Usuarios" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[36px] font-black tracking-[-0.05em]">Panel de administración</h1>
      </div>
      <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Secciones de administración">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="shrink-0 rounded-full bg-wash px-4 py-2 text-sm font-bold hover:bg-lime">
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
