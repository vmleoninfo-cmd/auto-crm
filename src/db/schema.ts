import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const contacts = sqliteTable("contacts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  source: text("source").notNull().default("otro"),
  temperature: text("temperature").notNull().default("cold"),
  score: integer("score").notNull().default(0),
  notes: text("notes"),
  // Campos EI — adquisición y atribución
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  pais: text("pais"),
  leadMagnet: text("lead_magnet"),
  // Estado relacional EI (10 estados)
  estadoRelacion: text("estado_relacion").default("lead_nuevo"),
  segmento: text("segmento"),
  scoreRelacion: integer("score_relacion").default(0),
  canalPrincipal: text("canal_principal"),
  // Timestamps relacionales
  ultimaInteraccionAt: integer("ultima_interaccion_at", { mode: "timestamp" }),
  ultimaCompraAt: integer("ultima_compra_at", { mode: "timestamp" }),
  // Métricas de valor
  valorGenerado: integer("valor_generado").default(0),
  totalCompras: integer("total_compras").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const pipelineStages = sqliteTable("pipeline_stages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color").notNull().default("#64748b"),
  isWon: integer("is_won", { mode: "boolean" }).notNull().default(false),
  isLost: integer("is_lost", { mode: "boolean" }).notNull().default(false),
});

export const deals = sqliteTable("deals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  value: integer("value").notNull().default(0),
  stageId: text("stage_id")
    .notNull()
    .references(() => pipelineStages.id),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  expectedClose: integer("expected_close", { mode: "timestamp" }),
  probability: integer("probability").notNull().default(0),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const activities = sqliteTable("activities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(),
  description: text("description").notNull(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  dealId: text("deal_id").references(() => deals.id),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const crmSettings = sqliteTable("crm_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Compras / ventas registradas (Gumroad + manual)
export const purchases = sqliteTable("purchases", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  productoId: text("producto_id"),
  producto: text("producto").notNull(),
  tipoProducto: text("tipo_producto").notNull().default("guia"),
  monto: integer("monto").notNull().default(0),
  moneda: text("moneda").notNull().default("CLP"),
  plataforma: text("plataforma").notNull().default("gumroad"),
  estadoPago: text("estado_pago").notNull().default("completado"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  margenEstimado: integer("margen_estimado"),
  costoCampana: integer("costo_campana"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Piezas de contenido de marketing
export const content = sqliteTable("content", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  plataforma: text("plataforma").notNull(),
  tipo: text("tipo").notNull(),
  formato: text("formato"),
  titulo: text("titulo").notNull(),
  hook: text("hook"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  productoId: text("producto_id"),
  objetivo: text("objetivo"),
  estado: text("estado").notNull().default("borrador"),
  publicadoAt: integer("publicado_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Eventos de contenido (clicks, views) atribuidos a un lead
export const contentEvents = sqliteTable("content_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contentId: text("content_id")
    .notNull()
    .references(() => content.id),
  contactId: text("contact_id").references(() => contacts.id),
  tipo: text("tipo").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Decisiones estratégicas del motor IA
export const decisions = sqliteTable("decisions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tipo: text("tipo").notNull(),
  prioridad: text("prioridad").notNull().default("media"),
  impacto: text("impacto"),
  entidad: text("entidad"),
  entidadId: text("entidad_id"),
  accion: text("accion").notNull(),
  estado: text("estado").notNull().default("pendiente"),
  responsable: text("responsable").notNull().default("humano"),
  plazo: integer("plazo", { mode: "timestamp" }),
  impactoGenerado: text("impacto_generado"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  ejecutadaAt: integer("ejecutada_at", { mode: "timestamp" }),
});

// Tareas operativas generadas desde decisions o manualmente
export const tasks = sqliteTable("tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  decisionId: text("decision_id").references(() => decisions.id),
  origenModulo: text("origen_modulo"),
  tipo: text("tipo").notNull().default("operativa"),
  prioridad: text("prioridad").notNull().default("media"),
  impacto: text("impacto"),
  entidadTipo: text("entidad_tipo"),
  entidadId: text("entidad_id"),
  titulo: text("titulo").notNull(),
  accion: text("accion").notNull(),
  responsable: text("responsable").notNull().default("humano"),
  estado: text("estado").notNull().default("pendiente"),
  fechaLimite: integer("fecha_limite", { mode: "timestamp" }),
  fechaEjecucion: integer("fecha_ejecucion", { mode: "timestamp" }),
  impactoGenerado: text("impacto_generado"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Registro de automatizaciones ejecutadas
export const automationLogs = sqliteTable("automation_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  tipo: text("tipo").notNull(),
  canal: text("canal").notNull().default("email"),
  estado: text("estado").notNull().default("enviado"),
  payload: text("payload"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
