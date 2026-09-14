'use strict';

const { Router } = require('express');
const {
  crearPedido,
  listarPedidos,
  obtenerPedido,
  cambiarEstadoPedido
} = require('../controllers/pedidos.controller');
const { requiereAutenticacion } = require('../middleware/auth');

const router = Router();

// Captura de pedidos: pública, la usa el carrito de compras del menú.
router.post('/', crearPedido);

// Gestión de pedidos: solo empleados autenticados.
router.get('/', requiereAutenticacion, listarPedidos);
router.get('/:id', requiereAutenticacion, obtenerPedido);
router.patch('/:id/estado', requiereAutenticacion, cambiarEstadoPedido);

module.exports = router;
