'use strict';

const jwt = require('jsonwebtoken');
const { tokenFueInvalidado } = require('../controllers/auth.controller');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Exige un token JWT válido en el header Authorization: Bearer <token>.
 * Protege los endpoints de gestión de pedidos: solo empleados autenticados
 * pueden consultar o cambiar el estado de los pedidos.
 */
function requiereAutenticacion(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Se requiere un token de autenticación.' });
  }

  if (tokenFueInvalidado(token)) {
    return res.status(401).json({ error: 'La sesión fue cerrada. Inicia sesión de nuevo.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = { id: payload.sub, usuario: payload.usuario, nombre: payload.nombre };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado. Inicia sesión de nuevo.' });
  }
}

module.exports = { requiereAutenticacion };
