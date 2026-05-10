// Motor de automatizaciones EI — triggers por estado relacional

import { db } from "@/db";
import { contacts, automationLogs, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail, templates } from "./email";

export type AutomationTrigger =
  | "lead_nuevo"
  | "lead_caliente"
  | "cliente_guia"
  | "cliente_recurrente"
  | "inactivo"
  | "post_compra";

interface AutomationContext {
  contactId: string;
  contactName: string;
  contactEmail: string;
  producto?: string;
}

async function logAutomation(
  contactId: string,
  tipo: string,
  canal: string,
  estado: string,
  payload?: Record<string, unknown>
) {
  db.insert(automationLogs)
    .values({
      contactId,
      tipo,
      canal,
      estado,
      payload: payload ? JSON.stringify(payload) : undefined,
      createdAt: new Date(),
    })
    .run();
}

function crearTareaHumana(titulo: string, accion: string, contactId: string, origenModulo: string) {
  db.insert(tasks)
    .values({
      origenModulo,
      tipo: "comercial",
      prioridad: "alta",
      entidadTipo: "contact",
      entidadId: contactId,
      titulo,
      accion,
      responsable: "humano",
      estado: "pendiente",
      createdAt: new Date(),
    })
    .run();
}

export async function dispararAutomacion(
  trigger: AutomationTrigger,
  ctx: AutomationContext
): Promise<void> {
  switch (trigger) {
    case "lead_nuevo": {
      if (!ctx.contactEmail) break;
      const tpl = templates.bienvenida(ctx.contactName);
      const result = await sendEmail({ to: ctx.contactEmail, ...tpl });
      await logAutomation(ctx.contactId, "bienvenida", "email", result.ok ? "enviado" : "error", { emailId: result.id });
      break;
    }

    case "lead_caliente": {
      crearTareaHumana(
        `Contactar a ${ctx.contactName} para asesoría 1:1`,
        "Escribir por el canal principal y agendar llamada de diagnóstico",
        ctx.contactId,
        "atencion"
      );
      await logAutomation(ctx.contactId, "tarea_asesoria", "interno", "creado");
      break;
    }

    case "post_compra":
    case "cliente_guia": {
      if (!ctx.contactEmail) break;
      const tpl = templates.postCompra(ctx.contactName, ctx.producto || "tu producto");
      const result = await sendEmail({ to: ctx.contactEmail, ...tpl });
      await logAutomation(ctx.contactId, "post_compra", "email", result.ok ? "enviado" : "error");

      // Upsell hacia Sistema Completo
      const upsellTpl = templates.upsellSistemaCompleto(ctx.contactName);
      await sendEmail({ to: ctx.contactEmail, ...upsellTpl });
      await logAutomation(ctx.contactId, "upsell_sistema_completo", "email", "enviado");
      break;
    }

    case "inactivo": {
      if (!ctx.contactEmail) break;
      const tpl = templates.reactivacion(ctx.contactName);
      const result = await sendEmail({ to: ctx.contactEmail, ...tpl });
      await logAutomation(ctx.contactId, "reactivacion", "email", result.ok ? "enviado" : "error");
      break;
    }

    case "cliente_recurrente": {
      // Solo registrar — seguimiento manual
      await logAutomation(ctx.contactId, "cliente_recurrente_detectado", "interno", "registrado");
      break;
    }
  }
}

// Detecta contactos inactivos (>30 días sin interacción) y dispara reactivación
export async function procesarInactivos(): Promise<number> {
  const hace30Dias = new Date(Date.now() - 30 * 86400000);

  const inactivos = db
    .select()
    .from(contacts)
    .where(eq(contacts.estadoRelacion, "lead_caliente"))
    .all()
    .filter(
      (c) =>
        c.ultimaInteraccionAt &&
        c.ultimaInteraccionAt < hace30Dias &&
        c.email
    );

  for (const c of inactivos) {
    // Actualizar estado
    db.update(contacts)
      .set({ estadoRelacion: "inactivo", updatedAt: new Date() })
      .where(eq(contacts.id, c.id))
      .run();

    await dispararAutomacion("inactivo", {
      contactId: c.id,
      contactName: c.name,
      contactEmail: c.email!,
    });
  }

  return inactivos.length;
}
