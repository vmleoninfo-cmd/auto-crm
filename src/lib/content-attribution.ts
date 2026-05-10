// Atribución de contenido — conecta UTM de contenido → lead → compra

import { db } from "@/db";
import { content, contentEvents, contacts, purchases } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface AtribucionPieza {
  contentId: string;
  titulo: string;
  plataforma: string;
  leadsAtribuidos: number;
  comprasAtribuidas: number;
  ingresosCentavos: number;
  eventos: { clicks: number; views: number };
}

// Resuelve qué pieza de contenido generó un lead (por UTM campaign+content)
export function resolverContenidoPorUTM(utmCampaign?: string | null, utmContent?: string | null) {
  if (!utmCampaign && !utmContent) return null;

  const piezas = db.select().from(content).all();

  return piezas.find(
    (p) =>
      (utmCampaign && p.utmCampaign === utmCampaign) ||
      (utmContent && p.utmContent === utmContent)
  ) ?? null;
}

// Calcula métricas de atribución para una pieza de contenido
export function calcularAtribucion(contentId: string): AtribucionPieza | null {
  const pieza = db.select().from(content).where(eq(content.id, contentId)).get();
  if (!pieza) return null;

  // Leads que vinieron de esta campaña UTM
  const leadsAtribuidos = pieza.utmCampaign
    ? db.select().from(contacts).all().filter(
        (c) => c.utmCampaign === pieza.utmCampaign || c.utmContent === pieza.utmContent
      ).length
    : 0;

  // Compras atribuidas a esta campaña
  const comprasAtribuidas = pieza.utmCampaign
    ? db.select().from(purchases).all().filter(
        (p) => p.utmCampaign === pieza.utmCampaign || p.utmContent === pieza.utmContent
      )
    : [];

  const ingresosCentavos = comprasAtribuidas.reduce((sum, p) => sum + (p.monto ?? 0), 0);

  // Eventos registrados
  const eventos = db.select().from(contentEvents).where(eq(contentEvents.contentId, contentId)).all();
  const clicks = eventos.filter((e) => e.tipo === "click").length;
  const views = eventos.filter((e) => e.tipo === "view").length;

  return {
    contentId,
    titulo: pieza.titulo,
    plataforma: pieza.plataforma,
    leadsAtribuidos,
    comprasAtribuidas: comprasAtribuidas.length,
    ingresosCentavos,
    eventos: { clicks, views },
  };
}

// Reporte global de atribución — todas las piezas con sus métricas
export function reporteAtribucionGlobal(): AtribucionPieza[] {
  const piezas = db.select().from(content).all();
  return piezas
    .map((p) => calcularAtribucion(p.id))
    .filter((a): a is AtribucionPieza => a !== null)
    .sort((a, b) => b.ingresosCentavos - a.ingresosCentavos);
}
