import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, purchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseGumroadWebhook, isValidGumroadPayload } from "@/lib/gumroad";
import { calculateLeadScore } from "@/lib/scoring";
import { dispararAutomacion } from "@/lib/automations";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    const text = await request.text();
    // Gumroad puede enviar form-encoded o JSON
    if (request.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (!isValidGumroadPayload(body)) {
    return NextResponse.json({ error: "Payload Gumroad inválido — faltan campos requeridos" }, { status: 400 });
  }

  const parsed = parseGumroadWebhook(body);
  if (!parsed) {
    return NextResponse.json({ error: "No se pudo parsear el payload" }, { status: 400 });
  }

  // Ignorar webhooks de prueba en producción
  if (parsed.esTest && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: true, test: true });
  }

  const now = new Date();

  // 1. Buscar o crear contacto por email
  let contact = db.select().from(contacts).where(eq(contacts.email, parsed.contactEmail)).get();

  if (!contact) {
    contact = db
      .insert(contacts)
      .values({
        name: parsed.contactName || parsed.contactEmail,
        email: parsed.contactEmail,
        source: "gumroad",
        temperature: "hot",
        estadoRelacion: "cliente_guia",
        utmSource: parsed.utmSource,
        utmMedium: parsed.utmMedium,
        utmCampaign: parsed.utmCampaign,
        utmContent: parsed.utmContent,
        canalPrincipal: "gumroad",
        ultimaCompraAt: now,
        ultimaInteraccionAt: now,
        valorGenerado: parsed.monto,
        totalCompras: 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  } else {
    // 2. Actualizar contacto existente
    const nuevoScore = calculateLeadScore({
      temperature: "hot",
      hasEmail: true,
      hasPhone: !!contact.phone,
      hasCompany: !!contact.company,
      activityCount: 0,
      daysSinceLastActivity: 0,
      hasDeals: false,
      dealValue: 0,
      source: "gumroad",
      estadoRelacion: "cliente_guia",
      totalCompras: (contact.totalCompras ?? 0) + 1,
    });

    contact = db
      .update(contacts)
      .set({
        temperature: "hot",
        estadoRelacion: "cliente_guia",
        score: nuevoScore,
        ultimaCompraAt: now,
        ultimaInteraccionAt: now,
        valorGenerado: (contact.valorGenerado ?? 0) + parsed.monto,
        totalCompras: (contact.totalCompras ?? 0) + 1,
        updatedAt: now,
      })
      .where(eq(contacts.id, contact.id))
      .returning()
      .get();
  }

  if (!contact) {
    return NextResponse.json({ error: "Error al crear/actualizar contacto" }, { status: 500 });
  }

  // 3. Registrar la compra
  const purchase = db
    .insert(purchases)
    .values({
      contactId: contact.id,
      productoId: parsed.productoId,
      producto: parsed.producto,
      tipoProducto: "guia",
      monto: parsed.monto,
      moneda: "CLP",
      plataforma: "gumroad",
      estadoPago: "completado",
      utmSource: parsed.utmSource,
      utmMedium: parsed.utmMedium,
      utmCampaign: parsed.utmCampaign,
      utmContent: parsed.utmContent,
      createdAt: now,
    })
    .returning()
    .get();

  // 4. Disparar automatización post-compra (async, no bloquea respuesta)
  dispararAutomacion("post_compra", {
    contactId: contact.id,
    contactName: contact.name,
    contactEmail: contact.email ?? "",
    producto: parsed.producto,
  }).catch((err) => console.error("[Gumroad webhook] Error en automatización:", err));

  return NextResponse.json({
    ok: true,
    contactId: contact.id,
    purchaseId: purchase.id,
    monto: parsed.monto,
  });
}
