"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestCodeAction, verifyCodeAction, type AuthState } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [reqState, requestCode, requesting] = useActionState<AuthState, FormData>(requestCodeAction, { step: "email", next });
  const [verState, verify, verifying] = useActionState<AuthState, FormData>(verifyCodeAction, { step: "code" });
  const onCodeStep = reqState.step === "code";
  const email = reqState.email ?? "";

  if (!onCodeStep) {
    return (
      <form action={requestCode} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="hidden" aria-hidden>
          <label>
            No rellenar <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Tu email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            inputMode="email"
            defaultValue={email}
            placeholder="tu@email.com"
            className="w-full rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-base outline-none focus:border-fuchsia-400"
          />
        </label>
        {reqState.error && (
          <p role="alert" className="text-sm text-rose-300">
            {reqState.error}
          </p>
        )}
        <button disabled={requesting} className="bg-brand-gradient w-full rounded-2xl py-3.5 font-extrabold text-white disabled:opacity-60">
          {requesting ? "Enviando…" : "Recibir código"}
        </button>
        <p className="text-center text-xs text-muted">
          Sin contraseñas: te enviamos un código de 6 cifras. Al continuar aceptas las{" "}
          <Link href="/terminos" className="underline">
            condiciones
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="underline">
            política de privacidad
          </Link>
          .
        </p>
      </form>
    );
  }

  return (
    <form action={verify} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="email" value={email} />
      <p className="text-sm text-muted">
        Hemos enviado un código a <strong className="text-white">{email}</strong>.
      </p>
      {reqState.devCode && (
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm" data-testid="dev-code">
          Modo desarrollo (sin email configurado). Tu código: <strong className="tracking-widest">{reqState.devCode}</strong>
        </p>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Código de 6 cifras</span>
        <input
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          autoFocus
          placeholder="••••••"
          className="w-full rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-center font-display text-3xl tracking-[0.5em] outline-none focus:border-fuchsia-400"
        />
      </label>
      {verState.error && (
        <p role="alert" className="text-sm text-rose-300">
          {verState.error}
        </p>
      )}
      <button disabled={verifying} className="bg-brand-gradient w-full rounded-2xl py-3.5 font-extrabold text-white disabled:opacity-60">
        {verifying ? "Comprobando…" : "Entrar"}
      </button>
      <button type="button" onClick={() => window.location.reload()} className="w-full text-sm text-muted underline">
        Usar otro email
      </button>
    </form>
  );
}
