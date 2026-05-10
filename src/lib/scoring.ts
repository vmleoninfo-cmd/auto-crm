import type { Temperature } from "@/types";

// Fuentes EI y sus pesos de score
const SOURCE_WEIGHTS: Record<string, number> = {
  referido: 30,
  gumroad: 25,
  evento_live: 20,
  instagram_organico: 15,
  instagram_dm: 15,
  formulario_web: 10,
  pinterest: 8,
  tiktok: 8,
  cold_outreach: 5,
  otro: 0,
};

// Estados relacionales EI que modifican el score
const ESTADO_WEIGHTS: Record<string, number> = {
  cliente_premium: 40,
  cliente_recurrente: 35,
  candidato_comunidad: 30,
  cliente_guia: 25,
  lead_calificado_asesoria_1a1: 20,
  lead_caliente: 15,
  lead_tibio: 5,
  lead_frio: -5,
  lead_nuevo: 0,
  inactivo: -10,
};

interface ScoringInput {
  temperature: Temperature;
  hasEmail: boolean;
  hasPhone: boolean;
  hasCompany: boolean;
  activityCount: number;
  daysSinceLastActivity: number;
  hasDeals: boolean;
  dealValue: number;
  // Campos EI opcionales
  source?: string;
  estadoRelacion?: string;
  totalCompras?: number;
  valorGenerado?: number;
}

export function calculateLeadScore(input: ScoringInput): number {
  let score = 0;

  // Temperatura base
  switch (input.temperature) {
    case "hot":
      score += 20;
      break;
    case "warm":
      score += 10;
      break;
    case "cold":
      score += 0;
      break;
  }

  // Fuente EI (peso principal)
  if (input.source) {
    score += SOURCE_WEIGHTS[input.source] ?? 0;
  }

  // Estado relacional EI
  if (input.estadoRelacion) {
    score += ESTADO_WEIGHTS[input.estadoRelacion] ?? 0;
  }

  // Historial de compras
  if (input.totalCompras) {
    score += Math.min(input.totalCompras * 8, 24);
  }

  // Completitud del contacto
  if (input.hasEmail) score += 5;
  if (input.hasPhone) score += 5;

  // Engagement por actividades
  score += Math.min(input.activityCount * 3, 15);

  // Penalización por inactividad
  if (input.daysSinceLastActivity > 30) score -= 15;
  else if (input.daysSinceLastActivity > 14) score -= 8;
  else if (input.daysSinceLastActivity > 7) score -= 3;

  return Math.max(0, Math.min(100, score));
}

export function suggestTemperature(score: number): Temperature {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

// Traduce estadoRelacion EI → temperatura base para UI heredada
export function estadoToTemperature(estadoRelacion: string): Temperature {
  const hot = ["lead_caliente", "lead_calificado_asesoria_1a1", "cliente_guia", "cliente_recurrente", "cliente_premium", "candidato_comunidad"];
  const warm = ["lead_tibio"];
  if (hot.includes(estadoRelacion)) return "hot";
  if (warm.includes(estadoRelacion)) return "warm";
  return "cold";
}

// Valida transiciones permitidas entre estados relacionales EI
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  lead_nuevo: ["lead_frio", "lead_tibio", "lead_caliente", "inactivo"],
  lead_frio: ["lead_tibio", "inactivo"],
  lead_tibio: ["lead_caliente", "lead_frio", "inactivo"],
  lead_caliente: ["lead_calificado_asesoria_1a1", "cliente_guia", "lead_tibio", "inactivo"],
  lead_calificado_asesoria_1a1: ["cliente_guia", "cliente_recurrente", "lead_caliente"],
  cliente_guia: ["cliente_recurrente", "candidato_comunidad", "inactivo"],
  cliente_recurrente: ["cliente_premium", "candidato_comunidad", "inactivo"],
  cliente_premium: ["candidato_comunidad", "inactivo"],
  candidato_comunidad: ["cliente_premium", "inactivo"],
  inactivo: ["lead_tibio", "lead_frio"],
};

export function isTransicionValida(desde: string, hacia: string): boolean {
  return TRANSICIONES_VALIDAS[desde]?.includes(hacia) ?? false;
}
