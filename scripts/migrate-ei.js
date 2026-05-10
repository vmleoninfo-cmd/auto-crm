// Migración EI — extiende schema base con los 7 módulos
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "../data/crm.db"));

db.pragma("foreign_keys = OFF");

const migrations = [
  // --- contacts: campos EI ---
  `ALTER TABLE contacts ADD COLUMN utm_source TEXT`,
  `ALTER TABLE contacts ADD COLUMN utm_medium TEXT`,
  `ALTER TABLE contacts ADD COLUMN utm_campaign TEXT`,
  `ALTER TABLE contacts ADD COLUMN utm_content TEXT`,
  `ALTER TABLE contacts ADD COLUMN pais TEXT`,
  `ALTER TABLE contacts ADD COLUMN lead_magnet TEXT`,
  `ALTER TABLE contacts ADD COLUMN estado_relacion TEXT DEFAULT 'lead_nuevo'`,
  `ALTER TABLE contacts ADD COLUMN segmento TEXT`,
  `ALTER TABLE contacts ADD COLUMN score_relacion INTEGER DEFAULT 0`,
  `ALTER TABLE contacts ADD COLUMN canal_principal TEXT`,
  `ALTER TABLE contacts ADD COLUMN ultima_interaccion_at INTEGER`,
  `ALTER TABLE contacts ADD COLUMN ultima_compra_at INTEGER`,
  `ALTER TABLE contacts ADD COLUMN valor_generado INTEGER DEFAULT 0`,
  `ALTER TABLE contacts ADD COLUMN total_compras INTEGER DEFAULT 0`,

  // --- purchases ---
  `CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    producto_id TEXT,
    producto TEXT NOT NULL,
    tipo_producto TEXT NOT NULL DEFAULT 'guia',
    monto INTEGER NOT NULL DEFAULT 0,
    moneda TEXT NOT NULL DEFAULT 'CLP',
    plataforma TEXT NOT NULL DEFAULT 'gumroad',
    estado_pago TEXT NOT NULL DEFAULT 'completado',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    margen_estimado INTEGER,
    costo_campana INTEGER,
    created_at INTEGER NOT NULL
  )`,

  // --- content ---
  `CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY,
    plataforma TEXT NOT NULL,
    tipo TEXT NOT NULL,
    formato TEXT,
    titulo TEXT NOT NULL,
    hook TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    producto_id TEXT,
    objetivo TEXT,
    estado TEXT NOT NULL DEFAULT 'borrador',
    publicado_at INTEGER,
    created_at INTEGER NOT NULL
  )`,

  // --- content_events ---
  `CREATE TABLE IF NOT EXISTS content_events (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES content(id),
    contact_id TEXT REFERENCES contacts(id),
    tipo TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,

  // --- decisions ---
  `CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    prioridad TEXT NOT NULL DEFAULT 'media',
    impacto TEXT,
    entidad TEXT,
    entidad_id TEXT,
    accion TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    responsable TEXT NOT NULL DEFAULT 'humano',
    plazo INTEGER,
    impacto_generado TEXT,
    created_at INTEGER NOT NULL,
    ejecutada_at INTEGER
  )`,

  // --- tasks ---
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    decision_id TEXT REFERENCES decisions(id),
    origen_modulo TEXT,
    tipo TEXT NOT NULL DEFAULT 'operativa',
    prioridad TEXT NOT NULL DEFAULT 'media',
    impacto TEXT,
    entidad_tipo TEXT,
    entidad_id TEXT,
    titulo TEXT NOT NULL,
    accion TEXT NOT NULL,
    responsable TEXT NOT NULL DEFAULT 'humano',
    estado TEXT NOT NULL DEFAULT 'pendiente',
    fecha_limite INTEGER,
    fecha_ejecucion INTEGER,
    impacto_generado TEXT,
    created_at INTEGER NOT NULL
  )`,

  // --- automation_logs ---
  `CREATE TABLE IF NOT EXISTS automation_logs (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    tipo TEXT NOT NULL,
    canal TEXT NOT NULL DEFAULT 'email',
    estado TEXT NOT NULL DEFAULT 'enviado',
    payload TEXT,
    created_at INTEGER NOT NULL
  )`,
];

let applied = 0;
let skipped = 0;

for (const sql of migrations) {
  try {
    db.prepare(sql).run();
    applied++;
  } catch (err) {
    if (err.message.includes("duplicate column name") || err.message.includes("already exists")) {
      skipped++;
    } else {
      console.error("ERROR:", err.message);
      console.error("SQL:", sql.slice(0, 80));
      process.exit(1);
    }
  }
}

db.pragma("foreign_keys = ON");
db.close();

console.log(`Migración completa: ${applied} aplicadas, ${skipped} ya existían.`);
