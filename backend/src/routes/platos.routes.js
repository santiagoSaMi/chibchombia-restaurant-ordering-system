'use strict';

const { Router } = require('express');
const {
  listarPlatos,
  obtenerPlato,
  crearPlato,
  actualizarPlato,
  eliminarPlato
} = require('../controllers/platos.controller');
const { requiereAutenticacion } = require('../middleware/auth');

const router = Router();

// Consulta del menú interactivo: pública, es lo primero que ve el cliente.
router.get('/', listarPlatos);
router.get('/:id', obtenerPlato);

// Administración del menú: solo personal autenticado (buena práctica,
// evita que cualquiera modifique precios o platos desde la API).
router.post('/', requiereAutenticacion, crearPlato);
router.put('/:id', requiereAutenticacion, actualizarPlato);
router.delete('/:id', requiereAutenticacion, eliminarPlato);

module.exports = router;
