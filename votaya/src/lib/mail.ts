import "server-only";

export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/**
 * Modo demo: el código se muestra en pantalla cuando no se puede enviar por email.
 * Siempre en desarrollo; en producción solo con DEV_SHOW_CODES=1.
 */
export const demoCodesAllowed = () => process.env.NODE_ENV !== "production" || process.env.DEV_SHOW_CODES === "1";

/** Envía el código por email. Devuelve false si no hay email configurado o el envío falla. */
export async function sendLoginCode(email: string, code: string): Promise<boolean> {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV !== "production") console.info(`[VotaYa] Código de acceso para ${email}: ${code}`);
    return false;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.MAIL_FROM ?? "VotaYa <onboarding@resend.dev>",
    to: email,
    subject: `${code} es tu código de VotaYa`,
    text: `Tu código de acceso a VotaYa es ${code}. Caduca en 10 minutos.\n\nSi no lo has pedido, ignora este mensaje.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto;padding:24px">
      <h1 style="color:#7c3aed;margin:0 0 8px">VotaYa</h1>
      <p>Tu código de acceso es:</p>
      <p style="font-size:36px;font-weight:800;letter-spacing:8px;margin:16px 0">${code}</p>
      <p style="color:#555">Caduca en 10 minutos. Si no lo has pedido, ignora este mensaje.</p></div>`,
  });
  if (error) {
    console.error(`No se pudo enviar el email: ${error.message}`);
    return false;
  }
  return true;
}
