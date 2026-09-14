'use strict';

const bcrypt = require('bcryptjs');
const db = require('./db');

const PLATOS_INICIALES = [
  {
    nombre: 'Ajiaco Santafereño',
    categoria: 'Plato Principal',
    descripcion: 'Sopa de tres papas con pollo, guascas, mazorca, alcaparras y crema de leche.',
    precio: 28000,
    imagen: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80'
  },
  {
    nombre: 'Bandeja Chibcha',
    categoria: 'Plato Principal',
    descripcion: 'Frijoles, arroz, carne asada, chicharrón, huevo, plátano, aguacate y arepa.',
    precio: 34000,
    imagen: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80'
  },
  {
    nombre: 'Mazorca Muisca',
    categoria: 'Entrada',
    descripcion: 'Mazorca asada al carbón bañada en mantequilla de hierbas y queso costeño.',
    precio: 12000,
    imagen: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80'
  },
  {
    nombre: 'Empanadas de Hogao',
    categoria: 'Entrada',
    descripcion: 'Trío de empanadas de maíz rellenas de papa y carne, con ají casero.',
    precio: 14000,
    imagen: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80'
  },
  {
    nombre: 'Chicha de Maíz',
    categoria: 'Bebida',
    descripcion: 'Bebida fermentada de maíz morado, receta ancestral muisca, servida fría.',
    precio: 8000,
    imagen: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80'
  },
  {
    nombre: 'Limonada de Coco',
    categoria: 'Bebida',
    descripcion: 'Limonada natural batida con coco fresco y un toque de hierbabuena.',
    precio: 9000,
    imagen: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80'
  },
  {
    nombre: 'Obleas de El Dorado',
    categoria: 'Postre',
    descripcion: 'Obleas crocantes con arequipe, queso y hojuelas de oro comestible.',
    precio: 10000,
    imagen: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80'
  },
  {
    nombre: 'Postre de Natas',
    categoria: 'Postre',
    descripcion: 'Postre tradicional andino de leche, canela y panela.',
    precio: 11000,
    imagen: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80'
  }
];

function sembrarPlatos() {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM platos').get();
  if (total > 0) return;

  const insertar = db.prepare(`
    INSERT INTO platos (nombre, categoria, descripcion, precio, imagen)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const p of PLATOS_INICIALES) {
    insertar.run(p.nombre, p.categoria, p.descripcion, p.precio, p.imagen);
  }
  console.log(`Menú inicial cargado (${PLATOS_INICIALES.length} platos).`);
}

function sembrarUsuarioAdmin() {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get();
  if (total > 0) return;

  const usuario = process.env.ADMIN_USER || 'admin';
  const passwordPlano = process.env.ADMIN_PASSWORD || 'chibchombia2024';
  const nombre = process.env.ADMIN_NOMBRE || 'Administrador';
  const hash = bcrypt.hashSync(passwordPlano, 10);

  db.prepare(`
    INSERT INTO usuarios (usuario, nombre, password_hash)
    VALUES (?, ?, ?)
  `).run(usuario, nombre, hash);

  console.log(`Usuario administrador creado -> usuario: "${usuario}"`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log('  (Contraseña por defecto: "chibchombia2024". Cámbiala con la variable ADMIN_PASSWORD.)');
  }
}

function ejecutarSeed() {
  sembrarPlatos();
  sembrarUsuarioAdmin();
}

if (require.main === module) {
  ejecutarSeed();
  process.exit(0);
}

module.exports = { ejecutarSeed };
