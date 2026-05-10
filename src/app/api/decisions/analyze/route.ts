import { NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, purchases } from "@/db/schema";
import { eq, gte } from "drizzle-orm";
import { detectarRiesgos, detectarOportunidades, analizarPipelineConIA } from "@/lib/decision-engine";

export async function POST() {
  const hace30Dias = new Date(Date.now() - 30 * 86400000);

  const totalLeads = db.select().from(contacts).all().length;
  const leadsCalientes = db.select().from(contacts).where(eq(contacts.temperature, "hot")).all().length;

  const comprasUltimos30 = db
    .select()
    .from(purchases)
    .where(gte(purchases.createdAt, hace30Dias))
    .all();

  const ingresosUltimos30dias = comprasUltimos30.reduce((sum, p) => sum + (p.monto ?? 0), 0);

  const riesgos = detectarRiesgos();
  const oportunidades = detectarOportunidades();

  const analisisIA = await analizarPipelineConIA({
    totalLeads,
    leadsCalientes,
    riesgos,
    oportunidades,
    ingresosUltimos30dias,
  });

  return NextResponse.json({
    generadoEn: Date.now(),
    resumen: {
      totalLeads,
      leadsCalientes,
      ingresosUltimos30dias,
      riesgosCriticos: riesgos.filter((r) => r.severidad === "critica").length,
      oportunidades: oportunidades.length,
    },
    riesgos,
    oportunidades,
    analisisIA,
  });
}
