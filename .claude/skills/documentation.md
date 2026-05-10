---
name: documentation
description: Mantener el CLAUDE.md, README y documentación de módulos del CRM de Evoluciona Inteligente actualizados y útiles.
stack: [Markdown, TypeScript]
---

## Propósito

Define qué documentar, dónde, y cómo. La documentación del CRM es operativa — no académica. Si no ayuda a alguien a usar o extender el sistema, no va.

## Qué documentar (y dónde)

| Qué | Dónde | Cuándo |
|---|---|---|
| Stack, comandos, arquitectura general | `CLAUDE.md` (raíz) | Al cambiar el stack o agregar comandos |
| Cómo levantar el proyecto | `README.md` | Al cambiar el setup |
| Endpoints de una API route nueva | Tabla en `CLAUDE.md` § API Routes | Al crear cada ruta |
| Lógica de negocio EI | `CLAUDE.md` § Lógica EI | Al agregar reglas de negocio |
| Setup guide para nuevo developer | `SETUP_GUIDE.md` | Al complicarse el setup |
| Comandos Claude interactivos | `.claude/commands/[comando].md` | Al agregar un comando nuevo |

## Formato para documentar un módulo nuevo

```markdown
### Módulo: [Nombre]

**Qué hace:** Una línea.

**Archivos clave:**
- `src/app/api/[modulo]/route.ts` — endpoints
- `src/lib/[modulo].ts` — lógica de negocio
- `src/components/[modulo]/` — UI

**Endpoints:**

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/[modulo]` | GET | Listar con filtros |
| `/api/[modulo]` | POST | Crear nuevo |
| `/api/[modulo]/[id]` | PUT | Actualizar |
| `/api/[modulo]/[id]` | DELETE | Eliminar |

**Variables de entorno requeridas:** ninguna / `NOMBRE_VAR` — para qué sirve.

**Cómo testear:**
\```bash
curl -s http://localhost:3000/api/[modulo] | jq '.data | length'
\```
```

## Actualizar CLAUDE.md al agregar features

Secciones a actualizar:

```markdown
## Comandos interactivos disponibles
→ Agregar fila si hay comando nuevo

## Arquitectura → API Routes
→ Agregar fila por cada endpoint nuevo

## Reglas de código
→ Agregar si hay nueva convención importante

## Variables de entorno
→ Agregar si hay nueva env var requerida u opcional
```

## Formato de comentario en código

```typescript
// Solo comentar el POR QUÉ — no el QUÉ
// El qué ya lo explica el nombre de la función/variable

// MAL: calcular el score del contacto
function calcularScore(contact: Contact) { ... }

// BIEN — explica una decisión no obvia:
// Gumroad envía price en centavos USD — convertir a CLP antes de guardar
function parseGumroadPrice(priceUSD: number): number {
  return Math.round(priceUSD * TIPO_CAMBIO_CLP)
}

// Los timestamps vencidos se calculan con 14 días de gracia
// porque el ciclo de venta EI suele extenderse 2 semanas
const DIAS_INACTIVIDAD_ALERTA = 14
```

## Documentar decisiones de diseño importantes

```markdown
<!-- En el archivo relevante o en CLAUDE.md -->

### Decisión: SQLite en lugar de PostgreSQL
Razón: El CRM corre 100% local — no hay servidor externo. SQLite es suficiente
para el volumen de EI (<1000 leads). Si se necesita multi-usuario → migrar a PG.

### Decisión: Centavos para valores monetarios
Razón: Evita errores de punto flotante en CLP. Toda la UI formatea con formatCurrency().

### Decisión: Temperatura de lead vs Score
Temperatura es manual (frío/tibio/caliente) — el comercial la asigna.
Score es calculado automáticamente — refleja señales objetivas.
Los dos coexisten y se complementan.
```

## Reglas

- CLAUDE.md se actualiza en la misma sesión donde se agrega la feature — no después
- README.md es para nuevos developers — lenguaje simple, pasos claros
- No documentar lo obvio — los nombres de funciones y variables ya explican el qué
- Las decisiones de arquitectura no-obvias deben tener una explicación del por qué
- Al deprecar algo → marcarlo como deprecated con alternativa, no borrarlo sin aviso
