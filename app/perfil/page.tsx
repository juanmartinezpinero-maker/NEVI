import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";
import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { CopyInviteCodeButton } from "@/components/CopyInviteCodeButton";
import { createClient } from "@/lib/supabase/server";
import { getHousehold } from "@/lib/household";
import { renameHouseholdAction, joinHouseholdAction } from "./actions";

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

        <ComingSoon message="Aquí podrás gestionar tus preferencias muy pronto." />
        <LogoutButton />
      </main>
    </AppShell>
  );
}
