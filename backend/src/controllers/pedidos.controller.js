'use strict';

const db = require('../db/db');
const { ErrorHTTP } = require('../middleware/errorHandler');

const ESTADOS_VALIDOS = ['pendiente', 'atendido'];

/**
 * POST /api/pedidos — endpoint público usado por el carrito de compras
 * del menú interactivo para capturar un nuevo pedido.
 */
function crearPedido(req, res, next) {
  try {
    const { nombre, telefono, direccion, items } = req.body || {};

    const clienteNombre = String(nombre || '').trim();
    const clienteTelefono = String(telefono || '').trim();
    const clienteDireccion = String(direccion || '').trim();

    if (!clienteNombre || !clienteTelefono || !clienteDireccion) {
      throw new ErrorHTTP(400, 'Nombre, teléfono y dirección son obligatorios para el pedido.');
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new ErrorHTTP(400, 'El carrito no puede estar vacío.');
    }

    // Se recalculan los precios contra la base de datos: nunca se confía
    // en el total enviado desde el cliente.
    const buscarPlato = db.prepare('SELECT * FROM platos WHERE id = ?');
    const itemsValidados = [];
    let total = 0;

    for (const item of items) {
      const plato = buscarPlato.get(item.platoId ?? item.id);
      if (!plato) {
        throw new ErrorHTTP(400, `El plato con id ${item.platoId ?? item.id} no existe.`);
      }
      const cantidad = Number.isInteger(item.cantidad) && item.cantidad > 0 ? item.cantidad : 1;
      total += plato.precio * cantidad;
      itemsValidados.push({
        platoId: plato.id,
        nombrePlato: plato.nombre,
        precioUnitario: plato.precio,
        cantidad
      });
    }

    db.exec('BEGIN');
    try {
      const resultadoPedido = db.prepare(`
        INSERT INTO pedidos (cliente_nombre, cliente_telefono, cliente_direccion, estado, total)
        VALUES (?, ?, ?, 'pendiente', ?)
      `).run(clienteNombre, clienteTelefono, clienteDireccion, total);

      const pedidoId = resultadoPedido.lastInsertRowid;
      const insertarItem = db.prepare(`
        INSERT INTO pedido_items (pedido_id, plato_id, nombre_plato, precio_unitario, cantidad)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const item of itemsValidados) {
        insertarItem.run(pedidoId, item.platoId, item.nombrePlato, item.precioUnitario, item.cantidad);
      }

      db.exec('COMMIT');

      const pedidoCreado = obtenerPedidoCompleto(pedidoId);
      res.status(201).json({ data: pedidoCreado });
    } catch (errTx) {
      db.exec('ROLLBACK');
      throw errTx;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/pedidos — requiere autenticación. Permite filtrar por estado
 * y por cliente, tal como exige la gestión de pedidos del restaurante.
 */
function listarPedidos(req, res, next) {
  try {
    const { estado, cliente } = req.query;

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      throw new ErrorHTTP(400, `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}.`);
    }

    let sql = 'SELECT * FROM pedidos WHERE 1 = 1';
    const params = [];

    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }
    if (cliente) {
      sql += ' AND cliente_nombre LIKE ?';
      params.push(`%${cliente}%`);
    }
    sql += ' ORDER BY creado_en DESC';

    const pedidos = db.prepare(sql).all(...params);
    const data = pedidos.map((p) => obtenerPedidoCompleto(p.id));
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

function obtenerPedido(req, res, next) {
  try {
    const pedido = obtenerPedidoCompleto(req.params.id);
    if (!pedido) throw new ErrorHTTP(404, 'El pedido solicitado no existe.');
    res.json({ data: pedido });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/pedidos/:id/estado — requiere autenticación. Cambia el estado
 * de pendiente a atendido (o viceversa, útil ante errores del personal).
 */
function cambiarEstadoPedido(req, res, next) {
  try {
    const { estado } = req.body || {};
    if (!ESTADOS_VALIDOS.includes(estado)) {
      throw new ErrorHTTP(400, `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}.`);
    }

    const existente = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(req.params.id);
    if (!existente) throw new ErrorHTTP(404, 'El pedido solicitado no existe.');

    db.prepare(`
      UPDATE pedidos SET estado = ?, atendido_en = CASE WHEN ? = 'atendido' THEN datetime('now') ELSE NULL END
      WHERE id = ?
    `).run(estado, estado, req.params.id);

    res.json({ data: obtenerPedidoCompleto(req.params.id) });
  } catch (err) {
    next(err);
  }
}

function obtenerPedidoCompleto(id) {
  const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
  if (!pedido) return null;

  const items = db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?').all(id);

  return {
    id: pedido.id,
    cliente: {
      nombre: pedido.cliente_nombre,
      telefono: pedido.cliente_telefono,
      direccion: pedido.cliente_direccion
    },
    estado: pedido.estado,
    total: pedido.total,
    creadoEn: pedido.creado_en,
    atendidoEn: pedido.atendido_en,
    items: items.map((it) => ({
      platoId: it.plato_id,
      nombre: it.nombre_plato,
      precioUnitario: it.precio_unitario,
      cantidad: it.cantidad
    }))
  };
}

module.exports = {
  crearPedido,
  listarPedidos,
  obtenerPedido,
  cambiarEstadoPedido
};
