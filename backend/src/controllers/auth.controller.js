'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const { ErrorHTTP } = require('../middleware/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRA_EN = process.env.JWT_EXPIRA_EN || '8h';

// Lista de invalidación en memoria para permitir "cerrar sesión" con JWT.
// Es un enfoque sencillo y suficiente para el alcance del proyecto: al cerrar
// sesión el token deja de ser aceptado por el servidor aunque no haya expirado.
const tokensInvalidados = new Set();

function iniciarSesion(req, res, next) {
  try {
    const { usuario, password } = req.body || {};

    if (!usuario || !password) {
      throw new ErrorHTTP(400, 'Usuario y contraseña son obligatorios.');
    }

    const fila = db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario);
    if (!fila) {
      throw new ErrorHTTP(401, 'Usuario o contraseña incorrectos.');
    }

    const claveValida = bcrypt.compareSync(password, fila.password_hash);
    if (!claveValida) {
      throw new ErrorHTTP(401, 'Usuario o contraseña incorrectos.');
    }

    const token = jwt.sign(
      { sub: fila.id, usuario: fila.usuario, nombre: fila.nombre },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRA_EN }
    );

    res.json({
      token,
      usuario: { id: fila.id, usuario: fila.usuario, nombre: fila.nombre }
    });
  } catch (err) {
    next(err);
  }
}

function cerrarSesion(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (token) {
      tokensInvalidados.add(token);
    }
    res.json({ mensaje: 'Sesión cerrada correctamente.' });
  } catch (err) {
    next(err);
  }
}

function tokenFueInvalidado(token) {
  return tokensInvalidados.has(token);
}

module.exports = { iniciarSesion, cerrarSesion, tokenFueInvalidado };
