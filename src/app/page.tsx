import { db } from "@/db";
import { contacts, purchases, tasks, deals, content } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { detectarRiesgos, detectarOportunidades } from "@/lib/decision-engine";

export const dynamic = "force-dynamic";

function formatCLP(centavos: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(centavos / 100);
}

const ESTADO_LABELS: Record<string, string> = {
  lead_nuevo: "Nuevo", lead_frio: "Frío", lead_tibio: "Tibio",
  lead_caliente: "Caliente", lead_calificado_asesoria_1a1: "Calificado",
  cliente_guia: "Cliente guía", cliente_recurrente: "Recurrente",
  cliente_premium: "Premium", candidato_comunidad: "Comunidad", inactivo: "Inactivo",
};

const PRIORIDAD_COLORS: Record<string, string> = {
  critica: "text-red-700 bg-red-50 border-red-200",
  alta: "text-orange-700 bg-orange-50 border-orange-200",
  media: "text-yellow-700 bg-yellow-50 border-yellow-100",
  oportunidad: "text-green-700 bg-green-50 border-green-200",
};

export default function DashboardPage() {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const todosContacts = db.select().from(contacts).all();
  const todasCompras = db.select().from(purchases).all();
  const todasTareas = db.select().from(tasks).all();

  // Zona 3 — Motor de crecimiento
  const leadsCalientes = todosContacts.filter((c) => c.temperature === "hot").length;
  const leadsNuevosMes = todosContacts.filter((c) => c.createdAt >= inicioMes).length;
  const totalClientes = todosContacts.filter((c) =>
    ["cliente_guia", "cliente_recurrente", "cliente_premium"].includes(c.estadoRelacion ?? "")
  ).length;

  // Zona 5 — Segmentos
  const estados = ["lead_nuevo", "lead_frio", "lead_tibio", "lead_caliente",
    "lead_calificado_asesoria_1a1", "cliente_guia", "cliente_recurrente",
    "cliente_premium", "candidato_comunidad", "inactivo"];
  const segmentos = estados.map((e) => ({
    estado: e,
    label: ESTADO_LABELS[e],
    count: todosContacts.filter((c) => (c.estadoRelacion ?? "lead_nuevo") === e).length,
  })).filter((s) => s.count > 0);

  // Zona 6 — Ingresos
  const ingresosMes = todasCompras
    .filter((p) => p.createdAt >= inicioMes)
    .reduce((s, p) => s + (p.monto ?? 0), 0);
  const ingresosTotal = todasCompras.reduce((s, p) => s + (p.monto ?? 0), 0);
  const ticketPromedio = todasCompras.length > 0 ? Math.round(ingresosTotal / todasCompras.length) : 0;
  const tasaConversion = todosContacts.length > 0
    ? Math.round((totalClientes / todosContacts.length) * 100) : 0;

  // Zona 7 — Operaciones
  const tareasPendientes = todasTareas.filter((t) => t.estado === "pendiente").length;
  const tareasVencidas = todasTareas.filter(
    (t) => t.estado === "pendiente" && t.fechaLimite && t.fechaLimite < ahora
  ).length;

  // Zonas 1 & 2 — Riesgos y oportunidades
  const riesgos = detectarRiesgos();
  const oportunidades = detectarOportunidades();
  const alertasCriticas = riesgos.filter((r) => r.severidad === "critica").slice(0, 3);
  const decisionGlobal = riesgos[0] ?? null;

  // Funnel HAYDE
  const totalPiezasContenido = db.select().from(content).all().length;
  const leadsNuevos = todosContacts.filter((c) => c.estadoRelacion === "lead_nuevo").length;
  const leadsCalificados = todosContacts.filter((c) => c.estadoRelacion === "lead_calificado_asesoria_1a1").length;
  const funnelConversion = [
    { label: "Contenido", value: totalPiezasContenido, href: "/contenido" },
    { label: "Leads", value: todosContacts.length, href: "/contacts" },
    { label: "Calificados", value: leadsCalificados, href: "/contacts" },
    { label: "Clientes", value: totalClientes, href: "/contacts" },
    { label: "Ingresos", value: formatCLP(ingresosTotal), href: "/ventas" },
  ];

  // Proyección de ingresos
  const leadsAptosFase1 = todosContacts.filter((c) =>
    ["lead_caliente", "lead_calificado_asesoria_1a1"].includes(c.estadoRelacion ?? "")
  ).length;
  const proyeccion30 = leadsAptosFase1 * 45000000 * 0.3;
  const proyeccion60 = leadsCalificados * 45000000 * 0.6;

  // Activación editorial
  const riesgosCriticos = riesgos.filter((r) => r.severidad === "critica").length;
  const activacionTipo = riesgosCriticos > 0 ? "campaña" : leadsCalientes >= 3 ? "lanzamiento" : totalClientes > 0 ? "editorial" : "editorial";
  const activacionIntensidad = riesgosCriticos > 2 ? "alta" : leadsCalientes >= 2 ? "media" : "baja";
  const activacionColor = activacionTipo === "lanzamiento" ? "bg-green-50 border-green-200 text-green-800"
    : activacionTipo === "campaña" ? "bg-orange-50 border-orange-200 text-orange-800"
    : "bg-blue-50 border-blue-200 text-blue-800";

  // Zona 8 — Acciones prioritarias
  const tareasCriticas = todasTareas.filter((t) => t.estado === "pendiente" && t.prioridad === "critica").slice(0, 3);
  const accionesPrioritarias = [
    ...alertasCriticas.map((r) => ({ tipo: "riesgo" as const, texto: r.accion, contexto: r.mensaje, severidad: r.severidad })),
    ...oportunidades.slice(0, 2).map((o) => ({ tipo: "oportunidad" as const, texto: o.accion, contexto: o.mensaje, severidad: "oportunidad" })),
    ...tareasCriticas.map((t) => ({ tipo: "tarea" as const, texto: t.accion, contexto: t.titulo, severidad: "critica" })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de Comando</h1>
        <p className="text-muted-foreground">GrowthCore — visión ejecutiva del sistema</p>
      </div>

      {/* Zona 1 — Decisión Global */}
      {decisionGlobal && (
        <div className={`rounded-lg border p-4 ${PRIORIDAD_COLORS[decisionGlobal.severidad] || "bg-slate-50"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">Decisión global ahora</p>
          <p className="font-semibold">{decisionGlobal.mensaje}</p>
          <p className="text-sm mt-1 opacity-80">→ {decisionGlobal.accion}</p>
        </div>
      )}

      {/* Zona 2 — Alertas Críticas */}
      {alertasCriticas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alertas críticas</p>
          {alertasCriticas.map((r, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3 bg-red-50/60">
              <span className="text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 text-red-700 bg-red-50 border-red-200">{r.severidad}</span>
              <div>
                <p className="text-sm font-medium">{r.mensaje}</p>
                <p className="text-xs text-muted-foreground">→ {r.accion}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zonas 3 & 6 — Motor de crecimiento + Ingresos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Leads calientes", value: leadsCalientes, sub: "ahora", href: "/contacts?temperature=hot" },
          { label: "Nuevos este mes", value: leadsNuevosMes, sub: "leads", href: "/contacts" },
          { label: "Ingresos mes", value: formatCLP(ingresosMes), sub: "mes actual", href: "/ventas" },
          { label: "Ticket promedio", value: formatCLP(ticketPromedio), sub: "histórico", href: "/ventas" },
        ].map((k) => (
          <Link key={k.label} href={k.href} className="rounded-lg border p-4 space-y-1 hover:bg-muted/40 transition-colors">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-xl font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zona 5 — Segmentos de relación */}
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-semibold">Segmentos de relación</p>
          <div className="space-y-1.5">
            {segmentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin contactos aún</p>
            ) : (
              segmentos.map((s) => (
                <div key={s.estado} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-primary/20 w-24">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${Math.min(100, (s.count / todosContacts.length) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-5 text-right">{s.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zona 7 — Operaciones */}
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-semibold">Operaciones</p>
          <div className="space-y-2">
            {[
              { label: "Tareas pendientes", value: tareasPendientes, href: "/tareas?estado=pendiente" },
              { label: "Tareas vencidas", value: tareasVencidas, href: "/tareas?estado=pendiente", alert: tareasVencidas > 0 },
              { label: "Clientes activos", value: totalClientes, href: "/contacts" },
              { label: "Tasa conversión", value: `${tasaConversion}%`, href: "/ventas" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between hover:bg-muted/40 rounded px-2 py-1 transition-colors">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-semibold ${item.alert ? "text-red-600" : ""}`}>{item.value}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Zona 8 — Acciones Prioritarias */}
      {accionesPrioritarias.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-semibold">Acciones prioritarias</p>
          <div className="space-y-2">
            {accionesPrioritarias.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 mt-0.5 ${PRIORIDAD_COLORS[a.severidad] || "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  {a.tipo}
                </span>
                <div>
                  <p className="text-sm font-medium">{a.texto}</p>
                  <p className="text-xs text-muted-foreground">{a.contexto}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/decisiones" className="text-xs text-primary hover:underline">Ver análisis completo →</Link>
        </div>
      )}

      {/* Zona 4 — Funnel HAYDE */}
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-semibold">Funnel HAYDE — Contenido → Ingresos</p>
        <div className="flex items-end gap-2 overflow-x-auto pb-1">
          {funnelConversion.map((etapa, i) => {
            const maxVal = funnelConversion[1]?.value as number || 1;
            const val = typeof etapa.value === "number" ? etapa.value : 0;
            const pct = typeof etapa.value === "number" ? Math.max(10, Math.min(100, (val / (maxVal || 1)) * 100)) : 100;
            return (
              <Link key={etapa.label} href={etapa.href} className="flex-1 min-w-[60px] space-y-1 text-center hover:opacity-80 transition-opacity">
                <div className="flex flex-col items-center justify-end h-16">
                  <div className="w-full rounded-t bg-primary/80" style={{ height: `${pct}%` }} />
                </div>
                <p className="text-xs font-bold">{etapa.value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{etapa.label}</p>
                {i < funnelConversion.length - 1 && typeof funnelConversion[i + 1]?.value === "number" && typeof etapa.value === "number" && etapa.value > 0 && (
                  <p className="text-xs text-muted-foreground">{Math.round(((funnelConversion[i + 1].value as number) / etapa.value) * 100)}%</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Zona — Activación Editorial + Proyección */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`rounded-lg border p-4 space-y-2 ${activacionColor}`}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Activación editorial activa</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold capitalize">{activacionTipo}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/40 font-medium">intensidad {activacionIntensidad}</span>
          </div>
          <p className="text-xs opacity-70">
            {activacionTipo === "lanzamiento" ? `${leadsCalientes} leads calientes — momento de apertura` :
             activacionTipo === "campaña" ? `${riesgosCriticos} riesgos críticos — campaña de rescate` :
             "Distribución orgánica continua — sostener cadencia"}
          </p>
          <Link href="/decisiones" className="text-xs underline opacity-70 hover:opacity-100">Ver análisis completo →</Link>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-semibold">Proyección de ingresos</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">30 días ({leadsAptosFase1} leads aptos × 30%)</span>
              <span className="text-sm font-bold text-green-700">{formatCLP(proyeccion30)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">60 días ({leadsCalificados} calificados × 60%)</span>
              <span className="text-sm font-bold text-green-600">{formatCLP(proyeccion60)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-xs text-muted-foreground">Ingresado real este mes</span>
              <span className="text-sm font-bold">{formatCLP(ingresosMes)}</span>
            </div>
          </div>
        </div>
      </div>

      {todosContacts.length === 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
          <h2 className="text-lg font-semibold mb-2">Bienvenido al CRM EI</h2>
          <p className="text-sm text-muted-foreground mb-4">Sistema listo. Comenzá agregando contactos o configurando el webhook de Gumroad.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <Link href="/contacts" className="p-3 rounded-lg bg-card border hover:bg-muted/40 transition-colors">
              <p className="font-medium">1. Agregar contactos</p>
              <p className="text-xs text-muted-foreground mt-1">Importá leads existentes o creá manualmente</p>
            </Link>
            <div className="p-3 rounded-lg bg-card border">
              <p className="font-medium">2. Configurar Gumroad</p>
              <p className="text-xs text-muted-foreground mt-1">Webhook: <code className="bg-muted px-1 rounded">/api/webhook/gumroad</code></p>
            </div>
            <Link href="/decisiones" className="p-3 rounded-lg bg-card border hover:bg-muted/40 transition-colors">
              <p className="font-medium">3. Analizar pipeline</p>
              <p className="text-xs text-muted-foreground mt-1">El motor IA detecta riesgos y oportunidades</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
