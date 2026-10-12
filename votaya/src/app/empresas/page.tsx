import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "./LeadForm";

export const metadata: Metadata = {
  title: "Empresas y marcas",
  description: "Tests de producto, encuestas patrocinadas y resultados por país, edad y género en un panel en directo.",
};

const FORMATS = [
  {
    n: "01",
    title: "Test de producto privado",
    text: "¿Qué color, sabor o modelo prefiere tu cliente? Encuesta solo con enlace para tu equipo, tus clientes o tus redes. Decide antes de fabricar.",
  },
  {
    n: "02",
    title: "Encuesta patrocinada",
    text: "Tu pregunta en voppi!, a la vista de toda la comunidad y marcada como patrocinada. Ideal para notoriedad y conversación.",
  },
  {
    n: "03",
    title: "Campaña con creadores",
    text: "Cada creador comparte su enlace y medimos visitas, votos y registros que trae cada uno.",
  },
];

const PANEL = [
  "Resultados en directo y votos por día",
  "Desglose por país, edad y género (cuentas verificadas)",
  "De dónde llegan las visitas: Instagram, TikTok, WhatsApp…",
  "Informe en PDF y datos en CSV para tu equipo",
];

export default function BusinessPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <p className="kicker">voppi! para marcas</p>
          <h1 className="text-[44px] font-black leading-[0.98] tracking-[-0.05em] sm:text-[56px]">
            Pregunta a tus clientes<span className="text-pink">.</span> Decide con datos<span className="text-pink">.</span>
          </h1>
          <p className="text-lg text-ink-2">
            Lanza una encuesta en minutos, compártela donde ya está tu público y mira en directo qué prefiere cada país, edad y género.
          </p>
          <ul className="space-y-2">
            {PANEL.map((p) => (
              <li key={p} className="flex gap-2 font-semibold">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-pink" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="h-fit rounded-[28px] bg-lime p-6">
          <h2 className="text-2xl font-black tracking-[-0.04em]">Pide un piloto</h2>
          <p className="mb-4 mt-1 text-sm">Te abrimos el panel de tu marca y lanzamos juntos la primera encuesta.</p>
          <LeadForm />
        </div>
      </section>

      <section aria-labelledby="formats" className="space-y-4">
        <h2 id="formats" className="text-[30px] font-black tracking-[-0.045em]">
          Formatos
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {FORMATS.map((f) => (
            <li key={f.title} className="rounded-[22px] bg-wash p-5">
              <p className="text-xl font-black text-pink" aria-hidden>
                {f.n}
              </p>
              <p className="mt-2 text-lg font-extrabold tracking-[-0.03em]">{f.title}</p>
              <p className="mt-1 text-sm text-ink-2">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 rounded-[28px] bg-ink p-6 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
        <div>
          <h2 className="text-[28px] font-black leading-none tracking-[-0.05em]">¿Ya tienes acceso?</h2>
          <p className="mt-2 text-white/75">Entra con el email que te dimos de alta y abre el panel de tu marca.</p>
        </div>
        <Link href="/marca" className="rounded-full bg-lime px-6 py-3.5 text-center font-extrabold text-ink">
          Ir al panel de marca
        </Link>
      </section>

      <p className="text-xs text-muted">
        Solo trabajamos con datos agregados: nunca compartimos votos ni perfiles individuales. Las votaciones abiertas no son estudios
        representativos. Las encuestas patrocinadas se señalan siempre como tales.
      </p>
    </div>
  );
}
