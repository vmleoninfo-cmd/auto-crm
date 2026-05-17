import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "crm.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function createDatabase(): Database.Database {
  const db = new Database(DB_PATH, { timeout: 15000 });

  // Set pragmas individually with error handling
  try {
    db.pragma("journal_mode = WAL");
  } catch {
    // WAL mode might already be set by another process
  }

  try {
    db.pragma("busy_timeout = 15000");
  } catch {
    // Ignore if can't set
  }

  try {
    db.pragma("foreign_keys = ON");
  } catch {
    // Ignore
  }

  return db;
}

function initTables(db: Database.Database): void {
  // Each CREATE TABLE is its own statement to minimize lock time
  const tables = [
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      source TEXT NOT NULL DEFAULT 'otro',
      temperature TEXT NOT NULL DEFAULT 'cold',
      score INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      pais TEXT,
      lead_magnet TEXT,
      estado_relacion TEXT DEFAULT 'lead_nuevo',
      segmento TEXT,
      score_relacion INTEGER DEFAULT 0,
      canal_principal TEXT,
      ultima_interaccion_at INTEGER,
      ultima_compra_at INTEGER,
      valor_generado INTEGER DEFAULT 0,
      total_compras INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS pipeline_stages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      color TEXT NOT NULL DEFAULT '#64748b',
      is_won INTEGER NOT NULL DEFAULT 0,
      is_lost INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      stage_id TEXT NOT NULL REFERENCES pipeline_stages(id),
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      expected_close INTEGER,
      probability INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      deal_id TEXT REFERENCES deals(id),
      scheduled_at INTEGER,
      completed_at INTEGER,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS crm_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
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
    `CREATE TABLE IF NOT EXISTS content_events (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL REFERENCES content(id),
      contact_id TEXT REFERENCES contacts(id),
      tipo TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`,
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

  for (const sql of tables) {
    try {
      db.exec(sql);
    } catch {
      // Table might already exist or DB is locked - safe to continue
    }
  }
}

function migrateColumns(db: Database.Database): void {
  // Add columns that may be missing from older DB versions
  const migrations = [
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
  ];
  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists — safe to ignore
    }
  }
}

function seedDefaultStages(db: Database.Database): void {
  try {
    const result = db
      .prepare("SELECT COUNT(*) as count FROM pipeline_stages")
      .get() as { count: number } | undefined;

    if (!result || result.count > 0) return;

    const defaultStages = [
      { name: "Prospecto", order: 1, color: "#64748b", isWon: 0, isLost: 0 },
      { name: "Contactado", order: 2, color: "#2563eb", isWon: 0, isLost: 0 },
      { name: "Propuesta", order: 3, color: "#8b5cf6", isWon: 0, isLost: 0 },
      { name: "Negociacion", order: 4, color: "#ea580c", isWon: 0, isLost: 0 },
      { name: "Cerrado Ganado", order: 5, color: "#16a34a", isWon: 1, isLost: 0 },
      { name: "Cerrado Perdido", order: 6, color: "#dc2626", isWon: 0, isLost: 1 },
    ];

    const insert = db.prepare(
      `INSERT OR IGNORE INTO pipeline_stages (id, name, "order", color, is_won, is_lost) VALUES (?, ?, ?, ?, ?, ?)`
    );

    const seedAll = db.transaction(() => {
      for (const stage of defaultStages) {
        insert.run(
          crypto.randomUUID(),
          stage.name,
          stage.order,
          stage.color,
          stage.isWon,
          stage.isLost
        );
      }
    });

    seedAll();
  } catch {
    // Seeding can fail if another worker is doing it — that's fine
  }
}

const sqlite = createDatabase();
initTables(sqlite);
migrateColumns(sqlite);
seedDefaultStages(sqlite);

export const db = drizzle(sqlite, { schema });
