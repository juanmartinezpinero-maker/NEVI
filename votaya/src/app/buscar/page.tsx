import type { Metadata } from "next";
import Link from "next/link";
import { PollGrid } from "@/components/PollCard";
import { CATEGORIES } from "@/lib/categories";
import { listPolls } from "@/lib/polls";

export const metadata: Metadata = { title: "Buscar encuestas" };

export default async function SearchPage(props: PageProps<"/buscar">) {
  const sp = await props.searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const results = q ? await listPolls({ q, order: "top", limit: 30 }) : [];
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Buscar</h1>
      <form role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Buscar encuestas
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Messi, pizza, Netflix, Japón…"
          className="min-w-0 flex-1 rounded-2xl border border-line bg-ink-2 px-4 py-3 text-base outline-none focus:border-fuchsia-400"
        />
        <button className="bg-brand-gradient rounded-2xl px-5 font-bold text-white">Buscar</button>
      </form>
      {q ? (
        <>
          <p className="text-muted">
            {results.length} resultado{results.length === 1 ? "" : "s"} para «{q}»
          </p>
          <PollGrid polls={results} />
          {!results.length && (
            <p className="text-center">
              ¿No existe?{" "}
              <Link href="/crear" className="font-bold text-fuchsia-300 underline">
                Propón esta pregunta
              </Link>
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className={`rounded-full bg-gradient-to-r ${c.gradient} px-4 py-2 text-sm font-bold`}>
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
