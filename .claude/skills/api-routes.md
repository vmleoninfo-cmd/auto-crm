---
name: api-routes
description: Construir endpoints Next.js App Router para el CRM. Patrón obligatorio para toda API route nueva — validación, errores, respuesta tipada.
stack: [Next.js App Router, TypeScript, Zod, Drizzle ORM]
---

## Propósito

Define el patrón estándar para crear y mantener API routes en `src/app/api/`. Toda route debe seguir esta estructura — sin excepciones.

## Estructura de archivos

```
src/app/api/
├── contacts/
│   ├── route.ts          ← GET (lista) + POST (crear)
│   └── [id]/
│       └── route.ts      ← GET + PUT + DELETE individual
├── [nueva-entidad]/
│   ├── route.ts
│   └── [id]/route.ts
```

## Patrón: route.ts (lista + crear)

```typescript
// src/app/api/[entidad]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { entidades } from '@/db/schema'

// Schema de validación
const createSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email().optional(),
  valor: z.number().int().min(0).optional(), // centavos
})

// GET /api/entidades — lista con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    const rows = await db.select().from(entidades)
    // aplicar filtros según searchParams
    
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[GET /api/entidades]', error)
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    )
  }
}

// POST /api/entidades — crear nuevo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    
    const [nuevo] = await db
      .insert(entidades)
      .values({ ...parsed.data, createdAt: Date.now() })
      .returning()
    
    return NextResponse.json({ data: nuevo }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/entidades]', error)
    return NextResponse.json(
      { error: 'Error al crear' },
      { status: 500 }
    )
  }
}
```

## Patrón: [id]/route.ts (individual)

```typescript
// src/app/api/[entidad]/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { entidades } from '@/db/schema'

type Params = { params: Promise<{ id: string }> }

// GET /api/entidades/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const [row] = await db.select().from(entidades).where(eq(entidades.id, +id))
  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ data: row })
}

// PUT /api/entidades/:id
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  // validar con zod updateSchema
  const [updated] = await db
    .update(entidades)
    .set({ ...body, updatedAt: Date.now() })
    .where(eq(entidades.id, +id))
    .returning()
  if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

// DELETE /api/entidades/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.delete(entidades).where(eq(entidades.id, +id))
  return NextResponse.json({ success: true })
}
```

## Formato de respuesta estándar

```typescript
// Éxito — lista
{ data: T[] }

// Éxito — individual
{ data: T }

// Éxito — sin datos
{ success: true }

// Error de validación (400)
{ error: 'Datos inválidos', details: ZodError }

// No encontrado (404)
{ error: 'No encontrado' }

// Error servidor (500)
{ error: 'Mensaje descriptivo' }
```

## Reglas

- Siempre `try/catch` con `console.error` y status 500 en el catch
- Siempre validar con zod antes de tocar la DB
- Nunca retornar datos sensibles (passwords, keys) en la response
- El `id` de URL siempre es string — convertir con `+id` para integer
- Loguear errores con prefijo del endpoint: `[GET /api/contacts]`
- Nunca lógica de negocio en la route — delegarla a `src/lib/`
