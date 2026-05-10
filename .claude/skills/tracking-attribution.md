---
name: tracking-attribution
description: UTM tracking, atribución de leads a contenido/canal, y webhooks de Gumroad para conectar contenido con ventas en el CRM de EI.
stack: [Next.js API routes, Drizzle ORM, Gumroad webhooks]
---

## Propósito

Conecta el origen de cada lead con el contenido que lo generó. Permite saber qué canal, campaña o pieza de contenido produce leads y ventas reales para Evoluciona Inteligente.

## Modelo de atribución EI

```
CONTENIDO → UTM → LEAD → DEAL → VENTA
   ↑                              ↑
  source                    attribution
```

### Campos de atribución en contacts

```typescript
// Agregar al schema contacts:
utmSource: text('utm_source'),      // instagram, linkedin, email
utmMedium: text('utm_medium'),      // organic, story, reel, bio
utmCampaign: text('utm_campaign'),  // nombre de campaña EI
utmContent: text('utm_content'),    // pieza específica de contenido
utmTerm: text('utm_term'),          // keyword si aplica
referralUrl: text('referral_url'),  // URL completa de origen
landingPage: text('landing_page'),  // página donde llegó
```

## Captura de UTMs desde formularios web

```typescript
// src/lib/attribution.ts
export function extractUTMs(url: string): UTMData {
  const params = new URLSearchParams(new URL(url).search)
  return {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
    utmTerm: params.get('utm_term') ?? undefined,
    referralUrl: url,
  }
}

// En el webhook de formulario externo:
const utms = extractUTMs(request.headers.get('referer') ?? '')
await db.insert(contacts).values({ ...contactData, ...utms })
```

## Webhook Gumroad

```typescript
// src/app/api/webhook/gumroad/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { contacts, deals } from '@/db/schema'

export async function POST(request: NextRequest) {
  const body = await request.formData()  // Gumroad envía form-data
  
  const email = body.get('email') as string
  const productName = body.get('product_name') as string
  const salePrice = parseInt(body.get('price') as string) // centavos USD
  const permalink = body.get('permalink') as string
  
  // Buscar contacto existente o crear nuevo
  let [contact] = await db.select().from(contacts)
    .where(eq(contacts.email, email))
  
  if (!contact) {
    [contact] = await db.insert(contacts).values({
      name: body.get('full_name') as string,
      email,
      source: 'gumroad',
      temperature: 'tibio',
      utmSource: 'gumroad',
      utmCampaign: permalink,
      createdAt: Date.now(),
    }).returning()
  }
  
  // Registrar la compra como actividad
  await db.insert(activities).values({
    contactId: contact.id,
    type: 'compra_gumroad',
    notes: `Compró: ${productName}`,
    createdAt: Date.now(),
  })
  
  // Actualizar score del contacto (comprador tiene alta intención)
  await db.update(contacts)
    .set({ temperature: 'caliente', score: 75 })
    .where(eq(contacts.id, contact.id))
  
  return NextResponse.json({ received: true })
}
```

## Dashboard de atribución

```typescript
// src/lib/attribution-report.ts
export async function getAttributionReport() {
  // Leads por fuente
  const leadsBySource = await db
    .select({
      source: contacts.utmSource,
      count: sql<number>`count(*)`,
    })
    .from(contacts)
    .groupBy(contacts.utmSource)
  
  // Deals ganados por fuente (ROI por canal)
  const wonBySource = await db
    .select({
      source: contacts.utmSource,
      totalRevenue: sql<number>`sum(${deals.value})`,
      count: sql<number>`count(*)`,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .where(eq(deals.stage, 'cerrado_ganado'))
    .groupBy(contacts.utmSource)
  
  return { leadsBySource, wonBySource }
}
```

## Canales EI a trackear

| UTM Source | UTM Medium | Descripción |
|---|---|---|
| instagram | organic | Post orgánico |
| instagram | story | Story |
| instagram | reel | Reel |
| instagram | bio | Link en bio |
| email | newsletter | Email list |
| referido | social | Compartido por un cliente |
| gumroad | purchase | Compra directa |

## Reglas

- Nunca sobreescribir UTMs de un contacto existente — conservar la primera atribución
- Si llega un lead sin UTMs → fuente = `directo`
- Validar firma de webhook Gumroad antes de procesar (header `X-Gumroad-Signature`)
- Toda compra Gumroad debe crear o actualizar el contacto Y registrar actividad
- Los UTMs se capturan en el primer contacto — no en contactos subsiguientes
