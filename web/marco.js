// Cabecera, pie y aviso de «Usar Gramo», comunes a todas las páginas.
// Cada página solo pone <header id="cab"></header> y <footer id="pie"></footer>.

const PLAY = "https://play.google.com/store/apps/details?id=com.gramo1.app";
const APPSTORE = "https://apps.apple.com/app/id6801570409";

// Cuando exista Gramo para el ordenador, poner aquí su ruta (p. ej. "/app/") y
// el botón dejará de abrir el aviso.
const URL_APP_WEB = null;

const ICONO_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 1.8c-.3.3-.4.7-.4 1.2v18c0 .5.1.9.4 1.2l10.1-10.2L3.6 1.8zm11.2 11.3 2.6 2.6-11.6 6.6 9-9.2zm3.9-3.9 3 1.7c.9.5.9 1.8 0 2.3l-3 1.7-2.8-2.8 2.8-2.9zM5.8 1.7l11.6 6.6-2.6 2.6-9-9.2z"/></svg>';
const ICONO_APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.8-1.1-2.8-4.1zM13.9 5.1c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.5-.7.8-1.3 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.4z"/></svg>';

window.botonesTienda = function botonesTienda() {
  return `
    <a class="tienda" href="${PLAY}" rel="noopener">${ICONO_PLAY}<span><small data-t="tienda.play.peq"></small><strong>Google Play</strong></span></a>
    <a class="tienda" href="${APPSTORE}" rel="noopener">${ICONO_APPLE}<span><small data-t="tienda.apple.peq"></small><strong>App Store</strong></span></a>`;
};

function pintarMarco() {
  const ruta = location.pathname;
  const actual = (p) => (ruta === p || (p !== "/" && ruta.startsWith(p)) ? ' aria-current="page"' : "");

  const cab = document.getElementById("cab");
  if (cab) {
    cab.className = "cab";
    cab.innerHTML = `
      <div class="envoltura">
        <a class="marca" href="/"><img src="/c/icono.png" alt="" width="34" height="34">Gramo</a>
        <button class="menu-btn" type="button" aria-expanded="false" data-t-aria="nav.menu">☰</button>
        <nav id="menu">
          <a href="/#funciones" data-t="nav.funciones"></a>
          <a href="/descargar/"${actual("/descargar/")} data-t="nav.descargar"></a>
          <a href="/legal/"${actual("/legal/")} data-t="nav.legal"></a>
        </nav>
        <div class="idioma" role="group" aria-label="Idioma / Language">
          <button type="button" data-l="es">ES</button><button type="button" data-l="en">EN</button>
        </div>
        <button class="btn oro peq usar" type="button" data-usar data-t="nav.usar"></button>
      </div>`;
    const menuBtn = cab.querySelector(".menu-btn");
    const menu = cab.querySelector("#menu");
    menuBtn.addEventListener("click", () => {
      const abierto = menu.classList.toggle("abierto");
      menuBtn.setAttribute("aria-expanded", String(abierto));
    });
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) menu.classList.remove("abierto"); });
    cab.querySelectorAll(".idioma button").forEach((b) => b.addEventListener("click", () => aplicarIdioma(b.dataset.l)));
  }

  const pie = document.getElementById("pie");
  if (pie) {
    pie.className = "pie";
    pie.innerHTML = `
      <div class="envoltura">
        <div>
          <a class="marca" href="/"><img src="/c/icono.png" alt="" width="34" height="34">Gramo</a>
          <p style="margin-top:.8rem" data-t="pie.lema"></p>
          <p class="nota" data-t="pie.noafiliado"></p>
          <p class="nota">© ${new Date().getFullYear()} Gramo</p>
        </div>
        <div>
          <h4 data-t="pie.producto"></h4>
          <ul>
            <li><a href="/#funciones" data-t="nav.funciones"></a></li>
            <li><a href="/descargar/" data-t="nav.descargar"></a></li>
            <li><a href="mailto:dviidcf@gmail.com" data-t="pie.contacto"></a></li>
          </ul>
        </div>
        <div>
          <h4 data-t="pie.legal"></h4>
          <ul>
            <li><a href="/legal/privacidad.html" data-t="pie.privacidad"></a></li>
            <li><a href="/legal/terminos.html" data-t="pie.terminos"></a></li>
            <li><a href="/legal/aviso-legal.html" data-t="pie.aviso"></a></li>
            <li><a href="/legal/fuentes.html" data-t="pie.fuentes"></a></li>
            <li><a href="/legal/borrar-cuenta.html" data-t="pie.borrar"></a></li>
          </ul>
        </div>
      </div>`;
  }

  const dialogo = document.createElement("dialog");
  dialogo.className = "dialogo";
  dialogo.setAttribute("aria-labelledby", "dialogo-titulo");
  dialogo.innerHTML = `
    <div class="dentro">
      <img src="/c/icono.png" alt="" width="64" height="64" style="margin:0 auto 1rem;border-radius:16px">
      <h3 id="dialogo-titulo" data-t="dialogo.titulo"></h3>
      <p data-t="dialogo.texto"></p>
      <div class="tiendas">${botonesTienda()}</div>
      <button class="cerrar" type="button" data-t="dialogo.cerrar"></button>
    </div>`;
  document.body.appendChild(dialogo);
  dialogo.querySelector(".cerrar").addEventListener("click", () => dialogo.close());
  dialogo.addEventListener("click", (e) => { if (e.target === dialogo) dialogo.close(); });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-usar]")) return;
    e.preventDefault();
    if (URL_APP_WEB) location.href = URL_APP_WEB;
    else if (!dialogo.open) dialogo.showModal();
  });

  aplicarIdioma();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pintarMarco);
else pintarMarco();
