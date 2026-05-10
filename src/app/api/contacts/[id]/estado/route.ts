import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isTransicionValida } from "@/lib/scoring";
import { dispararAutomacion } from "@/lib/automations";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const nuevoEstado = body.estadoRelacion as string;
  if (!nuevoEstado) {
    return NextResponse.json({ error: "estadoRelacion es requerido" }, { status: 400 });
  }

  const contact = db.select().from(contacts).where(eq(contacts.id, id)).get();
  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  const estadoActual = contact.estadoRelacion ?? "lead_nuevo";

  if (!isTransicionValida(estadoActual, nuevoEstado)) {
    return NextResponse.json(
      {
        error: `Transición no permitida: ${estadoActual} → ${nuevoEstado}`,
        estadoActual,
      },
      { status: 422 }
    );
  }

  const updated = db
    .update(contacts)
    .set({
      estadoRelacion: nuevoEstado,
      ultimaInteraccionAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, id))
    .returning()
    .get();

  // Disparar automatización si aplica al nuevo estado
  const triggerEstados = ["lead_caliente", "cliente_guia", "cliente_recurrente", "inactivo"] as const;
  if (triggerEstados.includes(nuevoEstado as typeof triggerEstados[number])) {
    dispararAutomacion(nuevoEstado as typeof triggerEstados[number], {
      contactId: id,
      contactName: contact.name,
      contactEmail: contact.email ?? "",
    }).catch((err) => console.error("[estado] Error en automatización:", err));
  }

  return NextResponse.json({ data: updated });
}
