"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError("Email o contraseña incorrectos.");
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setSignupDone(true);
    }
  }

  if (signupDone) {
    return (
      <div className="rounded-2xl bg-white p-5 text-center shadow-sm shadow-black/5">
        <p className="font-heading text-lg font-semibold text-ink">Revisa tu email</p>
        <p className="mt-2 text-sm text-ink/60">
          Te hemos enviado un enlace de confirmación a <strong>{email}</strong>. Ábrelo para
          activar tu cuenta y luego inicia sesión.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-sage underline"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-sage"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-sage"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-sm text-coral-red">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Un momento..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </button>

      {mode === "login" ? (
        <p className="text-center text-sm text-ink/60">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-sage underline">
            Regístrate
          </Link>
        </p>
      ) : (
        <p className="text-center text-sm text-ink/60">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-sage underline">
            Inicia sesión
          </Link>
        </p>
      )}
    </form>
  );
}
