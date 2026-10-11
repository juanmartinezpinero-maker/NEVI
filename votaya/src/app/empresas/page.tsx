import type { Metadata } from "next";
import { LeadForm } from "./LeadForm";

export const metadata: Metadata = { title: "Empresas y marcas", description: "Encuestas patrocinadas, campañas con creadores e insights de audiencia en VotaYa." };

const FEATURES = [
  { icon: "📣", title: "Encuestas patrocinadas", text: "Tu pregunta en la portada y en el feed, señalizada como patrocinada." },
  { icon: "🎥", title: "Campañas con creadores", text: "Enlaces de seguimiento por creador con visitas, votos y registros medidos." },
  { icon: "🎯", title: "Segmentación", text: "Resultados por país, edad y género de usuarios verificados." },
  { icon: "📊", title: "Panel de resultados", text: "Presupuesto, alcance y conclusiones en un panel propio (próximamente)." },
];

export default function BusinessPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <h1 className="font-display text-4xl font-extrabold leading-tight">
          Pregunta al mundo. <span className="text-gradient">Escucha la respuesta.</span>
        </h1>
        <p className="text-lg text-muted">
          Estamos preparando las herramientas para marcas. Apúntate y serás de las primeras en lanzar campañas en VotaYa.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="card p-4">
              <p className="text-3xl" aria-hidden>
                {f.icon}
              </p>
              <p className="mt-2 font-bold">{f.title}</p>
              <p className="text-sm text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="card h-fit p-6">
        <h2 className="mb-4 font-display text-xl font-extrabold">Lista de espera para marcas</h2>
        <LeadForm />
      </div>
    </div>
  );
}
