// Wrapper de email — usa Resend si hay API key, log en consola si no

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const FROM_DEFAULT = process.env.EMAIL_FROM || "Smart Tools CRM <noreply@toolssmarts.com>";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL — dev mode] Para: ${payload.to} | Asunto: ${payload.subject}`);
    return { ok: true, id: `dev_${Date.now()}` };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from || FROM_DEFAULT,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { ok: false, error: err };
    }

    const data = await response.json() as { id: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

// Templates de email Smart Tools
export const templates = {
  bienvenida: (nombre: string) => ({
    subject: "Bienvenido/a a Smart Tools",
    html: `<h2>Hola ${nombre},</h2><p>Gracias por conectarte con Smart Tools. Estamos aquí para ayudarte a implementar un sistema de marketing inteligente que funcione.</p><p>En los próximos días recibirás acceso a tus herramientas.</p>`,
  }),

  postCompra: (nombre: string, producto: string) => ({
    subject: `Tu contratación de ${producto} — próximos pasos`,
    html: `<h2>Hola ${nombre},</h2><p>Recibimos tu contratación de <strong>${producto}</strong>. Gracias por confiar en Smart Tools.</p><p>Nos ponemos en contacto en las próximas horas para coordinar el onboarding.</p>`,
  }),

  seguimiento: (nombre: string) => ({
    subject: "¿En qué podemos ayudarte?",
    html: `<h2>Hola ${nombre},</h2><p>Notamos que hace un tiempo que no hemos hablado. ¿Hay algo en lo que podamos ayudarte con tu sistema de marketing o CRM?</p>`,
  }),

  reactivacion: (nombre: string) => ({
    subject: "Te echamos de menos en Smart Tools",
    html: `<h2>Hola ${nombre},</h2><p>Han pasado varias semanas sin noticias tuyas. Si tienes dudas o quieres retomar, aquí estamos.</p>`,
  }),

  upsellSistemaCompleto: (nombre: string) => ({
    subject: "El siguiente paso para tu negocio",
    html: `<h2>Hola ${nombre},</h2><p>Ya tienes el dashboard activo — el siguiente paso es integrar el CRM y el bot de WhatsApp para cerrar el ciclo completo. ¿Conversamos?</p>`,
  }),
};
