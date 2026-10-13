import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-[15px] leading-relaxed [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold">
      <h1 className="font-display text-3xl font-extrabold">Política de privacidad</h1>
      <p className="text-sm font-semibold text-pink">
        Borrador para el MVP. Debe revisarlo un profesional legal antes del lanzamiento público (RGPD / LOPDGDD).
      </p>
      <h2>Qué datos tratamos</h2>
      <ul className="list-disc pl-5">
        <li>Email (para enviarte el código de acceso; no usamos contraseñas).</li>
        <li>Franja de edad, género (opcional: «prefiero no decirlo») y país de residencia.</li>
        <li>Tus votos y las preguntas que propones.</li>
        <li>Un identificador anónimo de dispositivo (cookie técnica) y un hash irreversible de tu IP para evitar votos fraudulentos.</li>
        <li>Eventos de uso propios (visitas, votos, registros, enlaces de origen) sin herramientas de terceros.</li>
      </ul>
      <h2>Para qué</h2>
      <p>
        Para permitirte votar una vez por encuesta, mostrar resultados agregados por país, edad y género y proteger la plataforma contra
        abusos. Nunca mostramos respuestas individuales: los desgloses solo aparecen con un mínimo de votos por grupo.
      </p>
      <h2>Base legal</h2>
      <p>Ejecución del servicio que solicitas y tu consentimiento (comunicaciones opcionales, que puedes retirar cuando quieras).</p>
      <h2>Cookies</h2>
      <p>
        Usamos solo cookies técnicas: sesión (<code>vy_session</code>), identificador anónimo de dispositivo (<code>vy_aid</code>) y
        origen de la visita (<code>vy_ref</code>, 30 días). No usamos cookies publicitarias ni de terceros.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Desde tu perfil puedes descargar tus datos y borrar tu cuenta. Al borrarla eliminamos tu email y perfil; los votos se conservan
        desvinculados de ti para no alterar resultados ya publicados.
      </p>
      <h2>Edad mínima</h2>
      <p>voppi! está dirigida a mayores de 16 años.</p>
    </article>
  );
}
