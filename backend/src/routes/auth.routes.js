'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { iniciarSesion, cerrarSesion } = require('../controllers/auth.controller');
const { requiereAutenticacion } = require('../middleware/auth');

const router = Router();

// Limita los intentos de login para mitigar fuerza bruta sobre credenciales.
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde.' }
});

router.post('/login', limitadorLogin, iniciarSesion);
router.post('/logout', requiereAutenticacion, cerrarSesion);

module.exports = router;
