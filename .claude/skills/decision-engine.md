---
name: decision-engine
description: Motor de decisiones del CRM EI — priorización de leads, alertas, detección de oportunidades y riesgos. El cerebro del sistema.
stack: [TypeScript, Drizzle ORM, @anthropic-ai/sdk, src/lib/]
---

## Propósito

Procesa el estado del pipeline y emite decisiones accionables: qué lead atender primero, qué deal está en riesgo, qué oportunidad no se está aprovechando.

## Priorización de leads (reglas)

```typescript
// src/lib/decision-engine.ts

export async function priorizarLeads(): Promise<LeadPriorizado[]> {
  const leads = await db.select().from(contacts)
    .where(eq(contacts.temperature, 'caliente'))
    .orderBy(desc(contacts.score))
  
  return leads.map(lead => ({
    ...lead,
    prioridad: calcularPrioridad(lead),
    razon: getRazonPrioridad(lead),
    accionRecomendada: getAccionRecomendada(lead),
  }))
}

function calcularPrioridad(lead: Contact): 'critica' | 'alta' | 'media' | 'baja' {
  const diasSinContacto = lead.lastContactedAt
    ? (Date.now() - lead.lastContactedAt) / 86400000
    : 999
  
  if (lead.score >= 85 && diasSinContacto <= 2) return 'critica'
  if (lead.score >= 70 || lead.source === 'referido') return 'alta'
  if (lead.temperature === 'caliente') return 'media'
  return 'baja'
}

function getAccionRecomendada(lead: Contact): string {
  const diasSinContacto = lead.lastContactedAt
    ? (Date.now() - lead.lastContactedAt) / 86400000
    : 999
  
  if (diasSinContacto > 7) return 'Retomar contacto — llevan más de una semana sin respuesta'
  if (lead.source === 'gumroad' && !lead.hasOpenDeal) return 'Abrir deal — ya compró, hay intención'
  if (lead.temperature === 'caliente' && !lead.hasOpenDeal) return 'Crear deal y enviar propuesta'
  return 'Hacer seguimiento de propuesta enviada'
}
```

## Detección de riesgos

```typescript
export async function detectarRiesgos(): Promise<Riesgo[]> {
  const riesgos: Riesgo[] = []
  
  // Deals estancados (sin actividad en >7 días en etapa activa)
  const dealsEstancados = await db.select()
    .from(deals)
    .where(and(
      notInArray(deals.stage, ['cerrado_ganado', 'cerrado_perdido']),
      lt(deals.updatedAt, Date.now() - 7 * 86400000)
    ))
  
  dealsEstancados.forEach(deal => {
    riesgos.push({
      tipo: 'deal_estancado',
      entidad: 'deal',
      id: deal.id,
      severidad: 'alta',
      mensaje: `Deal "${deal.title}" sin movimiento hace más de 7 días`,
      accion: 'Hacer seguimiento o cerrar como perdido',
    })
  })
  
  // Follow-ups vencidos sin completar
  const followupsVencidos = await db.select()
    .from(activities)
    .where(and(
      eq(activities.type, 'follow_up'),
      isNull(activities.completedAt),
      lt(activities.scheduledAt, Date.now())
    ))
  
  followupsVencidos.forEach(fu => {
    riesgos.push({
      tipo: 'followup_vencido',
      entidad: 'activity',
      id: fu.id,
      severidad: 'media',
      mensaje: 'Follow-up vencido sin completar',
      accion: 'Completar o reprogramar',
    })
  })
  
  return riesgos.sort((a, b) => 
    severidadScore(b.severidad) - severidadScore(a.severidad)
  )
}
```

## Detección de oportunidades

```typescript
export async function detectarOportunidades(): Promise<Oportunidad[]> {
  const oportunidades: Oportunidad[] = []
  
  // Compradores Gumroad sin deal abierto
  const compradorsSinDeal = await db.select()
    .from(contacts)
    .where(and(
      eq(contacts.source, 'gumroad'),
      sql`NOT EXISTS (
        SELECT 1 FROM deals 
        WHERE deals.contact_id = contacts.id 
        AND deals.stage NOT IN ('cerrado_ganado', 'cerrado_perdido')
      )`
    ))
  
  compradorsSinDeal.forEach(c => {
    oportunidades.push({
      tipo: 'comprador_sin_deal',
      contactId: c.id,
      contactNombre: c.name,
      impactoEstimado: 75000000, // $750K CLP en centavos
      mensaje: `${c.name} ya compró en Gumroad — no tiene deal abierto`,
      accion: 'Contactar y abrir deal para Sistema Completo',
    })
  })
  
  return oportunidades
}
```

## Análisis con IA (Claude)

```typescript
// src/lib/decision-engine.ts — modo IA
export async function analizarPipelineConIA(datos: PipelineData): Promise<string> {
  const client = getClaudeClient()  // src/lib/claude.ts
  
  const prompt = `
Eres el motor de decisiones de Evoluciona Inteligente.
Analiza este pipeline y da 3 recomendaciones concretas y priorizadas.

CONTEXTO EI: Vendemos sistemas de identidad y contenido para negocios.
Precio mínimo: $450.000 CLP (Fase 1) / $750.000 CLP (Sistema Completo).

PIPELINE ACTUAL:
${JSON.stringify(datos, null, 2)}

Responde en español, máximo 200 palabras. Sé específico y accionable.
  `
  
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })
  
  return response.content[0].type === 'text' ? response.content[0].text : ''
}
```

## Output canónico del motor

```typescript
interface DecisionEngineOutput {
  timestamp: number
  leadesPriorizados: LeadPriorizado[]
  riesgos: Riesgo[]
  oportunidades: Oportunidad[]
  alertas: Alerta[]
  analisisIA?: string          // solo si ANTHROPIC_API_KEY disponible
  resumenEjecutivo: {
    totalCalientes: number
    dealsEnRiesgo: number
    oportunidadesDetectadas: number
    followupsVencidos: number
    ingresosPotenciales: number  // centavos
  }
}
```

## API route del motor

```
GET /api/decisions          → output completo del motor
GET /api/decisions/alerts   → solo alertas críticas
GET /api/decisions/priority → solo leads priorizados
```

## Reglas

- El motor corre en el servidor — nunca exponer lógica al cliente
- IA es opcional — el motor funciona 100% con reglas si no hay API key
- Cachear resultado del motor por 5 minutos — no recalcular en cada request
- Las recomendaciones de IA deben incluir contexto EI (precios, productos, lógica HAYDE)
- Ordenar siempre: crítico → alto → medio → bajo
