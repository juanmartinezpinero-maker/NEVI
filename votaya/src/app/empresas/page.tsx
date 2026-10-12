import type { Metadata } from "next";
import { LeadForm } from "./LeadForm";

export const metadata: Metadata = { title: "Empresas y marcas", description: "Encuestas patrocinadas, campañas con creadores e insights de audiencia en voppi!" };

const FEATURES = [
  { icon: "01", title: "Encuestas patrocinadas", text: "Tu pregunta en la portada y en el feed, señalizada como patrocinada." },
  { icon: "02", title: "Campañas con creadores", text: "Enlaces de seguimiento por creador con visitas, votos y registros medidos." },
  { icon: "03", title: "Segmentación", text: "Resultados por país, edad y género de usuarios verificados." },
  { icon: "04", title: "Panel de resultados", text: "Presupuesto, alcance y conclusiones en un panel propio (próximamente)." },
];

export default function BusinessPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <h1 className="text-[44px] font-black leading-[0.98] tracking-[-0.05em] sm:text-[56px]">
          Pregunta al mundo. <span className="text-gradient">Escucha la respuesta.</span>
        </h1>
        <p className="text-lg text-muted">
          Estamos preparando las herramientas para marcas. Apúntate y serás de las primeras en lanzar campañas en voppi!
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-[22px] bg-wash p-4">
              <p className="text-xl font-black text-pink" aria-hidden>
                {f.icon}
              </p>
              <p className="mt-2 font-bold">{f.title}</p>
              <p className="text-sm text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="h-fit rounded-[28px] bg-lime p-6">
        <h2 className="mb-4 text-2xl font-black tracking-[-0.04em]">Lista de espera para marcas</h2>
        <LeadForm />
      </div>
    </div>
  );
}
