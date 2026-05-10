import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contentEvents, content } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const pieza = db.select().from(content).where(eq(content.id, id)).get();
  if (!pieza) return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const tipo = body.tipo as string;
  if (!["click", "view"].includes(tipo)) {
    return NextResponse.json({ error: "tipo debe ser 'click' o 'view'" }, { status: 400 });
  }

  const evento = db.insert(contentEvents).values({
    contentId: id,
    contactId: body.contactId as string | undefined,
    tipo,
    createdAt: new Date(),
  }).returning().get();

  return NextResponse.json({ data: evento }, { status: 201 });
}
