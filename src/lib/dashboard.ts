// Dashboard EI — agrega datos de todos los módulos en un payload unificado

import { db } from "@/db";
import { contacts, deals, purchases, tasks, automationLogs } from "@/db/schema";
import { eq, gte, lt, and } from "drizzle-orm";
import { detectarRiesgos, detectarOportunidades } from "./decision-engine";

export async function getDashboardPayload() {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const hace30Dias = new Date(Date.now() - 30 * 86400000);

  const todosContacts = db.select().from(contacts).all();
  const todasCompras = db.select().from(purchases).all();
  const todosDeals = db.select().from(deals).all();
  const todasTareas = db.select().from(tasks).all();

  // --- Zona 1: Decisión Global (desde riesgos + oportunidades) ---
  const riesgos = detectarRiesgos();
  const oportunidades = detectarOportunidades();
  const decisionGlobal = riesgos[0]
    ? { tipo: "riesgo", mensaje: riesgos[0].mensaje, accion: riesgos[0].accion, severidad: riesgos[0].severidad }
    : oportunidades[0]
    ? { tipo: "oportunidad", mensaje: oportunidades[0].mensaje, accion: oportunidades[0].accion, severidad: "media" }
    : null;

  // --- Zona 2: Alertas Críticas ---
  const alertasCriticas = riesgos.filter((r) => r.severidad === "critica").slice(0, 5);

  // --- Zona 3: Motor de Crecimiento ---
  const leadsCalientes = todosContacts.filter((c) => c.temperature === "hot").length;
  const leadsNuevosMes = todosContacts.filter(
    (c) => c.createdAt && c.createdAt >= inicioMes
  ).length;
  const dealsAbiertos = todosDeals.length;

  // --- Zona 4: Flujo Sistema ---
  const totalContenidoSemana = 0; // Se llenará cuando exista módulo contenido con datos
  const totalLeads = todosContacts.length;
  const totalClientes = todosContacts.filter((c) =>
    ["cliente_guia", "cliente_recurrente", "cliente_premium"].includes(c.estadoRelacion ?? "")
  ).length;
  const ingresosTotal = todasCompras.reduce((sum, p) => sum + (p.monto ?? 0), 0);

  // --- Zona 5: Segmentos de Relación ---
  const segmentos: Record<string, number> = {};
  const estadosEI = [
    "lead_nuevo", "lead_frio", "lead_tibio", "lead_caliente",
    "lead_calificado_asesoria_1a1", "cliente_guia", "cliente_recurrente",
    "cliente_premium", "candidato_comunidad", "inactivo",
  ];
  for (const e of estadosEI) {
    segmentos[e] = todosContacts.filter((c) => (c.estadoRelacion ?? "lead_nuevo") === e).length;
  }

  // --- Zona 6: Ingresos ---
  const ingresosMes = todasCompras
    .filter((p) => p.createdAt && p.createdAt >= inicioMes)
    .reduce((sum, p) => sum + (p.monto ?? 0), 0);
  const ticketPromedio = todasCompras.length > 0
    ? Math.round(ingresosTotal / todasCompras.length)
    : 0;
  const tasaConversion = totalLeads > 0
    ? Math.round((totalClientes / totalLeads) * 100)
    : 0;
  const productosMasVendidos = calcularTopProductos(todasCompras);

  // --- Zona 7: Operaciones ---
  const tareasPendientes = todasTareas.filter((t) => t.estado === "pendiente").length;
  const tareasVencidas = todasTareas.filter(
    (t) => t.estado === "pendiente" && t.fechaLimite && t.fechaLimite < ahora
  ).length;
  const tareasEjecutadasMes = todasTareas.filter(
    (t) => t.estado === "ejecutada" && t.fechaEjecucion && t.fechaEjecucion >= inicioMes
  ).length;

  // --- Zona 8: Acciones Prioritarias ---
  const tareasCriticas = todasTareas
    .filter((t) => t.estado === "pendiente" && t.prioridad === "critica")
    .slice(0, 5);
  const accionesPrioritarias = [
    ...alertasCriticas.map((r) => ({ fuente: "riesgo", accion: r.accion, contexto: r.mensaje })),
    ...tareasCriticas.map((t) => ({ fuente: "tarea", accion: t.accion, contexto: t.titulo })),
    ...oportunidades.slice(0, 2).map((o) => ({ fuente: "oportunidad", accion: o.accion, contexto: o.mensaje })),
  ].slice(0, 8);

  return {
    generadoEn: Date.now(),
    zona1_decisionGlobal: decisionGlobal,
    zona2_alertasCriticas: alertasCriticas,
    zona3_motorCrecimiento: { leadsCalientes, leadsNuevosMes, dealsAbiertos, oportunidades: oportunidades.length },
    zona4_flujoSistema: { contenidoSemana: totalContenidoSemana, leads: totalLeads, clientes: totalClientes, ingresosCentavos: ingresosTotal },
    zona5_segmentos: segmentos,
    zona6_ingresos: { mesCentavos: ingresosMes, totalCentavos: ingresosTotal, ticketPromedioCentavos: ticketPromedio, tasaConversionPct: tasaConversion, topProductos: productosMasVendidos },
    zona7_operaciones: { tareasPendientes, tareasVencidas, tareasEjecutadasMes },
    zona8_accionesPrioritarias: accionesPrioritarias,
  };
}

function calcularTopProductos(compras: typeof purchases.$inferSelect[]) {
  const conteo: Record<string, { count: number; total: number }> = {};
  for (const c of compras) {
    if (!conteo[c.producto]) conteo[c.producto] = { count: 0, total: 0 };
    conteo[c.producto].count++;
    conteo[c.producto].total += c.monto ?? 0;
  }
  return Object.entries(conteo)
    .map(([producto, datos]) => ({ producto, ...datos }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
