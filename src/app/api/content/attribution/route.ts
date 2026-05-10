import { NextResponse } from "next/server";
import { reporteAtribucionGlobal } from "@/lib/content-attribution";

export async function GET() {
  const reporte = reporteAtribucionGlobal();
  const totalIngresos = reporte.reduce((sum, p) => sum + p.ingresosCentavos, 0);
  const totalLeads = reporte.reduce((sum, p) => sum + p.leadsAtribuidos, 0);
  return NextResponse.json({ data: reporte, totalIngresos, totalLeads, count: reporte.length });
}
