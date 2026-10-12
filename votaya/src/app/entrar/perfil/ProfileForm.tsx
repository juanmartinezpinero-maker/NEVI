"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveProfileAction, type ProfileState } from "@/app/actions/auth";
import { AGE_RANGES, COUNTRIES_SORTED, GENDERS } from "@/lib/demographics";

export function ProfileForm({ next, defaults }: { next: string; defaults: { ageRange?: string | null; gender?: string | null; country?: string | null } }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfileAction, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Edad</legend>
        <div className="grid grid-cols-4 gap-2">
          {AGE_RANGES.map((a) => (
            <label key={a} className="cursor-pointer">
              <input type="radio" name="ageRange" value={a} defaultChecked={defaults.ageRange === a} className="peer sr-only" required />
              <span className="block rounded-[16px] border-2 border-line bg-white py-2.5 text-center text-sm font-bold peer-checked:border-ink peer-checked:bg-lime peer-focus-visible:ring-2 peer-focus-visible:ring-rose-300">
                {a}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Género</legend>
        <div className="grid grid-cols-2 gap-2">
          {GENDERS.map((g) => (
            <label key={g.value} className="cursor-pointer">
              <input type="radio" name="gender" value={g.value} defaultChecked={defaults.gender === g.value} className="peer sr-only" required />
              <span className="block rounded-[16px] border-2 border-line bg-white py-2.5 text-center text-sm font-bold peer-checked:border-ink peer-checked:bg-lime peer-focus-visible:ring-2 peer-focus-visible:ring-rose-300">
                {g.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-2 block text-sm font-bold">País de residencia</span>
        <select
          name="country"
          required
          defaultValue={defaults.country ?? ""}
          className="w-full rounded-[16px] border-2 border-line bg-white px-4 py-3 text-base outline-none focus:border-ink"
        >
          <option value="" disabled>
            Elige tu país
          </option>
          {COUNTRIES_SORTED.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="space-y-2 text-sm">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 accent-[#eb5f7d]" />
          <span>
            Tengo 16 años o más y acepto las{" "}
            <Link href="/terminos" target="_blank" className="underline">
              condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" target="_blank" className="underline">
              política de privacidad
            </Link>
            . Mis respuestas se muestran solo de forma agregada y anónima.
          </span>
        </label>
        <label className="flex items-start gap-2 text-muted">
          <input type="checkbox" name="marketing" className="mt-1 h-4 w-4 accent-[#eb5f7d]" />
          <span>Quiero recibir por email las preguntas más virales (opcional).</span>
        </label>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-pink">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="w-full rounded-full bg-ink py-3.5 font-extrabold text-lime disabled:opacity-60">
        {pending ? "Guardando…" : "¡Listo, a votar!"}
      </button>
    </form>
  );
}
