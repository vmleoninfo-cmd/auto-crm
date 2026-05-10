import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const plataforma = searchParams.get("plataforma");
  const estado = searchParams.get("estado");

  let query = db.select().from(content);
  if (plataforma) query = query.where(eq(content.plataforma, plataforma)) as typeof query;
  if (estado) query = query.where(eq(content.estado, estado)) as typeof query;

  const results = query.orderBy(desc(content.createdAt)).all();
  return NextResponse.json({ data: results, count: results.length });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { titulo, plataforma, tipo } = body;
  if (!titulo || !plataforma || !tipo) {
    return NextResponse.json({ error: "titulo, plataforma y tipo son requeridos" }, { status: 400 });
  }

  const pieza = db
    .insert(content)
    .values({
      titulo: titulo as string,
      plataforma: plataforma as string,
      tipo: tipo as string,
      formato: body.formato as string | undefined,
      hook: body.hook as string | undefined,
      utmSource: body.utmSource as string | undefined,
      utmMedium: body.utmMedium as string | undefined,
      utmCampaign: body.utmCampaign as string | undefined,
      utmContent: body.utmContent as string | undefined,
      productoId: body.productoId as string | undefined,
      objetivo: body.objetivo as string | undefined,
      estado: (body.estado as string) || "borrador",
      publicadoAt: body.publicadoAt ? new Date(body.publicadoAt as string) : undefined,
      createdAt: new Date(),
    })
    .returning()
    .get();

  return NextResponse.json({ data: pieza }, { status: 201 });
}
