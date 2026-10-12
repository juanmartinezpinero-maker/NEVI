import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aviso legal" };

/**
 * Datos del titular exigidos por la LSSI (art. 10). Se rellenan con variables de entorno en Vercel
 * para no tener que tocar el código: LEGAL_NAME, LEGAL_NIF, LEGAL_ADDRESS, LEGAL_EMAIL y LEGAL_REGISTRY.
 */
function field(name: string) {
  const v = process.env[name]?.trim();
  return v ? v : <span className="rounded bg-pink-soft px-1.5 font-semibold">[pendiente: {name}]</span>;
}

export default function LegalNoticePage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-[15px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:tracking-[-0.03em]">
      <h1 className="text-[40px] font-black leading-none tracking-[-0.05em]">Aviso legal</h1>
      <p className="text-sm font-semibold text-pink">Plantilla pendiente de revisión legal.</p>
      <h2>Titular del sitio web</h2>
      <ul className="list-none space-y-1 p-0">
        <li>
          <b>Titular:</b> {field("LEGAL_NAME")}
        </li>
        <li>
          <b>NIF/CIF:</b> {field("LEGAL_NIF")}
        </li>
        <li>
          <b>Domicilio:</b> {field("LEGAL_ADDRESS")}
        </li>
        <li>
          <b>Email de contacto:</b> {field("LEGAL_EMAIL")}
        </li>
        <li>
          <b>Datos registrales:</b> {field("LEGAL_REGISTRY")}
        </li>
      </ul>
      <h2>Objeto</h2>
      <p>
        voppi! es una plataforma de entretenimiento para votar preguntas y consultar resultados agregados. El uso del sitio implica la aceptación de
        este aviso legal, de las condiciones de uso y de la política de privacidad.
      </p>
      <h2>Propiedad intelectual</h2>
      <p>
        La marca voppi!, el diseño y el código del sitio pertenecen a su titular. Las preguntas propuestas por los usuarios siguen siendo suyas, que
        conceden una licencia para publicarlas y mostrar sus resultados.
      </p>
      <h2>Responsabilidad</h2>
      <p>
        Los resultados son votaciones populares abiertas y no constituyen estudios representativos. El titular no se responsabiliza del uso que se
        haga de ellos ni de los contenidos de sitios enlazados.
      </p>
      <h2>Legislación aplicable</h2>
      <p>Este sitio se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la ley.</p>
    </article>
  );
}
