import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Completa tu perfil", robots: { index: false } };

export default async function ProfilePage(props: PageProps<"/entrar/perfil">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return (
    <div className="card mx-auto mt-4 max-w-md space-y-5 p-6 sm:mt-10 sm:p-8">
      <div>
        <p className="text-sm font-bold text-fuchsia-300">Último paso</p>
        <h1 className="font-display text-3xl font-extrabold">Cuéntanos un poco de ti</h1>
        <p className="mt-1 text-sm text-muted">Sirve para mostrar qué opina cada país, edad y género. Nunca mostramos datos individuales.</p>
      </div>
      <ProfileForm next={next} defaults={{ ageRange: user.ageRange, gender: user.gender, country: user.country }} />
    </div>
  );
}
