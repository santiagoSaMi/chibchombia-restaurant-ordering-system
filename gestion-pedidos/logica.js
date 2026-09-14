'use strict';

const API_URL = '/api';
const CLAVE_TOKEN = 'chibchombia_token';
const CLAVE_USUARIO = 'chibchombia_usuario';

const formateadorPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

const formateadorFecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

let filtroEstado = '';
let filtroCliente = '';
let debounceBusqueda = null;

const el = {
  barraUsuario: document.getElementById('barra-usuario'),
  nombreUsuario: document.getElementById('nombre-usuario'),
  botonSalir: document.getElementById('boton-salir'),
  vistaLogin: document.getElementById('vista-login'),
  vistaPanel: document.getElementById('vista-panel'),
  formLogin: document.getElementById('form-login'),
  botonLogin: document.getElementById('boton-login'),
  mensajeLogin: document.getElementById('mensaje-login'),
  filtrosEstado: document.getElementById('filtros-estado'),
  buscarCliente: document.getElementById('buscar-cliente'),
  botonActualizar: document.getElementById('boton-actualizar'),
  estadoPedidos: document.getElementById('estado-pedidos'),
  listaPedidos: document.getElementById('lista-pedidos')
};

window.addEventListener('DOMContentLoaded', inicializar);

function inicializar() {
  configurarEventos();
  if (obtenerToken()) {
    mostrarPanel();
    cargarPedidos();
  } else {
    mostrarLogin();
  }
}

function configurarEventos() {
  el.formLogin.addEventListener('submit', iniciarSesion);
  el.botonSalir.addEventListener('click', cerrarSesion);
  el.botonActualizar.addEventListener('click', cargarPedidos);

  el.filtrosEstado.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-estado]');
    if (!boton) return;
    filtroEstado = boton.dataset.estado;
    el.filtrosEstado
      .querySelectorAll('.filtro-estado')
      .forEach((b) => b.classList.toggle('is-activo', b === boton));
    cargarPedidos();
  });

  el.buscarCliente.addEventListener('input', () => {
    clearTimeout(debounceBusqueda);
    debounceBusqueda = setTimeout(() => {
      filtroCliente = el.buscarCliente.value.trim();
      cargarPedidos();
    }, 350);
  });

  el.listaPedidos.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    cambiarEstadoPedido(boton.dataset.id, boton.dataset.accion);
  });
}

/* ----------------------- Autenticación ----------------------- */

function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

async function iniciarSesion(evento) {
  evento.preventDefault();
  const usuario = document.getElementById('usuario').value.trim();
  const password = document.getElementById('password').value;

  el.botonLogin.disabled = true;
  mostrarMensajeLogin('Verificando credenciales…', '');

  try {
    const respuesta = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });
    const cuerpo = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(cuerpo.error || 'No fue posible iniciar sesión.');
    }

    localStorage.setItem(CLAVE_TOKEN, cuerpo.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(cuerpo.usuario));

    el.formLogin.reset();
    mostrarMensajeLogin('', '');
    mostrarPanel();
    cargarPedidos();
  } catch (error) {
    mostrarMensajeLogin(error.message, 'error');
  } finally {
    el.botonLogin.disabled = false;
  }
}

async function cerrarSesion() {
  const token = obtenerToken();
  try {
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (error) {
    console.warn('No se pudo notificar el cierre de sesión al servidor.', error);
  } finally {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    mostrarLogin();
  }
}

function mostrarMensajeLogin(texto, tipo) {
  el.mensajeLogin.textContent = texto;
  el.mensajeLogin.className = 'mensaje' + (tipo ? ` ${tipo}` : '');
}

function mostrarLogin() {
  el.vistaLogin.hidden = false;
  el.vistaPanel.hidden = true;
  el.barraUsuario.hidden = true;
}

function mostrarPanel() {
  el.vistaLogin.hidden = true;
  el.vistaPanel.hidden = false;
  el.barraUsuario.hidden = false;

  const usuarioGuardado = localStorage.getItem(CLAVE_USUARIO);
  if (usuarioGuardado) {
    try {
      const usuario = JSON.parse(usuarioGuardado);
      el.nombreUsuario.textContent = usuario.nombre || usuario.usuario;
    } catch {
      el.nombreUsuario.textContent = '';
    }
  }
}

/* ------------------------- Pedidos ---------------------------- */

async function cargarPedidos() {
  const token = obtenerToken();
  if (!token) return;

  el.estadoPedidos.textContent = 'Cargando pedidos…';
  el.listaPedidos.innerHTML = '';

  const parametros = new URLSearchParams();
  if (filtroEstado) parametros.set('estado', filtroEstado);
  if (filtroCliente) parametros.set('cliente', filtroCliente);

  try {
    const respuesta = await fetch(`${API_URL}/pedidos?${parametros.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (respuesta.status === 401) {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_USUARIO);
      mostrarLogin();
      mostrarMensajeLogin('Tu sesión expiró. Inicia sesión de nuevo.', 'error');
      return;
    }

    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudieron cargar los pedidos.');

    renderizarPedidos(cuerpo.data);
  } catch (error) {
    console.error(error);
    el.estadoPedidos.textContent = 'Ocurrió un error al cargar los pedidos.';
  }
}

function renderizarPedidos(pedidos) {
  if (pedidos.length === 0) {
    el.estadoPedidos.textContent = '';
    el.listaPedidos.innerHTML = '<p class="estado-vacio">No hay pedidos que coincidan con este filtro.</p>';
    return;
  }

  el.estadoPedidos.textContent = `${pedidos.length} pedido(s) encontrado(s).`;
  el.listaPedidos.innerHTML = pedidos.map(plantillaPedido).join('');
}

function plantillaPedido(pedido) {
  const fecha = pedido.creadoEn ? formateadorFecha.format(new Date(pedido.creadoEn.replace(' ', 'T') + 'Z')) : '';
  const itemsHtml = pedido.items
    .map(
      (item) => `
      <li>
        <span>${item.cantidad} × ${item.nombre}</span>
        <span>${formateadorPrecio.format(item.precioUnitario * item.cantidad)}</span>
      </li>`
    )
    .join('');

  const esAtendido = pedido.estado === 'atendido';
  const botonAccion = esAtendido
    ? `<button type="button" class="pedido__accion" data-accion="pendiente" data-id="${pedido.id}">Reabrir pedido</button>`
    : `<button type="button" class="pedido__accion" data-accion="atendido" data-id="${pedido.id}">Marcar como atendido</button>`;

  return `
    <article class="pedido" data-estado="${pedido.estado}">
      <div class="pedido__encabezado">
        <div>
          <p class="pedido__cliente">#${pedido.id} · ${pedido.cliente.nombre}</p>
          <p class="pedido__meta">${pedido.cliente.telefono} · ${pedido.cliente.direccion}</p>
          <p class="pedido__meta">${fecha}</p>
        </div>
        <span class="etiqueta-estado">${esAtendido ? 'Atendido' : 'Pendiente'}</span>
      </div>
      <ul class="pedido__items">${itemsHtml}</ul>
      <div class="pedido__pie">
        <span class="pedido__total">Total: ${formateadorPrecio.format(pedido.total)}</span>
        ${botonAccion}
      </div>
    </article>
  `;
}

async function cambiarEstadoPedido(id, nuevoEstado) {
  const token = obtenerToken();
  if (!token) return;

  try {
    const respuesta = await fetch(`${API_URL}/pedidos/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo actualizar el pedido.');

    cargarPedidos();
  } catch (error) {
    console.error(error);
    el.estadoPedidos.textContent = 'No se pudo actualizar el estado del pedido. Intenta de nuevo.';
  }
}
