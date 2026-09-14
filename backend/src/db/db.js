'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

// Todo lo esencial se persiste en un archivo SQLite dentro del contenedor.
// La carpeta se monta como volumen para que los datos sobrevivan a reinicios.
const DATA_DIR = process.env.SQLITE_DIR || path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'chibchombia.sqlite');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS platos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('Entrada', 'Plato Principal', 'Bebida', 'Postre')),
    descripcion TEXT NOT NULL DEFAULT '',
    precio INTEGER NOT NULL CHECK (precio >= 0),
    imagen TEXT NOT NULL DEFAULT '',
    disponible INTEGER NOT NULL DEFAULT 1
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    cliente_direccion TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendido')),
    total INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    atendido_en TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS pedido_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    plato_id INTEGER REFERENCES platos(id) ON DELETE SET NULL,
    nombre_plato TEXT NOT NULL,
    precio_unitario INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_nombre);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);`);

module.exports = db;
