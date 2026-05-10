import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { decisions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { guardarDecision } from "@/lib/decision-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");

  let query = db.select().from(decisions);
  if (estado) {
    query = query.where(eq(decisions.estado, estado)) as typeof query;
  }

  const results = query.orderBy(desc(decisions.createdAt)).limit(100).all();
  return NextResponse.json({ data: results, count: results.length });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { tipo, accion, prioridad } = body;
  if (!tipo || !accion) {
    return NextResponse.json({ error: "tipo y accion son requeridos" }, { status: 400 });
  }

  const decision = guardarDecision({
    tipo: tipo as string,
    accion: accion as string,
    prioridad: (prioridad as "critica" | "alta" | "media" | "baja") ?? "media",
    impacto: body.impacto as string | undefined,
    entidad: body.entidad as string | undefined,
    entidadId: body.entidadId as string | undefined,
    responsable: body.responsable as string | undefined,
    diasPlazo: body.diasPlazo as number | undefined,
  });

  return NextResponse.json({ data: decision }, { status: 201 });
}
