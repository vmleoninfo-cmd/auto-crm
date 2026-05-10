// Motor de tareas EI — crea y prioriza tareas desde decisions o eventos

import { db } from "@/db";
import { tasks, decisions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type Prioridad = "critica" | "alta" | "media" | "baja";
type TipoTarea = "estratégica" | "contenido" | "comercial" | "operativa";

interface NuevaTareaInput {
  decisionId?: string;
  origenModulo: string;
  tipo: TipoTarea;
  prioridad: Prioridad;
  impacto?: string;
  entidadTipo?: string;
  entidadId?: string;
  titulo: string;
  accion: string;
  responsable?: "sistema" | "humano";
  diasLimite?: number;
}

export function crearTarea(input: NuevaTareaInput) {
  const fechaLimite = input.diasLimite
    ? new Date(Date.now() + input.diasLimite * 86400000)
    : undefined;

  return db
    .insert(tasks)
    .values({
      decisionId: input.decisionId,
      origenModulo: input.origenModulo,
      tipo: input.tipo,
      prioridad: input.prioridad,
      impacto: input.impacto,
      entidadTipo: input.entidadTipo,
      entidadId: input.entidadId,
      titulo: input.titulo,
      accion: input.accion,
      responsable: input.responsable ?? "humano",
      estado: "pendiente",
      fechaLimite,
      createdAt: new Date(),
    })
    .returning()
    .get();
}

export function obtenerTareasPriorizadas(filtros?: {
  estado?: string;
  prioridad?: Prioridad;
  responsable?: string;
}) {
  const prioridadOrden: Record<string, number> = {
    critica: 0,
    alta: 1,
    media: 2,
    baja: 3,
  };

  let query = db.select().from(tasks);

  if (filtros?.estado) {
    query = query.where(eq(tasks.estado, filtros.estado)) as typeof query;
  }
  if (filtros?.prioridad) {
    query = query.where(eq(tasks.prioridad, filtros.prioridad)) as typeof query;
  }
  if (filtros?.responsable) {
    query = query.where(eq(tasks.responsable, filtros.responsable)) as typeof query;
  }

  const resultados = query.all();

  // Ordenar: critica → alta → media → baja, luego por fecha límite
  return resultados.sort((a, b) => {
    const pa = prioridadOrden[a.prioridad] ?? 3;
    const pb = prioridadOrden[b.prioridad] ?? 3;
    if (pa !== pb) return pa - pb;
    const fa = a.fechaLimite?.getTime() ?? Infinity;
    const fb = b.fechaLimite?.getTime() ?? Infinity;
    return fa - fb;
  });
}

export function ejecutarTarea(id: string, impactoGenerado?: string) {
  return db
    .update(tasks)
    .set({
      estado: "ejecutada",
      fechaEjecucion: new Date(),
      impactoGenerado,
    })
    .where(eq(tasks.id, id))
    .returning()
    .get();
}

export function descartarTarea(id: string) {
  return db
    .update(tasks)
    .set({ estado: "descartada" })
    .where(eq(tasks.id, id))
    .returning()
    .get();
}

// Genera tareas automáticamente desde una decision
export function generarTareasDesdeDecision(decisionId: string): number {
  const decision = db.select().from(decisions).where(eq(decisions.id, decisionId)).get();
  if (!decision) return 0;

  crearTarea({
    decisionId: decision.id,
    origenModulo: "decision_engine",
    tipo: "estratégica",
    prioridad: decision.prioridad as Prioridad,
    impacto: decision.impacto ?? undefined,
    entidadTipo: decision.entidad ?? undefined,
    entidadId: decision.entidadId ?? undefined,
    titulo: `Ejecutar decisión: ${decision.tipo}`,
    accion: decision.accion,
    responsable: decision.responsable as "sistema" | "humano",
    diasLimite: 3,
  });

  return 1;
}
