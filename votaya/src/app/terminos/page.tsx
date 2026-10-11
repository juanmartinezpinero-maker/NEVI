import type { Metadata } from "next";

export const metadata: Metadata = { title: "Condiciones de uso" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-[15px] leading-relaxed [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold">
      <h1 className="font-display text-3xl font-extrabold">Condiciones de uso</h1>
      <p className="text-sm text-amber-200">Borrador para el MVP pendiente de revisión legal.</p>
      <h2>El servicio</h2>
      <p>VotaYa es una plataforma de entretenimiento para votar preguntas y consultar resultados agregados. Votar es gratuito.</p>
      <h2>Votaciones populares</h2>
      <p>
        Los resultados reflejan solo la opinión de quienes han votado. No son estudios representativos de ninguna población salvo que
        una encuesta se marque expresamente como «Estudio representativo».
      </p>
      <h2>Normas</h2>
      <ul className="list-disc pl-5">
        <li>Una cuenta por persona y un voto por encuesta. Prohibido automatizar votos o manipular resultados.</li>
        <li>Las preguntas propuestas se moderan. No se permiten insultos, odio, datos personales de terceros ni contenido ilegal.</li>
        <li>Podemos retirar contenido o cuentas que incumplan estas normas.</li>
      </ul>
      <h2>Contenido patrocinado</h2>
      <p>Las encuestas pagadas por marcas se identificarán siempre como «Patrocinada».</p>
    </article>
  );
}
