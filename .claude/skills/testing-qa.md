---
name: testing-qa
description: Testing de API routes, lógica de negocio y validaciones para el CRM de Evoluciona Inteligente. Patrones obligatorios antes de hacer merge de cualquier feature.
stack: [TypeScript, Next.js, better-sqlite3, Zod]
---

## Propósito

Define cómo testear el CRM antes de que algo llegue a producción. Aplica desde el primer endpoint nuevo — no al final del desarrollo.

## Qué testear (en orden de prioridad)

```
1. API routes — endpoints críticos (contacts, deals, webhook Gumroad)
2. Lógica de negocio — scoring, priorización, transiciones de pipeline
3. Validaciones Zod — que los schemas rechacen datos inválidos
4. Automatizaciones — que los triggers disparen las acciones correctas
5. Cálculos de métricas — KPIs del dashboard
```

## Patrón de test para API route

```typescript
// Testear con curl desde Claude Code terminal

// GET lista
curl -s http://localhost:3000/api/contacts | jq '.data | length'

// POST crear — caso válido
curl -s -X POST http://localhost:3000/api/contacts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test EI","email":"test@evoluciona.com","source":"instagram_organico"}' \
  | jq '.data.id'

// POST crear — caso inválido (debe dar 400)
curl -s -X POST http://localhost:3000/api/contacts \
  -H 'Content-Type: application/json' \
  -d '{"email":"no-es-email"}' \
  | jq '.error'

// PUT actualizar
curl -s -X PUT http://localhost:3000/api/contacts/1 \
  -H 'Content-Type: application/json' \
  -d '{"temperature":"caliente"}' \
  | jq '.data.temperature'

// DELETE
curl -s -X DELETE http://localhost:3000/api/contacts/999 \
  | jq '.error'  // debe decir "No encontrado"
```

## Checklist pre-merge por feature

### API route nueva
- [ ] GET responde 200 con `{ data: [] }` vacío cuando no hay registros
- [ ] POST con datos válidos crea el registro y retorna 201 con `{ data: {...} }`
- [ ] POST con datos inválidos retorna 400 con `{ error, details }`
- [ ] PUT actualiza solo los campos enviados — no borra los otros
- [ ] DELETE retorna 200 `{ success: true }` aunque el ID no exista (idempotente)
- [ ] GET /[id] con ID inexistente retorna 404

### Lógica de scoring
- [ ] Lead de `referido` siempre score >= 30
- [ ] Lead de `gumroad` con temperatura caliente tiene score >= 55
- [ ] Score no supera 100 en ningún caso
- [ ] Lead sin `lastContactedAt` no rompe el cálculo

### Pipeline EI
- [ ] Solo se permiten transiciones válidas entre etapas
- [ ] Al mover a `propuesta_enviada` → se crea follow-up a 3 días
- [ ] Al mover a `cerrado_ganado` → contacto queda marcado como cliente

### Webhook Gumroad
- [ ] Contacto nuevo se crea si el email no existe
- [ ] Contacto existente se actualiza (no se duplica)
- [ ] Se registra actividad tipo `compra_gumroad`
- [ ] Temperatura del contacto sube a `caliente`

## Casos edge críticos para EI

```typescript
// Casos que deben funcionar sin error:

// 1. Lead con mismo email llega dos veces (Gumroad doble click)
// → debe actualizar, no duplicar

// 2. Deal con valor 0 (diagnóstico gratuito)
// → válido, no es un error

// 3. Contacto sin email (llegó por DM)
// → debe poder crearse sin email (campo opcional)

// 4. Score de lead recién creado sin ninguna actividad
// → score calculable, no NaN ni null

// 5. Pipeline vacío (sin deals)
// → dashboard muestra 0s, no errores
```

## Verificación de automatizaciones

```typescript
// Testear que el trigger dispara la acción:
// 1. Crear deal en etapa 'conversacion'
// 2. Moverlo a 'propuesta_enviada'
// 3. Verificar que se creó un follow-up:

curl -s "http://localhost:3000/api/followups" | jq '.data[] | select(.type == "follow_up")'
```

## Reglas

- Nunca mergear código con errores TypeScript (tsc --noEmit debe pasar)
- Todo endpoint nuevo necesita al menos los 4 casos de curl de arriba
- Los casos edge de EI son no-negociables — testearlos siempre
- Si un test falla → fix antes de continuar, no patch
- Documentar casos edge raros en comentarios en el código
