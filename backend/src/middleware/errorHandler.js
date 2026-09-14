'use strict';

class ErrorHTTP extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

function manejadorNoEncontrado(req, res, next) {
  next(new ErrorHTTP(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    error: err.message || 'Error interno del servidor.'
  });
}

module.exports = { ErrorHTTP, manejadorNoEncontrado, manejadorErrores };
