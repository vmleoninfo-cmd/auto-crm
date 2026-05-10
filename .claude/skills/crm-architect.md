---
name: crm-architect
description: Arquitectura del proyecto auto-crm para Evoluciona Inteligente. Referencia obligatoria antes de crear cualquier módulo nuevo o modificar la estructura.
stack: [Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, shadcn/ui, SQLite, Drizzle ORM]
---

## Propósito

Define la arquitectura del CRM y las convenciones que todo el código debe seguir. Invocar antes de agregar módulos, páginas, o rutas API nuevas.

## Stack oficial

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 15 (App Router) | NO usar Pages Router |
| Lenguaje | TypeScript strict | `strict: true` en tsconfig |
| Estilos | Tailwind CSS v4 | Config via CSS, NO tailwind.config.ts |
| Componentes | shadcn/ui + Lucide React | NO emojis como íconos |
| ORM | Drizzle ORM | Schema en `src/db/schema.ts` |
| Base de datos | SQLite local | Archivo en `data/crm.db` |
| Drag & Drop | @dnd-kit | NO react-beautiful-dnd |
| Forms | react-hook-form + zod | Validación obligatoria |
| Fechas | date-fns | NO moment.js |
| IA | @anthropic-ai/sdk | Solo en server-side |

## Estructura de directorios

```
src/
├── app/                    ← Páginas y API routes (App Router)
│   ├── api/               ← API routes — un subdirectorio por entidad
│   │   ├── contacts/
│   │   ├── deals/
│   │   ├── activities/
│   │   └── [nueva-entidad]/
│   ├── contacts/          ← Página de contactos
│   ├── deals/             ← Página de deals
│   ├── pipeline/          ← Vista kanban
│   └── settings/          ← Configuración
├── components/            ← Componentes organizados por feature
│   ├── contacts/
│   ├── deals/
│   ├── dashboard/
│   ├── pipeline/
│   ├── layout/            ← Navegación, sidebar, shell
│   ├── shared/            ← Componentes reutilizables
│   └── ui/                ← shadcn/ui (no modificar directamente)
├── db/                    ← Base de datos
│   ├── schema.ts          ← Schema Drizzle (fuente de verdad)
│   ├── index.ts           ← Cliente DB singleton
│   └── seed.ts            ← Datos demo
├── lib/                   ← Utilidades del servidor
│   ├── claude.ts          ← Cliente Anthropic
│   ├── scoring.ts         ← Lógica de scoring de leads
│   └── constants.ts       ← Constantes globales
└── types/                 ← TypeScript types
    └── index.ts           ← Tipos de entidades CRM
```

## Convenciones de código

```typescript
// Alias de importación — siempre usar @/*
import { db } from '@/db'
import { contacts } from '@/db/schema'
import type { Contact } from '@/types'

// Valores monetarios — siempre en centavos (integer)
const price = 450000 * 100  // $450.000 CLP en centavos
formatCurrency(price)        // usar helper para mostrar

// Fechas — almacenar como timestamps integer en SQLite
const now = Date.now()       // timestamp ms
format(new Date(timestamp), 'dd/MM/yyyy', { locale: es })

// Max ~300 líneas por componente
// Si crece más → dividir en sub-componentes
```

## Patrón de nueva API route

```
src/app/api/[entidad]/route.ts       ← GET (lista) + POST (crear)
src/app/api/[entidad]/[id]/route.ts  ← GET + PUT + DELETE individual
```

## Patrón de nuevo módulo de página

```
src/app/[modulo]/page.tsx            ← Server component (fetch inicial)
src/components/[modulo]/[Modulo]List.tsx    ← Client component con estado
src/components/[modulo]/[Modulo]Form.tsx    ← Formulario con react-hook-form
src/components/[modulo]/[Modulo]Card.tsx    ← Card individual
```

## Reglas arquitectónicas

- Todo fetch de datos en Server Components — pasar como props a Client Components
- Lógica de negocio en `src/lib/` — nunca en componentes
- Validación zod tanto en frontend (form) como en API route
- Idioma UI: español por defecto
- IA (Claude) solo en server-side — nunca exponer API key al cliente
- SQLite es local — no hay conexión externa que mantener
