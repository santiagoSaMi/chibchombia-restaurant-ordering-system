# Chibchombia — Restaurant Delivery Ordering System

A full rebuild of a final project for a Web Application Development course,
keeping the **Chibchombia** brand (Andean muisca-inspired cuisine) while
meeting all the functional requirements: an interactive menu with a
shopping cart, a RESTful order-capture web service, and an order
management application with staff authentication.

## Project structure

The three deliverables required by the assignment are kept in clearly
separated, identifiable folders within this same repository:

chibchombia/
├── menu-cliente/ # 1) Restaurant menu (public front-end)
├── gestion-pedidos/ # 2) Order management app (staff front-end)
├── backend/ # 3) Web service / RESTful API + database
├── Dockerfile # Packages all three parts into a single container
├── docker-compose.yml
└── .env.example

## Architecture and technical decisions

- **Backend:** Node.js + Express, layered architecture (`routes` →
  `controllers` → `db`) with centralized error handling.
- **Database:** SQLite through Node's native `node:sqlite` module (no
  native dependencies to compile, which keeps the Docker build simple and
  reproducible). Data persists through a volume.
- **Authentication:** username/password with `bcryptjs` for password
  hashing and JWT-based sessions (`jsonwebtoken`). Logging out invalidates
  the token on the server side.
- **Basic security:** passwords are never stored in plain text, login
  attempts are rate-limited (`express-rate-limit`), CORS is controlled,
  and order totals are always recalculated on the server (the client's
  submitted total is never trusted).
- **Front-end:** plain HTML/CSS/JS (no build step), just like the
  original project, but restructured with real dynamic state and a
  coherent visual identity (deep green, gold and terracotta palette,
  Yeseva One + Work Sans typography).
- **Everything in one container:** the same Express process serves the
  API at `/api`, the menu at `/`, and order management at
  `/gestion-pedidos`.

## How each requirement is met

| Requirement | Where it's implemented |
|---|---|
| Interactive menu loaded dynamically from the database | `GET /api/platos` + `menu-cliente/logica.js` |
| Cart: add, remove, dynamic total | `menu-cliente/logica.js` (in-memory `carrito`, `renderizarCarrito`) |
| Cart submits the order to a server | `POST /api/pedidos` |
| RESTful web service available online | `backend/` (Express, `/api/*`) |
| Order-capture endpoint that saves to the database | `POST /api/pedidos` → `pedidos` and `pedido_items` tables |
| Front-end client to query orders | `gestion-pedidos/` |
| Authentication with login/logout | `POST /api/auth/login`, `POST /api/auth/logout` |
| Query orders by status | `GET /api/pedidos?estado=pendiente\|atendido` |
| Query orders by customer | `GET /api/pedidos?cliente=<name>` |
| Change status from pending to attended | `PATCH /api/pedidos/:id/estado` |

## Running with Docker

1. Copy the environment variables file and adjust it (especially
   `JWT_SECRET` and `ADMIN_PASSWORD`):

```bash
   cp backend/.env.example .env
```

2. Build and start the container:

```bash
   docker compose up --build
```

3. Open:
   - Customer menu: <http://localhost:3000/>
   - Order management: <http://localhost:3000/gestion-pedidos>
   - API health check: <http://localhost:3000/api/salud>

   Log in to order management with the username and password set in
   `.env` (`ADMIN_USER` / `ADMIN_PASSWORD`; defaults to `admin` /
   `chibchombia2024`, created automatically the first time the system
   starts).

Data (menu and orders) is stored in the `chibchombia_data` volume, so it
survives `docker compose down` (use `docker compose down -v` if you want
to start from scratch).

### Without Docker (local development)

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Requires Node.js **22.13+** (uses `node:sqlite`, bundled with Node without
needing flags since that version).

## API quick reference

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/platos` | No | Lists the available menu |
| POST | `/api/platos` | Yes | Creates a dish |
| PUT | `/api/platos/:id` | Yes | Edits a dish |
| DELETE | `/api/platos/:id` | Yes | Deletes a dish |
| POST | `/api/pedidos` | No | Captures an order from the cart |
| GET | `/api/pedidos?estado=&cliente=` | Yes | Lists orders, filterable |
| PATCH | `/api/pedidos/:id/estado` | Yes | Changes the order's status |
| POST | `/api/auth/login` | No | Logs in, returns a JWT |
| POST | `/api/auth/logout` | Yes | Invalidates the current token |

## Notes for the presentation

- The original source code (`estilos.css`, `index.html`, `logica.js`
  with no real backend) was kept as a style reference, but the entire
  system was rewritten to implement a proper client-server architecture,
  authentication, and real database persistence.
- The repository is organized to be pushed directly to GitHub and
  deployed with `docker compose up` on any server that has Docker
  installed.
