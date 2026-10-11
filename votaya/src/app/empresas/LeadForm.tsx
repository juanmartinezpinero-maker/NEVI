"use client";

import { useActionState } from "react";
import { businessLeadAction, type LeadState } from "@/app/actions/polls";

export function LeadForm() {
  const [state, action, pending] = useActionState<LeadState, FormData>(businessLeadAction, {});
  if (state.ok) return <p className="rounded-2xl bg-emerald-500/15 p-4 font-bold">¡Gracias! Te escribiremos pronto.</p>;
  const input = "w-full rounded-xl border border-line bg-ink-2 px-4 py-3 outline-none focus:border-fuchsia-400";
  return (
    <form action={action} className="space-y-3">
      <input name="company" required placeholder="Empresa o marca" aria-label="Empresa o marca" className={input} />
      <input name="email" type="email" required placeholder="Email de contacto" aria-label="Email de contacto" className={input} />
      <textarea name="message" rows={3} placeholder="¿Qué te gustaría preguntar al mundo?" aria-label="Mensaje" className={input} />
      {state.error && <p className="text-sm text-rose-300">{state.error}</p>}
      <button disabled={pending} className="bg-brand-gradient w-full rounded-2xl py-3 font-extrabold text-white">
        {pending ? "Enviando…" : "Unirme a la lista de espera"}
      </button>
    </form>
  );
}
