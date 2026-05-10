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

const FROM_DEFAULT = process.env.EMAIL_FROM || "CRM EI <noreply@evoluciona.com>";
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

// Templates de email EI
export const templates = {
  bienvenida: (nombre: string) => ({
    subject: "Bienvenido/a a Evoluciona Inteligente",
    html: `<h2>Hola ${nombre},</h2><p>Gracias por conectarte con Evoluciona Inteligente. Estamos aquí para ayudarte a construir un sistema de contenido e identidad que funcione.</p><p>En los próximos días recibirás recursos para empezar.</p>`,
  }),

  postCompra: (nombre: string, producto: string) => ({
    subject: `Tu compra de ${producto} — próximos pasos`,
    html: `<h2>Hola ${nombre},</h2><p>Recibimos tu compra de <strong>${producto}</strong>. Gracias por confiar en Evoluciona Inteligente.</p><p>Revisa tu correo — recibirás acceso en las próximas horas.</p>`,
  }),

  seguimiento: (nombre: string) => ({
    subject: "¿En qué podemos ayudarte?",
    html: `<h2>Hola ${nombre},</h2><p>Notamos que hace un tiempo que no hemos hablado. ¿Hay algo en lo que podamos ayudarte con tu identidad de marca o sistema de contenido?</p>`,
  }),

  reactivacion: (nombre: string) => ({
    subject: "Te echamos de menos en Evoluciona Inteligente",
    html: `<h2>Hola ${nombre},</h2><p>Han pasado varios semanas sin noticias tuyas. Si tienes dudas o quieres retomar el camino, aquí estamos.</p>`,
  }),

  upsellSistemaCompleto: (nombre: string) => ({
    subject: "El siguiente paso para tu negocio",
    html: `<h2>Hola ${nombre},</h2><p>Ya tienes tu guía — el siguiente paso es el Sistema Completo de Identidad y Contenido. ¿Conversamos?</p>`,
  }),
};
