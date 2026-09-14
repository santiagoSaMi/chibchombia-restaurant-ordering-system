'use strict';

// La API vive en el mismo contenedor/origen, así que basta una ruta relativa.
const API_URL = '/api';

const formateadorPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

/** @type {Array<{id:number, nombre:string, categoria:string, descripcion:string, precio:number, imagen:string}>} */
let platosDisponibles = [];

/** @type {Map<number, {plato: object, cantidad: number}>} */
const carrito = new Map();

let categoriaActiva = 'Todos';

const elementos = {
  listaPlatos: document.getElementById('lista-platos'),
  estadoCarga: document.getElementById('estado-carga'),
  categorias: document.getElementById('categorias'),
  botonCarrito: document.getElementById('boton-carrito'),
  contadorCarrito: document.getElementById('carrito-contador'),
  totalBotonCarrito: document.getElementById('carrito-total-boton'),
  panelCarrito: document.getElementById('panel-carrito'),
  fondoCarrito: document.getElementById('fondo-carrito'),
  cerrarCarrito: document.getElementById('cerrar-carrito'),
  listaCarrito: document.getElementById('lista-carrito'),
  carritoVacio: document.getElementById('carrito-vacio'),
  formPedido: document.getElementById('form-pedido'),
  total: document.getElementById('total'),
  botonEnviar: document.getElementById('boton-enviar'),
  mensajePedido: document.getElementById('mensaje-pedido')
};

window.addEventListener('DOMContentLoaded', inicializar);

async function inicializar() {
  configurarEventos();
  await cargarMenu();
}

async function cargarMenu() {
  try {
    const respuesta = await fetch(`${API_URL}/platos`);
    if (!respuesta.ok) throw new Error('No se pudo cargar el menú.');
    const cuerpo = await respuesta.json();
    platosDisponibles = cuerpo.data || [];
    elementos.estadoCarga.hidden = true;
    renderizarPlatos();
  } catch (error) {
    console.error(error);
    elementos.estadoCarga.textContent =
      'No fue posible cargar el menú en este momento. Intenta recargar la página.';
  }
}

function renderizarPlatos() {
  elementos.listaPlatos.innerHTML = platosDisponibles.map(plantillaPlato).join('');
  aplicarFiltroCategoria();
}

function plantillaPlato(plato) {
  return `
    <article class="plato" data-categoria="${plato.categoria}" data-id="${plato.id}">
      <div class="plato__imagen-envoltorio">
        <img src="${plato.imagen}" alt="${plato.nombre}" loading="lazy">
      </div>
      <div class="plato__cuerpo">
        <p class="plato__categoria">${plato.categoria}</p>
        <h3 class="plato__nombre">${plato.nombre}</h3>
        <p class="plato__descripcion">${plato.descripcion}</p>
        <div class="plato__pie">
          <span class="plato__precio">${formateadorPrecio.format(plato.precio)}</span>
          <button type="button" class="boton-agregar" data-agregar="${plato.id}">Agregar</button>
        </div>
      </div>
    </article>
  `;
}

function configurarEventos() {
  elementos.categorias.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-categoria]');
    if (!boton) return;
    categoriaActiva = boton.dataset.categoria;
    elementos.categorias
      .querySelectorAll('.categorias__boton')
      .forEach((b) => b.classList.toggle('is-activa', b === boton));
    aplicarFiltroCategoria();
  });

  elementos.listaPlatos.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-agregar]');
    if (!boton) return;
    agregarAlCarrito(Number(boton.dataset.agregar));
  });

  elementos.botonCarrito.addEventListener('click', () => alternarPanelCarrito(true));
  elementos.cerrarCarrito.addEventListener('click', () => alternarPanelCarrito(false));
  elementos.fondoCarrito.addEventListener('click', () => alternarPanelCarrito(false));

  elementos.listaCarrito.addEventListener('click', (evento) => {
    const id = Number(evento.target.dataset.id);
    if (!id) return;
    if (evento.target.dataset.accion === 'sumar') cambiarCantidad(id, 1);
    if (evento.target.dataset.accion === 'restar') cambiarCantidad(id, -1);
    if (evento.target.dataset.accion === 'eliminar') eliminarDelCarrito(id);
  });

  elementos.formPedido.addEventListener('submit', enviarPedido);
}

function aplicarFiltroCategoria() {
  const tarjetas = elementos.listaPlatos.querySelectorAll('.plato');
  tarjetas.forEach((tarjeta) => {
    const visible = categoriaActiva === 'Todos' || tarjeta.dataset.categoria === categoriaActiva;
    tarjeta.classList.toggle('oculto', !visible);
  });
}

function agregarAlCarrito(idPlato) {
  const plato = platosDisponibles.find((p) => p.id === idPlato);
  if (!plato) return;

  const existente = carrito.get(idPlato);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.set(idPlato, { plato, cantidad: 1 });
  }
  renderizarCarrito();
  alternarPanelCarrito(true);
}

function cambiarCantidad(idPlato, delta) {
  const item = carrito.get(idPlato);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito.delete(idPlato);
  }
  renderizarCarrito();
}

function eliminarDelCarrito(idPlato) {
  carrito.delete(idPlato);
  renderizarCarrito();
}

function calcularTotal() {
  let total = 0;
  carrito.forEach(({ plato, cantidad }) => {
    total += plato.precio * cantidad;
  });
  return total;
}

function renderizarCarrito() {
  const items = Array.from(carrito.values());

  elementos.carritoVacio.hidden = items.length > 0;
  elementos.listaCarrito.innerHTML = items
    .map(
      ({ plato, cantidad }) => `
      <div class="item-carrito">
        <img src="${plato.imagen}" alt="${plato.nombre}">
        <div class="item-carrito__info">
          <p class="item-carrito__nombre">${plato.nombre}</p>
          <p class="item-carrito__precio">${formateadorPrecio.format(plato.precio)} c/u</p>
        </div>
        <div class="item-carrito__cantidad">
          <button type="button" data-id="${plato.id}" data-accion="restar" aria-label="Quitar una unidad">−</button>
          <span>${cantidad}</span>
          <button type="button" data-id="${plato.id}" data-accion="sumar" aria-label="Agregar una unidad">+</button>
        </div>
      </div>
    `
    )
    .join('');

  const total = calcularTotal();
  const totalTexto = formateadorPrecio.format(total);
  elementos.total.textContent = totalTexto;
  elementos.totalBotonCarrito.textContent = totalTexto;

  const cantidadTotal = items.reduce((acc, { cantidad }) => acc + cantidad, 0);
  elementos.contadorCarrito.textContent = String(cantidadTotal);
}

function alternarPanelCarrito(abrir) {
  elementos.panelCarrito.classList.toggle('is-abierto', abrir);
  elementos.panelCarrito.setAttribute('aria-hidden', String(!abrir));
  elementos.botonCarrito.setAttribute('aria-expanded', String(abrir));
  elementos.fondoCarrito.hidden = !abrir;
}

async function enviarPedido(evento) {
  evento.preventDefault();

  if (carrito.size === 0) {
    mostrarMensajePedido('Agrega al menos un plato antes de confirmar el pedido.', 'error');
    return;
  }

  const nombre = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const direccion = document.getElementById('direccion').value.trim();

  if (!nombre || !telefono || !direccion) {
    mostrarMensajePedido('Completa nombre, teléfono y dirección para continuar.', 'error');
    return;
  }

  const items = Array.from(carrito.values()).map(({ plato, cantidad }) => ({
    platoId: plato.id,
    cantidad
  }));

  elementos.botonEnviar.disabled = true;
  mostrarMensajePedido('Enviando tu pedido…', '');

  try {
    const respuesta = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono, direccion, items })
    });

    const cuerpo = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(cuerpo.error || 'No se pudo enviar el pedido.');
    }

    mostrarMensajePedido(
      `¡Pedido #${cuerpo.data.id} confirmado! Te contactaremos al ${telefono} para la entrega.`,
      'exito'
    );
    carrito.clear();
    renderizarCarrito();
    elementos.formPedido.reset();
  } catch (error) {
    console.error(error);
    mostrarMensajePedido(error.message, 'error');
  } finally {
    elementos.botonEnviar.disabled = false;
  }
}

function mostrarMensajePedido(texto, tipo) {
  elementos.mensajePedido.textContent = texto;
  elementos.mensajePedido.className = 'mensaje-pedido' + (tipo ? ` ${tipo}` : '');
}
