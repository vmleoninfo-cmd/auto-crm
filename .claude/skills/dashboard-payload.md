---
name: dashboard-payload
description: KPIs, métricas y payloads procesados para el dashboard ejecutivo del CRM de Evoluciona Inteligente.
stack: [TypeScript, Drizzle ORM, Next.js Server Components]
---

## Propósito

Define qué métricas se muestran en el dashboard y cómo se calculan. Toda lógica de métricas vive en `src/lib/metrics.ts` — los componentes solo reciben payloads listos para mostrar.

## KPIs del dashboard EI

### Panel principal

```typescript
// src/lib/metrics.ts
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const ahora = Date.now()
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  
  const [
    totalLeads,
    leadsCalientes,
    dealsMes,
    ingresosGanados,
    followupsHoy,
    conversionRate,
  ] = await Promise.all([
    // Total leads activos
    db.select({ count: sql<number>`count(*)` }).from(contacts)
      .then(r => r[0].count),
    
    // Leads calientes ahora
    db.select({ count: sql<number>`count(*)` }).from(contacts)
      .where(eq(contacts.temperature, 'caliente'))
      .then(r => r[0].count),
    
    // Deals abiertos este mes
    db.select({ count: sql<number>`count(*)` }).from(deals)
      .where(gte(deals.createdAt, inicioMes.getTime()))
      .then(r => r[0].count),
    
    // Ingresos cerrados este mes (centavos)
    db.select({ total: sql<number>`sum(value)` }).from(deals)
      .where(and(
        eq(deals.stage, 'cerrado_ganado'),
        gte(deals.updatedAt, inicioMes.getTime()),
      ))
      .then(r => r[0].total ?? 0),
    
    // Follow-ups para hoy
    db.select({ count: sql<number>`count(*)` }).from(activities)
      .where(and(
        eq(activities.type, 'follow_up'),
        isNull(activities.completedAt),
        lt(activities.scheduledAt, ahora + 86400000),
        gte(activities.scheduledAt, ahora - 86400000),
      ))
      .then(r => r[0].count),
    
    // Tasa de conversión (cerrado_ganado / total)
    getConversionRate(),
  ])
  
  return {
    totalLeads,
    leadsCalientes,
    dealsMes,
    ingresosGanados,          // centavos — usar formatCurrency() en UI
    followupsHoy,
    conversionRate,           // porcentaje 0-100
    ingresosPotenciales: await getIngresosPotenciales(),
  }
}
```

### Métricas de pipeline

```typescript
export async function getPipelineMetrics() {
  // Deals por etapa con valor total
  const porEtapa = await db
    .select({
      stage: deals.stage,
      count: sql<number>`count(*)`,
      valor: sql<number>`sum(value)`,
    })
    .from(deals)
    .where(notInArray(deals.stage, ['cerrado_ganado', 'cerrado_perdido']))
    .groupBy(deals.stage)
  
  // Tiempo promedio en cada etapa (días)
  const tiempoPromedio = await db
    .select({
      stage: deals.stage,
      avgDias: sql<number>`avg((${deals.updatedAt} - ${deals.createdAt}) / 86400000)`,
    })
    .from(deals)
    .groupBy(deals.stage)
  
  return { porEtapa, tiempoPromedio }
}
```

### Métricas de adquisición

```typescript
export async function getAcquisitionMetrics(dias = 30) {
  const desde = Date.now() - dias * 86400000
  
  // Leads por fuente en el período
  const porFuente = await db
    .select({
      source: contacts.utmSource,
      count: sql<number>`count(*)`,
    })
    .from(contacts)
    .where(gte(contacts.createdAt, desde))
    .groupBy(contacts.utmSource)
  
  // Tasa de conversión por fuente
  const conversionPorFuente = await db
    .select({
      source: contacts.utmSource,
      totalLeads: sql<number>`count(distinct ${contacts.id})`,
      dealsGanados: sql<number>`count(distinct ${deals.id})`,
    })
    .from(contacts)
    .leftJoin(deals, and(
      eq(deals.contactId, contacts.id),
      eq(deals.stage, 'cerrado_ganado'),
    ))
    .where(gte(contacts.createdAt, desde))
    .groupBy(contacts.utmSource)
  
  return { porFuente, conversionPorFuente }
}
```

## Payload del panel ejecutivo

```typescript
// src/app/api/dashboard/route.ts
export async function GET() {
  const [kpis, pipeline, acquisition, decisions] = await Promise.all([
    getDashboardKPIs(),
    getPipelineMetrics(),
    getAcquisitionMetrics(30),
    detectarRiesgos(),      // del decision-engine
  ])
  
  return NextResponse.json({
    generadoEn: Date.now(),
    kpis,
    pipeline,
    acquisition,
    alertas: decisions.slice(0, 5),  // top 5 alertas
  })
}
```

## Formato de respuesta estándar del dashboard

```typescript
interface DashboardPayload {
  generadoEn: number          // timestamp
  kpis: {
    totalLeads: number
    leadsCalientes: number
    dealsMes: number
    ingresosGanados: number   // centavos CLP
    ingresosPotenciales: number
    followupsHoy: number
    conversionRate: number    // 0-100
  }
  pipeline: {
    porEtapa: { stage: string; count: number; valor: number }[]
    tiempoPromedio: { stage: string; avgDias: number }[]
  }
  acquisition: {
    porFuente: { source: string; count: number }[]
    conversionPorFuente: { source: string; totalLeads: number; dealsGanados: number }[]
  }
  alertas: Alerta[]
}
```

## Reglas

- Todos los valores monetarios en centavos — `formatCurrency()` en UI
- El dashboard se actualiza automáticamente — no requiere refresh manual
- Cachear el payload por máximo 5 minutos en producción
- Los gráficos reciben arrays simples — no objetos complejos
- Separar claramente: ingresos ganados (real) vs ingresos potenciales (pipeline)
- Período por defecto: últimos 30 días — parámetro `?dias=N` opcional
