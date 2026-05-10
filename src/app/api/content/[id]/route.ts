import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pieza = db.select().from(content).where(eq(content.id, id)).get();
  if (!pieza) return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 });
  return NextResponse.json({ data: pieza });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const existing = db.select().from(content).where(eq(content.id, id)).get();
  if (!existing) return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 });

  const updated = db.update(content).set({
    titulo: (body.titulo as string) ?? existing.titulo,
    estado: (body.estado as string) ?? existing.estado,
    hook: (body.hook as string) ?? existing.hook,
    objetivo: (body.objetivo as string) ?? existing.objetivo,
    utmCampaign: (body.utmCampaign as string) ?? existing.utmCampaign,
    utmContent: (body.utmContent as string) ?? existing.utmContent,
    publicadoAt: body.publicadoAt ? new Date(body.publicadoAt as string) : existing.publicadoAt,
  }).where(eq(content.id, id)).returning().get();

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(content).where(eq(content.id, id)).run();
  return NextResponse.json({ ok: true });
}
