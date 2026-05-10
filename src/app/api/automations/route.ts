import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { automationLogs, contacts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { dispararAutomacion, type AutomationTrigger } from "@/lib/automations";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");

  let query = db
    .select({
      id: automationLogs.id,
      contactId: automationLogs.contactId,
      tipo: automationLogs.tipo,
      canal: automationLogs.canal,
      estado: automationLogs.estado,
      payload: automationLogs.payload,
      createdAt: automationLogs.createdAt,
      contactName: contacts.name,
    })
    .from(automationLogs)
    .leftJoin(contacts, eq(automationLogs.contactId, contacts.id));

  if (contactId) {
    query = query.where(eq(automationLogs.contactId, contactId)) as typeof query;
  }

  const results = query.orderBy(desc(automationLogs.createdAt)).limit(200).all();
  return NextResponse.json({ data: results, count: results.length });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { contactId, trigger } = body;

  if (!contactId || !trigger) {
    return NextResponse.json({ error: "contactId y trigger son requeridos" }, { status: 400 });
  }

  const contact = db.select().from(contacts).where(eq(contacts.id, contactId as string)).get();
  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  if (!contact.email) {
    return NextResponse.json({ error: "El contacto no tiene email — no se puede disparar automatización" }, { status: 422 });
  }

  await dispararAutomacion(trigger as AutomationTrigger, {
    contactId: contact.id,
    contactName: contact.name,
    contactEmail: contact.email,
  });

  return NextResponse.json({ ok: true, trigger, contactId });
}
