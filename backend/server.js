'use strict';

require('dotenv').config();

// Falla rápido y con claridad si falta configuración crítica de seguridad.
if (!process.env.JWT_SECRET) {
  console.error('ERROR: la variable de entorno JWT_SECRET es obligatoria. Define un valor en .env');
  process.exit(1);
}

const path = require('node:path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { ejecutarSeed } = require('./src/db/seed');
const authRoutes = require('./src/routes/auth.routes');
const platosRoutes = require('./src/routes/platos.routes');
const pedidosRoutes = require('./src/routes/pedidos.routes');
const { manejadorNoEncontrado, manejadorErrores } = require('./src/middleware/errorHandler');

ejecutarSeed();

const app = express();
const PUERTO = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- API RESTful ------------------------------------------------------
app.get('/api/salud', (req, res) => res.json({ estado: 'ok', servicio: 'CHIBCHOMBIA API' }));
app.use('/api/auth', authRoutes);
app.use('/api/platos', platosRoutes);
app.use('/api/pedidos', pedidosRoutes);

// --- Front-ends estáticos (todo dentro del mismo contenedor) ---------
const RAIZ_PROYECTO = path.join(__dirname, '..');
app.use('/', express.static(path.join(RAIZ_PROYECTO, 'menu-cliente')));
app.use('/gestion-pedidos', express.static(path.join(RAIZ_PROYECTO, 'gestion-pedidos')));

app.use('/api', manejadorNoEncontrado);
app.use(manejadorErrores);

app.listen(PUERTO, () => {
  console.log(`CHIBCHOMBIA escuchando en http://localhost:${PUERTO}`);
  console.log(`  Menú de clientes:   http://localhost:${PUERTO}/`);
  console.log(`  Gestión de pedidos: http://localhost:${PUERTO}/gestion-pedidos`);
});
