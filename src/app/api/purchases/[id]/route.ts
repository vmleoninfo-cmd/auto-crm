import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchases, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const purchase = db
    .select({
      id: purchases.id,
      contactId: purchases.contactId,
      producto: purchases.producto,
      tipoProducto: purchases.tipoProducto,
      monto: purchases.monto,
      moneda: purchases.moneda,
      plataforma: purchases.plataforma,
      estadoPago: purchases.estadoPago,
      utmSource: purchases.utmSource,
      utmMedium: purchases.utmMedium,
      utmCampaign: purchases.utmCampaign,
      utmContent: purchases.utmContent,
      margenEstimado: purchases.margenEstimado,
      createdAt: purchases.createdAt,
      contactName: contacts.name,
      contactEmail: contacts.email,
    })
    .from(purchases)
    .leftJoin(contacts, eq(purchases.contactId, contacts.id))
    .where(eq(purchases.id, id))
    .get();

  if (!purchase) {
    return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ data: purchase });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const existing = db.select().from(purchases).where(eq(purchases.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
  }

  const updated = db
    .update(purchases)
    .set({
      estadoPago: (body.estadoPago as string) ?? existing.estadoPago,
      margenEstimado: (body.margenEstimado as number) ?? existing.margenEstimado,
      costoCampana: (body.costoCampana as number) ?? existing.costoCampana,
    })
    .where(eq(purchases.id, id))
    .returning()
    .get();

  return NextResponse.json({ data: updated });
}
