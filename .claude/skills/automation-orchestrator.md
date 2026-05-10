---
name: automation-orchestrator
description: Triggers, automatizaciones por estado, follow-ups automáticos y logs de ejecución para el CRM de Evoluciona Inteligente.
stack: [TypeScript, Drizzle ORM, Next.js API routes]
---

## Propósito

Define cómo el CRM ejecuta acciones automáticas cuando cambian los estados de leads y deals. Evita que las tareas de seguimiento dependan de la memoria manual.

## Modelo de automatización

```
TRIGGER (evento) → CONDICIÓN (si aplica) → ACCIÓN (qué ejecutar) → LOG (resultado)
```

## Triggers disponibles

```typescript
// src/lib/automation.ts

type Trigger =
  | 'contact.created'              // nuevo lead entró al sistema
  | 'contact.temperature.changed'  // frio → tibio → caliente
  | 'deal.stage.changed'           // movimiento en el pipeline
  | 'deal.created'                 // nuevo deal abierto
  | 'activity.completed'           // actividad marcada como hecha
  | 'followup.overdue'             // follow-up vencido sin completar
  | 'contact.inactive'             // sin actividad en N días
```

## Automatizaciones EI configuradas

```typescript
// src/lib/automations/index.ts

const AUTOMATIONS: Automation[] = [
  {
    trigger: 'deal.stage.changed',
    condition: (ctx) => ctx.newStage === 'propuesta_enviada',
    action: async (ctx) => {
      // Follow-up automático a 3 días
      await crearFollowUp({
        contactId: ctx.deal.contactId,
        dealId: ctx.deal.id,
        scheduledAt: Date.now() + 3 * 86400000,
        notes: 'Seguimiento propuesta — ¿recibiste el documento?',
      })
    },
    label: 'Follow-up propuesta enviada',
  },
  
  {
    trigger: 'contact.created',
    condition: (ctx) => ctx.contact.source === 'gumroad',
    action: async (ctx) => {
      // Lead de Gumroad → follow-up inmediato
      await crearFollowUp({
        contactId: ctx.contact.id,
        scheduledAt: Date.now() + 1 * 86400000, // 24hs
        notes: 'Dar bienvenida y preguntar qué busca después de la compra',
      })
    },
    label: 'Bienvenida comprador Gumroad',
  },
  
  {
    trigger: 'contact.inactive',
    condition: (ctx) => ctx.daysSinceContact >= 14,
    action: async (ctx) => {
      // Crear alerta interna
      await crearAlerta({
        contactId: ctx.contact.id,
        tipo: 'inactividad',
        mensaje: `Sin contacto hace ${ctx.daysSinceContact} días`,
        prioridad: 'media',
      })
    },
    label: 'Alerta lead inactivo 14 días',
  },
  
  {
    trigger: 'deal.stage.changed',
    condition: (ctx) => ctx.newStage === 'cerrado_ganado',
    action: async (ctx) => {
      // Marcar contacto como cliente + actualizar temperatura
      await db.update(contacts)
        .set({ temperature: 'caliente', isCliente: true })
        .where(eq(contacts.id, ctx.deal.contactId))
    },
    label: 'Marcar cliente al cerrar ganado',
  },
]
```

## Ejecutar automatización

```typescript
// src/lib/automation.ts
export async function ejecutarAutomaciones(
  trigger: Trigger,
  context: AutomationContext
) {
  const automations = AUTOMATIONS.filter(a => a.trigger === trigger)
  
  for (const automation of automations) {
    if (!automation.condition || automation.condition(context)) {
      try {
        await automation.action(context)
        await logAutomation({ trigger, label: automation.label, status: 'ok' })
      } catch (error) {
        await logAutomation({
          trigger,
          label: automation.label,
          status: 'error',
          error: String(error),
        })
      }
    }
  }
}

// Llamar desde API routes al cambiar estado:
// PUT /api/deals/[id] → después de actualizar stage:
await ejecutarAutomaciones('deal.stage.changed', {
  deal: updatedDeal,
  previousStage: oldStage,
  newStage: updatedDeal.stage,
})
```

## Tabla de logs

```typescript
// Agregar al schema:
export const automationLogs = sqliteTable('automation_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trigger: text('trigger').notNull(),
  label: text('label').notNull(),
  status: text('status', { enum: ['ok', 'error', 'skipped'] }).notNull(),
  error: text('error'),
  context: text('context'),  // JSON stringificado
  executedAt: integer('executed_at').notNull().$defaultFn(() => Date.now()),
})
```

## Follow-ups y alertas

```typescript
// src/lib/followups.ts
export async function getFollowUpsHoy() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)
  
  return db.select().from(activities)
    .where(and(
      eq(activities.type, 'follow_up'),
      isNull(activities.completedAt),
      gte(activities.scheduledAt, hoy.getTime()),
      lt(activities.scheduledAt, manana.getTime()),
    ))
    .orderBy(asc(activities.scheduledAt))
}
```

## Reglas

- Toda automatización debe loguearse — éxito y error
- Las automatizaciones NO bloquean la operación principal (ejecutar en background o después del return)
- Máximo 1 follow-up activo por deal en la misma etapa
- No crear follow-ups duplicados si ya existe uno pendiente
- Los logs de automatización se retienen 90 días máximo
