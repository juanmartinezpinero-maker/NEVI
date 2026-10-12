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
            className="w-full rounded-[16px] border-2 border-line bg-white px-4 py-3.5 text-base outline-none focus:border-ink"
          />
        </label>
        {reqState.error && (
          <p role="alert" className="text-sm text-pink">
            {reqState.error}
          </p>
        )}
        <button disabled={requesting} className="w-full rounded-full bg-ink py-3.5 font-extrabold text-lime disabled:opacity-60">
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
        Hemos enviado un código a <strong className="text-ink">{email}</strong>.
      </p>
      {reqState.devCode && (
        <p className="rounded-[16px] bg-lime p-3 text-sm" data-testid="dev-code">
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
          className="w-full rounded-[16px] border-2 border-line bg-white px-4 py-3.5 text-center font-display text-3xl tracking-[0.5em] outline-none focus:border-ink"
        />
      </label>
      {verState.error && (
        <p role="alert" className="text-sm text-pink">
          {verState.error}
        </p>
      )}
      <button disabled={verifying} className="w-full rounded-full bg-ink py-3.5 font-extrabold text-lime disabled:opacity-60">
        {verifying ? "Comprobando…" : "Entrar"}
      </button>
      <button type="button" onClick={() => window.location.reload()} className="w-full text-sm text-muted underline">
        Usar otro email
      </button>
    </form>
  );
}
