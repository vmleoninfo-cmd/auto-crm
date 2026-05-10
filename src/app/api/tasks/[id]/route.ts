import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ejecutarTarea, descartarTarea } from "@/lib/task-engine";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tarea = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!tarea) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  return NextResponse.json({ data: tarea });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { accion, impactoGenerado } = body;

  if (accion === "ejecutar") {
    const tarea = ejecutarTarea(id, impactoGenerado as string | undefined);
    if (!tarea) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    return NextResponse.json({ data: tarea });
  }

  if (accion === "descartar") {
    const tarea = descartarTarea(id);
    if (!tarea) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    return NextResponse.json({ data: tarea });
  }

  // Actualización de campos libres
  const existing = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!existing) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

  const updated = db
    .update(tasks)
    .set({
      prioridad: (body.prioridad as string) ?? existing.prioridad,
      estado: (body.estado as string) ?? existing.estado,
      impactoGenerado: (body.impactoGenerado as string) ?? existing.impactoGenerado,
    })
    .where(eq(tasks.id, id))
    .returning()
    .get();

  return NextResponse.json({ data: updated });
}
