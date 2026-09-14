'use strict';

const db = require('../db/db');
const { ErrorHTTP } = require('../middleware/errorHandler');

const CATEGORIAS_VALIDAS = ['Entrada', 'Plato Principal', 'Bebida', 'Postre'];

function listarPlatos(req, res, next) {
  try {
    const soloDisponibles = req.query.disponibles !== 'false';
    const filas = soloDisponibles
      ? db.prepare('SELECT * FROM platos WHERE disponible = 1 ORDER BY categoria, nombre').all()
      : db.prepare('SELECT * FROM platos ORDER BY categoria, nombre').all();

    res.json({ data: filas.map(mapearPlato) });
  } catch (err) {
    next(err);
  }
}

function obtenerPlato(req, res, next) {
  try {
    const fila = db.prepare('SELECT * FROM platos WHERE id = ?').get(req.params.id);
    if (!fila) throw new ErrorHTTP(404, 'El plato solicitado no existe.');
    res.json({ data: mapearPlato(fila) });
  } catch (err) {
    next(err);
  }
}

function crearPlato(req, res, next) {
  try {
    const datos = validarDatosPlato(req.body || {});
    const resultado = db.prepare(`
      INSERT INTO platos (nombre, categoria, descripcion, precio, imagen, disponible)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(datos.nombre, datos.categoria, datos.descripcion, datos.precio, datos.imagen);

    const fila = db.prepare('SELECT * FROM platos WHERE id = ?').get(resultado.lastInsertRowid);
    res.status(201).json({ data: mapearPlato(fila) });
  } catch (err) {
    next(err);
  }
}

function actualizarPlato(req, res, next) {
  try {
    const existente = db.prepare('SELECT * FROM platos WHERE id = ?').get(req.params.id);
    if (!existente) throw new ErrorHTTP(404, 'El plato solicitado no existe.');

    const datos = validarDatosPlato({ ...existente, ...req.body });
    db.prepare(`
      UPDATE platos SET nombre = ?, categoria = ?, descripcion = ?, precio = ?, imagen = ?, disponible = ?
      WHERE id = ?
    `).run(
      datos.nombre,
      datos.categoria,
      datos.descripcion,
      datos.precio,
      datos.imagen,
      req.body.disponible === undefined ? existente.disponible : (req.body.disponible ? 1 : 0),
      req.params.id
    );

    const fila = db.prepare('SELECT * FROM platos WHERE id = ?').get(req.params.id);
    res.json({ data: mapearPlato(fila) });
  } catch (err) {
    next(err);
  }
}

function eliminarPlato(req, res, next) {
  try {
    const existente = db.prepare('SELECT * FROM platos WHERE id = ?').get(req.params.id);
    if (!existente) throw new ErrorHTTP(404, 'El plato solicitado no existe.');

    db.prepare('DELETE FROM platos WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function validarDatosPlato(body) {
  const nombre = String(body.nombre || '').trim();
  const categoria = String(body.categoria || '').trim();
  const descripcion = String(body.descripcion || '').trim();
  const precio = Number(body.precio);
  const imagen = String(body.imagen || '').trim();

  if (!nombre) throw new ErrorHTTP(400, 'El nombre del plato es obligatorio.');
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    throw new ErrorHTTP(400, `La categoría debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}.`);
  }
  if (!Number.isFinite(precio) || precio < 0) {
    throw new ErrorHTTP(400, 'El precio debe ser un número mayor o igual a 0.');
  }

  return { nombre, categoria, descripcion, precio: Math.round(precio), imagen };
}

function mapearPlato(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoria,
    descripcion: fila.descripcion,
    precio: fila.precio,
    imagen: fila.imagen,
    disponible: Boolean(fila.disponible)
  };
}

module.exports = {
  listarPlatos,
  obtenerPlato,
  crearPlato,
  actualizarPlato,
  eliminarPlato,
  CATEGORIAS_VALIDAS
};
