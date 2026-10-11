import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar o registrarse", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/entrar">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  const user = await getCurrentUser();
  if (user) redirect(user.profileCompleted ? next : `/entrar/perfil?next=${encodeURIComponent(next)}`);
  return (
    <div className="card mx-auto mt-4 max-w-md space-y-6 p-6 sm:mt-12 sm:p-8">
      <div className="text-center">
        <div className="mx-auto w-fit">
          <LogoMark size={56} />
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold">Entra en VotaYa</h1>
        <p className="mt-1 text-muted">Guarda tus votos y mira qué opina tu país. Menos de 30 segundos.</p>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
