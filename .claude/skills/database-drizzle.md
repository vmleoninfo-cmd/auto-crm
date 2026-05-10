---
name: database-drizzle
description: Crear y modificar schemas Drizzle ORM, relaciones, índices y seed data para el CRM de Evoluciona Inteligente.
stack: [Drizzle ORM, SQLite, better-sqlite3]
---

## Propósito

Guía para todo trabajo con la base de datos: crear tablas nuevas, modificar schemas existentes, agregar índices, y poblar datos demo. Fuente de verdad: `src/db/schema.ts`.

## Estructura actual del schema

```typescript
// src/db/schema.ts — tablas existentes

contacts        // Leads/clientes con temperatura, score, fuente
deals           // Oportunidades de venta — valor en centavos
activities      // Interacciones (llamada/email/reunion/nota/follow-up)
pipeline_stages // Etapas configurables del pipeline
crm_settings    // Configuración key-value del sistema
```

## Patrón para nueva tabla

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const miTabla = sqliteTable('mi_tabla', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Relación — usar integer + references
  contactId: integer('contact_id').references(() => contacts.id, {
    onDelete: 'cascade'
  }),
  
  // Texto con enum — usar text con $type
  estado: text('estado', {
    enum: ['activo', 'inactivo', 'archivado']
  }).notNull().default('activo'),
  
  // Timestamps — integer (ms desde epoch)
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
  
  // Monetario — centavos (integer)
  valor: integer('valor').default(0),
})
```

## Aplicar cambios al schema

```bash
# Push del schema a la DB (desarrollo)
npm run db:push

# Verificar en la DB directamente
# SQLite en data/crm.db — se puede abrir con DB Browser for SQLite
```

## Patrón de queries Drizzle

```typescript
import { db } from '@/db'
import { contacts, deals } from '@/db/schema'
import { eq, and, desc, like, gte } from 'drizzle-orm'

// Listar con filtros
const rows = await db
  .select()
  .from(contacts)
  .where(and(
    eq(contacts.temperature, 'caliente'),
    gte(contacts.score, 70)
  ))
  .orderBy(desc(contacts.createdAt))
  .limit(50)

// Join
const dealsConContacto = await db
  .select({
    deal: deals,
    contactName: contacts.name,
  })
  .from(deals)
  .leftJoin(contacts, eq(deals.contactId, contacts.id))

// Insert
const [nuevo] = await db
  .insert(contacts)
  .values({ name: 'Ana', email: 'ana@example.com' })
  .returning()

// Update
await db
  .update(contacts)
  .set({ score: 85, updatedAt: Date.now() })
  .where(eq(contacts.id, id))

// Delete
await db.delete(contacts).where(eq(contacts.id, id))
```

## Tipos inferidos desde el schema

```typescript
// src/types/index.ts
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { contacts } from '@/db/schema'

export type Contact = InferSelectModel<typeof contacts>
export type NewContact = InferInsertModel<typeof contacts>
```

## Seed data (datos demo)

```typescript
// src/db/seed.ts — agregar datos de prueba
// Correr con: npm run seed
```

## Reglas

- Nunca modificar `data/crm.db` directamente — siempre via schema + `npm run db:push`
- Valores monetarios: siempre centavos (integer), nunca decimales
- Timestamps: siempre `Date.now()` (ms integer), nunca string de fecha
- `onDelete: 'cascade'` en relaciones donde el hijo no tiene sentido sin el padre
- Índices en columnas usadas frecuentemente en WHERE: `email`, `createdAt`, `status`
- Nunca usar `real` para dinero — solo `integer` (centavos)
