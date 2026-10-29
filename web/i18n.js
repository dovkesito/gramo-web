// Idiomas de la web: español e inglés.
//
// Sin build: cada texto corto lleva data-t="clave" (o data-t-html si trae
// etiquetas) y su traducción está aquí. Los bloques largos, como los documentos
// legales, van duplicados en el HTML con data-idioma="es" / "en" y se enseña uno.
// El idioma sale de lo que eligió la persona (localStorage), y si no, del navegador.
// Al cambiar se lanza el evento "idioma" en document para que las demos se repinten.

window.GRAMO_TEXTOS = window.GRAMO_TEXTOS || {};

const TEXTOS_COMUNES = {
  es: {
    "nav.funciones": "Funciones",
    "nav.descargar": "Descargar",
    "nav.legal": "Legal",
    "nav.usar": "Usar Gramo",
    "nav.menu": "Abrir menú",
    "pie.lema": "La compra más barata que cumple tus macros, comparando supermercados.",
    "pie.producto": "Producto",
    "pie.legal": "Legal",
    "pie.privacidad": "Privacidad",
    "pie.terminos": "Términos",
    "pie.borrar": "Borrar mi cuenta",
    "pie.aviso": "Aviso legal",
    "pie.fuentes": "Fuentes de datos",
    "pie.contacto": "Contacto",
    "pie.noafiliado": "Gramo no está afiliado a ningún supermercado. Las marcas citadas pertenecen a sus dueños.",
    "dialogo.titulo": "Gramo en el ordenador llega pronto",
    "dialogo.texto": "Estamos preparando la versión web. Mientras tanto, tienes Gramo en el móvil, gratis para empezar.",
    "dialogo.cerrar": "Cerrar",
    "tienda.play.peq": "Disponible en",
    "tienda.apple.peq": "Descárgalo en el",
  },
  en: {
    "nav.funciones": "Features",
    "nav.descargar": "Download",
    "nav.legal": "Legal",
    "nav.usar": "Use Gramo",
    "nav.menu": "Open menu",
    "pie.lema": "The cheapest grocery shop that hits your macros, across supermarkets.",
    "pie.producto": "Product",
    "pie.legal": "Legal",
    "pie.privacidad": "Privacy",
    "pie.terminos": "Terms",
    "pie.borrar": "Delete my account",
    "pie.aviso": "Legal notice",
    "pie.fuentes": "Data sources",
    "pie.contacto": "Contact",
    "pie.noafiliado": "Gramo is not affiliated with any supermarket. Brand names belong to their owners.",
    "dialogo.titulo": "Gramo for desktop is coming soon",
    "dialogo.texto": "We're building the web version. In the meantime, Gramo is on your phone, free to start.",
    "dialogo.cerrar": "Close",
    "tienda.play.peq": "Get it on",
    "tienda.apple.peq": "Download on the",
  },
};

const IDIOMAS = ["es", "en"];

function idiomaGuardado() {
  try { return localStorage.getItem("gramo.idioma"); } catch { return null; }
}

function idiomaInicial() {
  const g = idiomaGuardado();
  if (IDIOMAS.includes(g)) return g;
  const nav = (navigator.languages || [navigator.language || "es"]).map((l) => l.slice(0, 2).toLowerCase());
  // Gramo es para España: el español gana salvo que el navegador pida inglés antes.
  const primero = nav.find((l) => IDIOMAS.includes(l));
  return primero || "es";
}

window.gramoIdioma = idiomaInicial();

window.t = function t(clave) {
  const l = window.gramoIdioma;
  return (window.GRAMO_TEXTOS[l] && window.GRAMO_TEXTOS[l][clave])
    ?? TEXTOS_COMUNES[l][clave]
    ?? (window.GRAMO_TEXTOS.es && window.GRAMO_TEXTOS.es[clave])
    ?? TEXTOS_COMUNES.es[clave]
    ?? clave;
};

window.aplicarIdioma = function aplicarIdioma(l) {
  if (l) {
    window.gramoIdioma = l;
    try { localStorage.setItem("gramo.idioma", l); } catch { /* sin almacenamiento: no pasa nada */ }
  }
  const idioma = window.gramoIdioma;
  document.documentElement.lang = idioma;
  document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll("[data-t-html]").forEach((el) => { el.innerHTML = t(el.dataset.tHtml); });
  document.querySelectorAll("[data-t-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.tAria)); });
  document.querySelectorAll("[data-idioma]").forEach((el) => { el.hidden = el.dataset.idioma !== idioma; });
  document.querySelectorAll(".idioma button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === idioma)));
  const titulo = document.body.dataset["titulo" + idioma[0].toUpperCase() + idioma.slice(1)] || document.body.dataset.tituloEs;
  if (titulo) document.title = titulo;
  document.dispatchEvent(new CustomEvent("idioma", { detail: idioma }));
};
