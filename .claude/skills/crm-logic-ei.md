---
name: crm-logic-ei
description: Lógica de negocio específica de Evoluciona Inteligente. Lead scoring, estados, pipeline EI, flujo lead→propuesta→cierre. Invocar antes de implementar cualquier lógica comercial.
stack: [TypeScript, Drizzle ORM, src/lib/scoring.ts]
---

## Propósito

Traduce el modelo comercial de Evoluciona Inteligente al CRM. Toda lógica de negocio EI vive en `src/lib/` — nunca en componentes ni API routes directamente.

## Modelo de leads EI

### Temperatura (contact.temperature)
```
frio    → primer contacto, sin señal de intención clara
tibio   → respondió, mostró interés, pidió info
caliente → quiere propuesta / está en conversación activa
```

### Fuentes de leads EI
```
instagram_organico    → llegó por contenido orgánico
instagram_dm          → escribió por DM directamente
referido              → lo mandó un cliente existente
formulario_web        → completó formulario en sitio
gumroad               → compró un producto digital
evento_live           → fue a un webinar / live
cold_outreach         → contacto proactivo EI
```

### Scoring EI (adaptar src/lib/scoring.ts)

```typescript
// src/lib/scoring.ts — lógica de score 0-100
export function scoreContactEI(contact: Contact): number {
  let score = 0
  
  // Fuente (hasta 30 pts)
  const fuenteScore: Record<string, number> = {
    referido: 30,
    gumroad: 25,          // ya compró — alta intención
    formulario_web: 20,
    instagram_organico: 15,
    instagram_dm: 15,
    evento_live: 20,
    cold_outreach: 5,
  }
  score += fuenteScore[contact.source] ?? 0
  
  // Temperatura (hasta 30 pts)
  if (contact.temperature === 'caliente') score += 30
  else if (contact.temperature === 'tibio') score += 15
  
  // Actividad reciente (hasta 20 pts)
  if (contact.lastContactedAt) {
    const diasDesdeContacto = (Date.now() - contact.lastContactedAt) / 86400000
    if (diasDesdeContacto <= 3) score += 20
    else if (diasDesdeContacto <= 7) score += 10
    else if (diasDesdeContacto <= 14) score += 5
  }
  
  // Tiene deal abierto (hasta 20 pts)
  if (contact.hasOpenDeal) score += 20
  
  return Math.min(score, 100)
}
```

## Pipeline de ventas EI

### Etapas del pipeline
```
1. nuevo_lead         → entró al sistema, sin gestión aún
2. primer_contacto    → se le escribió / respondió
3. conversacion       → hay diálogo activo
4. propuesta_enviada  → recibió propuesta (PDF o HTML)
5. seguimiento        → propuesta enviada, esperando respuesta
6. negociacion        → está evaluando, hay preguntas
7. cerrado_ganado     → confirmó y pagó
8. cerrado_perdido    → descartado / dijo que no
```

### Transiciones válidas
```typescript
// src/lib/pipeline-transitions.ts
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  nuevo_lead: ['primer_contacto', 'cerrado_perdido'],
  primer_contacto: ['conversacion', 'cerrado_perdido'],
  conversacion: ['propuesta_enviada', 'cerrado_perdido'],
  propuesta_enviada: ['seguimiento', 'negociacion', 'cerrado_ganado', 'cerrado_perdido'],
  seguimiento: ['negociacion', 'cerrado_ganado', 'cerrado_perdido'],
  negociacion: ['cerrado_ganado', 'cerrado_perdido'],
}
```

## Productos EI (deals)

```typescript
// Valores en centavos CLP
const PRODUCTOS_EI = {
  'fase_1_identidad': {
    nombre: 'Sistema de Identidad — Fase 1',
    valor: 45000000,   // $450.000 CLP en centavos
    duracion: '3 semanas',
  },
  'sistema_completo': {
    nombre: 'Sistema Completo — Fase 1 + 2',
    valor: 75000000,   // $750.000 CLP en centavos
    duracion: '7 semanas',
  },
  'diagnostico': {
    nombre: 'Diagnóstico Estratégico HAYDE',
    valor: 0,          // entry point — precio a definir
    duracion: '1 sesión',
  },
}
```

## Actividades EI

```typescript
// Tipos de actividad y cuándo registrarlas
type ActivityType = 
  | 'llamada'       // llamada o video call
  | 'email'         // correo enviado o recibido
  | 'dm'            // DM de Instagram
  | 'reunion'       // sesión de trabajo
  | 'nota'          // nota interna sin acción
  | 'propuesta'     // se envió propuesta
  | 'follow_up'     // seguimiento programado
```

## Automatizaciones de estado

```typescript
// src/lib/automation.ts
// Acciones automáticas en cambios de estado

onEtapaCambia('propuesta_enviada', async (deal) => {
  // Crear follow-up automático a 3 días
  await crearActividad({
    dealId: deal.id,
    type: 'follow_up',
    scheduledAt: Date.now() + 3 * 86400000,
    notes: 'Follow-up propuesta enviada',
  })
})

onEtapaCambia('cerrado_ganado', async (deal) => {
  // Registrar ingreso + marcar contacto como cliente
  await actualizarContacto(deal.contactId, { 
    temperature: 'caliente',
    isCliente: true 
  })
})
```

## Reglas de negocio EI

- Precio mínimo: $750.000 CLP — nunca proponer menos en deals
- Un contacto puede tener múltiples deals en etapas distintas
- Follow-up obligatorio a los 3 días de enviar propuesta
- Lead sin actividad en 14 días → alerta automática
- Leads de `referido` y `gumroad` tienen prioridad alta por defecto
- Nunca marcar `cerrado_perdido` sin nota de razón
