# CHIBCHOMBIA — un único contenedor sirve la API RESTful, el menú
# interactivo del cliente y el panel de gestión de pedidos.
#
# Node 24 incluye el módulo nativo `node:sqlite`, así que no se necesita
# compilar dependencias nativas dentro de la imagen.
FROM node:24-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# 1) Dependencias del backend (capa cacheable: solo se reinstala si
#    package.json cambia, no en cada edición de código).
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# 2) Código de las tres partes del proyecto, claramente separadas.
COPY backend/ ./backend/
COPY menu-cliente/ ./menu-cliente/
COPY gestion-pedidos/ ./gestion-pedidos/

# La base de datos SQLite se guarda aquí; se monta como volumen en
# docker-compose.yml para que los pedidos sobrevivan a un reinicio.
RUN mkdir -p /app/backend/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/salud').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

WORKDIR /app/backend
CMD ["node", "server.js"]
