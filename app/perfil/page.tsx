import { PageHeader } from "@/components/PageHeader";
import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { CopyInviteCodeButton } from "@/components/CopyInviteCodeButton";
import { createClient } from "@/lib/supabase/server";
import { getHousehold } from "@/lib/household";
import {
  renameHouseholdAction,
  joinHouseholdAction,
  updateHouseholdPreferencesAction,
} from "./actions";

export default async function PerfilPage() {
  const supabase = await createClient();
  const [
    {
      data: { session },
    },
    household,
  ] = await Promise.all([supabase.auth.getSession(), getHousehold()]);

  return (
    <AppShell>
      <PageHeader title="Perfil" subtitle={session?.user.email} />
      <main className="flex flex-1 flex-col gap-5 pb-28 md:pb-8">
        {household && (
          <section className="rounded-2xl bg-white p-4 shadow-sm shadow-black/5">
            <p className="mb-3 text-sm font-semibold text-ink">Tu familia</p>

            <form action={renameHouseholdAction} className="flex gap-2">
              <input
                name="name"
                defaultValue={household.name}
                aria-label="Nombre de la familia"
                className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-sage"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-sage px-3 py-2 text-sm font-semibold text-white"
              >
                Guardar
              </button>
            </form>

            <div className="mt-4">
              <p className="text-xs text-ink/60">
                Comparte este código para que alguien se una a vuestra despensa:
              </p>
              <CopyInviteCodeButton code={household.inviteCode} />
            </div>

            <form
              action={joinHouseholdAction}
              className="mt-4 flex flex-col gap-2 border-t border-black/5 pt-4"
            >
              <label htmlFor="inviteCode" className="text-xs text-ink/60">
                ¿Te han invitado a otra familia? Introduce su código:
              </label>
              <div className="flex gap-2">
                <input
                  id="inviteCode"
                  name="inviteCode"
                  placeholder="CÓDIGO"
                  className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm uppercase text-ink outline-none focus:border-sage"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-ink"
                >
                  Unirse
                </button>
              </div>
              <p className="text-xs text-ink/50">
                Al unirte dejarás de ver la despensa que tenías antes.
              </p>
            </form>
          </section>
        )}

        {household && (
          <section className="rounded-2xl bg-white p-4 shadow-sm shadow-black/5">
            <p className="mb-1 text-sm font-semibold text-ink">Preferencias para recetas</p>
            <p className="mb-3 text-xs text-ink/60">
              Se usan para ajustar el plan semanal y las ideas de recetas.
            </p>

            <form action={updateHouseholdPreferencesAction} className="flex flex-col gap-3">
              <div>
                <label htmlFor="memberCount" className="mb-1 block text-xs font-medium text-ink">
                  ¿Cuántos comensales sois habitualmente?
                </label>
                <input
                  id="memberCount"
                  name="memberCount"
                  type="number"
                  min={1}
                  defaultValue={household.memberCount ?? ""}
                  placeholder="4"
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-sage"
                />
              </div>

              <div>
                <label htmlFor="dietaryNotes" className="mb-1 block text-xs font-medium text-ink">
                  Restricciones o preferencias alimentarias
                </label>
                <textarea
                  id="dietaryNotes"
                  name="dietaryNotes"
                  rows={2}
                  defaultValue={household.dietaryNotes ?? ""}
                  placeholder="Ej: vegetariano, sin gluten, alergia a los frutos secos..."
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-sage"
                />
              </div>

              <button
                type="submit"
                className="self-start rounded-lg bg-sage px-3 py-2 text-sm font-semibold text-white"
              >
                Guardar preferencias
              </button>
            </form>
          </section>
        )}

        <LogoutButton />
      </main>
    </AppShell>
  );
}
