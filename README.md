# Chibchombia — Sistema Web de Domicilios de Restaurante

Reconstrucción completa del proyecto final de Desarrollo de Aplicaciones Web,
conservando la identidad **Chibchombia** (cocina de los Andes muiscas) y
cumpliendo los requerimientos de la guía: menú interactivo con carrito,
servicio web RESTful de captura de pedidos, y aplicación de gestión de
pedidos con autenticación para el personal.

## Estructura del proyecto

Las tres partes que pide la guía quedan separadas e identificadas en
carpetas propias dentro de este mismo repositorio:

```
chibchombia/
├── menu-cliente/        # 1) Menú del restaurante (front-end público)
├── gestion-pedidos/      # 2) Aplicación de gestión de pedidos (front-end del personal)
├── backend/               # 3) Servicio web / API RESTful + base de datos
├── Dockerfile             # Empaqueta las tres partes en un solo contenedor
├── docker-compose.yml
└── .env.example
```

## Arquitectura y decisiones técnicas

- **Backend:** Node.js + Express, con arquitectura en capas (`routes` →
  `controllers` → `db`) y manejo centralizado de errores.
- **Base de datos:** SQLite a través del módulo nativo `node:sqlite` de
  Node.js (sin dependencias nativas que compilar, lo que hace el build de
  Docker más simple y reproducible). Los datos persisten en un volumen.
- **Autenticación:** usuario/contraseña con `bcryptjs` para el hash de la
  contraseña y sesiones con JWT (`jsonwebtoken`). El cierre de sesión
  invalida el token del lado del servidor.
- **Seguridad básica:** contraseñas nunca en texto plano, límite de
  intentos de login (`express-rate-limit`), CORS controlado, precios de
  pedidos recalculados siempre en el servidor (nunca se confía en el
  total enviado por el cliente).
- **Front-end:** HTML/CSS/JS puro (sin build step), igual que el proyecto
  original, pero reestructurado, con estado dinámico real y una
  identidad visual coherente (verde profundo, oro y terracota, tipografía
  Yeseva One + Work Sans).
- **Todo en un contenedor:** el mismo proceso Express sirve la API en
  `/api`, el menú en `/` y la gestión de pedidos en `/gestion-pedidos`.

## Cómo se cumple cada requerimiento

| Requerimiento de la guía | Dónde se implementa |
|---|---|
| Menú interactivo cargado dinámicamente desde la BD | `GET /api/platos` + `menu-cliente/logica.js` |
| Carrito: agregar, eliminar, total dinámico | `menu-cliente/logica.js` (`carrito` en memoria, `renderizarCarrito`) |
| Carrito envía el pedido a un servidor | `POST /api/pedidos` |
| Servicio web RESTful disponible en línea | `backend/` (Express, `/api/*`) |
| Endpoint de captura de pedidos que guarda en BD | `POST /api/pedidos` → tablas `pedidos` y `pedido_items` |
| Cliente front-end para consultar pedidos | `gestion-pedidos/` |
| Autenticación con inicio/cierre de sesión | `POST /api/auth/login`, `POST /api/auth/logout` |
| Consultar pedidos por estado | `GET /api/pedidos?estado=pendiente\|atendido` |
| Consultar pedidos por cliente | `GET /api/pedidos?cliente=<nombre>` |
| Cambiar estado pendiente → atendido | `PATCH /api/pedidos/:id/estado` |

## Ejecutar con Docker

1. Copia el archivo de variables de entorno y ajústalo (sobre todo
   `JWT_SECRET` y `ADMIN_PASSWORD`):

   ```bash
   cp backend/.env.example .env
   ```

2. Construye y levanta el contenedor:

   ```bash
   docker compose up --build
   ```

3. Abre:
   - Menú de clientes: <http://localhost:3000/>
   - Gestión de pedidos: <http://localhost:3000/gestion-pedidos>
   - Salud de la API: <http://localhost:3000/api/salud>

   Inicia sesión en la gestión de pedidos con el usuario y contraseña
   definidos en `.env` (`ADMIN_USER` / `ADMIN_PASSWORD`; por defecto
   `admin` / `chibchombia2024`, se crea automáticamente la primera vez
   que arranca el sistema).

Los datos (menú y pedidos) se guardan en el volumen `chibchombia_data`,
así que sobreviven a `docker compose down` (usa `docker compose down -v`
si quieres empezar desde cero).

### Sin Docker (desarrollo local)

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Requiere Node.js **22.13+** (se usa `node:sqlite`, incluido en Node sin
necesidad de flags desde esa versión).

## Referencia rápida de la API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/platos` | No | Lista el menú disponible |
| POST | `/api/platos` | Sí | Crea un plato |
| PUT | `/api/platos/:id` | Sí | Edita un plato |
| DELETE | `/api/platos/:id` | Sí | Elimina un plato |
| POST | `/api/pedidos` | No | Captura un pedido desde el carrito |
| GET | `/api/pedidos?estado=&cliente=` | Sí | Lista pedidos, filtrables |
| PATCH | `/api/pedidos/:id/estado` | Sí | Cambia el estado del pedido |
| POST | `/api/auth/login` | No | Inicia sesión, devuelve un JWT |
| POST | `/api/auth/logout` | Sí | Invalida el token actual |

## Notas para la sustentación

- El código fuente original (`estilos.css`, `index.html`, `logica.js`
  sin backend real) se mantuvo como referencia de estilo, pero todo el
  sistema fue reescrito para cumplir arquitectura cliente-servidor,
  autenticación y persistencia real en base de datos.
- El repositorio está organizado para poder subirse directamente a
  GitHub y desplegarse con `docker compose up` en cualquier servidor
  que tenga Docker instalado.
