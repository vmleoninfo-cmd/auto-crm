import { NextRequest, NextResponse } from "next/server";
import { crearTarea, obtenerTareasPriorizadas } from "@/lib/task-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado") ?? undefined;
  const prioridad = searchParams.get("prioridad") as "critica" | "alta" | "media" | "baja" | undefined;
  const responsable = searchParams.get("responsable") ?? undefined;

  const tareas = obtenerTareasPriorizadas({ estado, prioridad, responsable });
  return NextResponse.json({ data: tareas, count: tareas.length });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { titulo, accion, origenModulo, tipo, prioridad, diasLimite } = body;

  if (!titulo || !accion) {
    return NextResponse.json({ error: "titulo y accion son requeridos" }, { status: 400 });
  }

  const tarea = crearTarea({
    titulo: titulo as string,
    accion: accion as string,
    origenModulo: (origenModulo as string) || "manual",
    tipo: (tipo as "estratégica" | "contenido" | "comercial" | "operativa") || "operativa",
    prioridad: (prioridad as "critica" | "alta" | "media" | "baja") || "media",
    diasLimite: (diasLimite as number) || undefined,
    decisionId: (body.decisionId as string) || undefined,
    entidadTipo: (body.entidadTipo as string) || undefined,
    entidadId: (body.entidadId as string) || undefined,
    impacto: (body.impacto as string) || undefined,
    responsable: (body.responsable as "sistema" | "humano") || "humano",
  });

  return NextResponse.json({ data: tarea }, { status: 201 });
}
