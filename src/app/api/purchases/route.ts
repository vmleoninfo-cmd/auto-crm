import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchases, contacts } from "@/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");
  const plataforma = searchParams.get("plataforma");
  const desde = searchParams.get("desde"); // timestamp ms

  let query = db
    .select({
      id: purchases.id,
      contactId: purchases.contactId,
      productoId: purchases.productoId,
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
    .leftJoin(contacts, eq(purchases.contactId, contacts.id));

  if (contactId) {
    query = query.where(eq(purchases.contactId, contactId)) as typeof query;
  }

  if (plataforma) {
    query = query.where(eq(purchases.plataforma, plataforma)) as typeof query;
  }

  if (desde) {
    const desdeDate = new Date(parseInt(desde));
    query = query.where(gte(purchases.createdAt, desdeDate)) as typeof query;
  }

  const results = query.orderBy(desc(purchases.createdAt)).all();

  const total = results.reduce((sum, p) => sum + (p.monto ?? 0), 0);

  return NextResponse.json({ data: results, total, count: results.length });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { contactId, producto, tipoProducto, monto, plataforma, estadoPago, utmSource, utmMedium, utmCampaign, utmContent, margenEstimado, costoCampana } = body;

  if (!contactId || !producto || monto === undefined) {
    return NextResponse.json({ error: "contactId, producto y monto son requeridos" }, { status: 400 });
  }

  const contact = db.select().from(contacts).where(eq(contacts.id, contactId as string)).get();
  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  const now = new Date();

  const purchase = db
    .insert(purchases)
    .values({
      contactId: contactId as string,
      producto: producto as string,
      tipoProducto: (tipoProducto as string) || "guia",
      monto: monto as number,
      moneda: "CLP",
      plataforma: (plataforma as string) || "manual",
      estadoPago: (estadoPago as string) || "completado",
      utmSource: (utmSource as string) || undefined,
      utmMedium: (utmMedium as string) || undefined,
      utmCampaign: (utmCampaign as string) || undefined,
      utmContent: (utmContent as string) || undefined,
      margenEstimado: (margenEstimado as number) || undefined,
      costoCampana: (costoCampana as number) || undefined,
      createdAt: now,
    })
    .returning()
    .get();

  // Actualizar métricas del contacto
  db.update(contacts)
    .set({
      ultimaCompraAt: now,
      ultimaInteraccionAt: now,
      valorGenerado: (contact.valorGenerado ?? 0) + (monto as number),
      totalCompras: (contact.totalCompras ?? 0) + 1,
      updatedAt: now,
    })
    .where(eq(contacts.id, contactId as string))
    .run();

  return NextResponse.json({ data: purchase }, { status: 201 });
}
