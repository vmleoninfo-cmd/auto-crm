// Motor de decisiones estratégicas EI

import Anthropic from "@anthropic-ai/sdk";
import { HAYDE_SYSTEM_CONTEXT, HAYDE_CACHE_CONTROL } from "./hayde-context";
import { db } from "@/db";
import { contacts, deals, tasks, purchases, decisions } from "@/db/schema";
import { eq, lt, isNull, notInArray, and, desc } from "drizzle-orm";
import { crearTarea } from "./task-engine";

type Prioridad = "critica" | "alta" | "media" | "baja";

export interface Riesgo {
  tipo: string;
  entidad: string;
  id: string;
  severidad: Prioridad;
  mensaje: string;
  accion: string;
}

export interface Oportunidad {
  tipo: string;
  contactId: string;
  contactNombre: string;
  impactoEstimado: number;
  mensaje: string;
  accion: string;
}

function severidadScore(s: string): number {
  return { critica: 3, alta: 2, media: 1, baja: 0 }[s] ?? 0;
}

export function detectarRiesgos(): Riesgo[] {
  const riesgos: Riesgo[] = [];

  // Deals estancados (sin movimiento en >7 días en etapa activa)
  const hace7Dias = new Date(Date.now() - 7 * 86400000);
  const dealsEstancados = db
    .select()
    .from(deals)
    .where(lt(deals.updatedAt, hace7Dias))
    .all();

  dealsEstancados.forEach((deal) => {
    riesgos.push({
      tipo: "deal_estancado",
      entidad: "deal",
      id: deal.id,
      severidad: "alta",
      mensaje: `Deal "${deal.title}" sin movimiento hace más de 7 días`,
      accion: "Hacer seguimiento o cerrar como perdido",
    });
  });

  // Follow-ups vencidos sin completar
  const followupsVencidos = db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.estado, "pendiente"),
        lt(tasks.fechaLimite, new Date())
      )
    )
    .all()
    .filter((t) => t.fechaLimite !== null);

  followupsVencidos.forEach((t) => {
    riesgos.push({
      tipo: "tarea_vencida",
      entidad: "task",
      id: t.id,
      severidad: "media",
      mensaje: `Tarea "${t.titulo}" vencida sin completar`,
      accion: "Ejecutar o reprogramar",
    });
  });

  // Leads calientes sin contacto en >5 días
  const hace5Dias = new Date(Date.now() - 5 * 86400000);
  const leadsSinContacto = db
    .select()
    .from(contacts)
    .where(eq(contacts.temperature, "hot"))
    .all()
    .filter(
      (c) =>
        !c.ultimaInteraccionAt ||
        c.ultimaInteraccionAt < hace5Dias
    );

  leadsSinContacto.forEach((c) => {
    riesgos.push({
      tipo: "lead_caliente_sin_contacto",
      entidad: "contact",
      id: c.id,
      severidad: "critica",
      mensaje: `${c.name} está caliente pero sin contacto en >5 días`,
      accion: "Contactar hoy — alta probabilidad de enfriarse",
    });
  });

  return riesgos.sort((a, b) => severidadScore(b.severidad) - severidadScore(a.severidad));
}

export function detectarOportunidades(): Oportunidad[] {
  const oportunidades: Oportunidad[] = [];

  // Compradores Gumroad sin upsell a Sistema Completo
  const compradores = db
    .select()
    .from(contacts)
    .where(eq(contacts.estadoRelacion, "cliente_guia"))
    .all()
    .filter((c) => (c.totalCompras ?? 0) >= 1 && (c.valorGenerado ?? 0) < 75000000);

  compradores.forEach((c) => {
    oportunidades.push({
      tipo: "upsell_sistema_completo",
      contactId: c.id,
      contactNombre: c.name,
      impactoEstimado: 75000000,
      mensaje: `${c.name} compró guía — candidato para Sistema Completo ($750K CLP)`,
      accion: "Contactar y presentar propuesta Sistema Completo",
    });
  });

  // Leads calificados sin deal abierto
  const calificados = db
    .select()
    .from(contacts)
    .where(eq(contacts.estadoRelacion, "lead_calificado_asesoria_1a1"))
    .all();

  calificados.forEach((c) => {
    oportunidades.push({
      tipo: "lead_calificado_sin_deal",
      contactId: c.id,
      contactNombre: c.name,
      impactoEstimado: 45000000,
      mensaje: `${c.name} calificado para asesoría — sin deal abierto`,
      accion: "Crear deal y enviar propuesta Fase 1",
    });
  });

  return oportunidades;
}

export async function analizarPipelineConIA(datos: {
  totalLeads: number;
  leadsCalientes: number;
  riesgos: Riesgo[];
  oportunidades: Oportunidad[];
  ingresosUltimos30dias: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "Análisis IA no disponible — configurar ANTHROPIC_API_KEY para activarlo.";
  }

  const client = new Anthropic({ apiKey });

  const userPrompt = `ESTADO ACTUAL DEL PIPELINE DE EI:
- Total leads activos: ${datos.totalLeads}
- Leads calientes: ${datos.leadsCalientes}
- Ingresos últimos 30 días: $${Math.round(datos.ingresosUltimos30dias / 100).toLocaleString()} CLP
- Riesgos detectados: ${datos.riesgos.length} (${datos.riesgos.filter((r) => r.severidad === "critica").length} críticos)
- Oportunidades detectadas: ${datos.oportunidades.length}

TOP RIESGOS:
${datos.riesgos.slice(0, 3).map((r) => `- [${r.severidad}] ${r.mensaje} → ${r.accion}`).join("\n") || "Ninguno"}

TOP OPORTUNIDADES:
${datos.oportunidades.slice(0, 3).map((o) => `- ${o.mensaje} → ${o.accion}`).join("\n") || "Ninguna"}

Analiza el pipeline usando el sistema HAYDE. Dame 3 recomendaciones concretas y priorizadas. Máximo 150 palabras. Sé específico y accionable. Referencia las variables HAYDE cuando aplique.`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 500,
      system: [
        {
          type: "text",
          text: HAYDE_SYSTEM_CONTEXT,
          cache_control: HAYDE_CACHE_CONTROL,
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock?.type === "text" ? textBlock.text : "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Error IA: ${msg}`;
  }
}

export function guardarDecision(input: {
  tipo: string;
  prioridad: Prioridad;
  impacto?: string;
  entidad?: string;
  entidadId?: string;
  accion: string;
  responsable?: string;
  diasPlazo?: number;
}) {
  const plazo = input.diasPlazo
    ? new Date(Date.now() + input.diasPlazo * 86400000)
    : undefined;

  const decision = db
    .insert(decisions)
    .values({
      tipo: input.tipo,
      prioridad: input.prioridad,
      impacto: input.impacto,
      entidad: input.entidad,
      entidadId: input.entidadId,
      accion: input.accion,
      estado: "pendiente",
      responsable: input.responsable ?? "humano",
      plazo,
      createdAt: new Date(),
    })
    .returning()
    .get();

  // Generar tarea automáticamente desde la decisión
  crearTarea({
    decisionId: decision.id,
    origenModulo: "decision_engine",
    tipo: "estratégica",
    prioridad: input.prioridad,
    titulo: `Ejecutar: ${input.tipo}`,
    accion: input.accion,
    responsable: (input.responsable as "sistema" | "humano") ?? "humano",
    diasLimite: input.diasPlazo ?? 3,
  });

  return decision;
}
