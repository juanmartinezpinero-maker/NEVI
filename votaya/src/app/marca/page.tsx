import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getUserBrands } from "@/lib/brands";

export const metadata: Metadata = { title: "Panel de marca", robots: { index: false } };

export default async function BrandsHome() {
  const user = await requireUser("/marca");
  const brands = await getUserBrands(user);
  if (brands.length === 1) redirect(`/marca/${brands[0].id}`);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-[40px] font-black leading-none tracking-[-0.05em]">Panel de marca</h1>
      {brands.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {brands.map((b) => (
            <li key={b.id}>
              <Link href={`/marca/${b.id}`} className="flex items-center justify-between py-4 text-lg font-extrabold hover:underline">
                {b.name}
                <span className="text-sm font-semibold text-muted">{b.status === "active" ? "Activa" : b.status === "paused" ? "Pausada" : "En prueba"}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[22px] bg-lime p-6">
          <p className="text-lg font-bold">Tu cuenta todavía no está asociada a ninguna marca.</p>
          <p className="mt-1">Si tu empresa quiere lanzar encuestas en voppi!, escríbenos y te damos acceso.</p>
          <Link href="/empresas" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 font-extrabold text-lime">
            Solicitar acceso para mi marca
          </Link>
        </div>
      )}
    </div>
  );
}
