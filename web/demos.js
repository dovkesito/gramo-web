// Las tres demos de la portada: cesta por macros, comparar súpers y explorar.
//
// Es una simplificación propia, NO el motor de la app: 20 alimentos con macros
// estándar por 100 g y el €/kg de un producto real de cada súper (instantánea en
// datos-demo.json). El coste es el de lo que se come, sin redondear a paquetes.
// Las tres comparten la misma cesta: lo que tocas en la primera se ve en la segunda.

(async function () {
  const MERCADOS = ["Mercadona", "Carrefour", "Dia", "Eroski", "Consum", "Aldi"];
  // Colores de app/src/theme/tokens.ts: `mercados` para el punto y la barra,
  // `mercadosTexto` para escribir con ellos sobre blanco.
  const COLOR = { Mercadona: "#00A65B", Carrefour: "#004E9F", Dia: "#C8102E", Eroski: "#0F7B6C", Consum: "#E0A100", Aldi: "#FF6600" };
  const COLOR_TEXTO = { Mercadona: "#00703D", Carrefour: "#004E9F", Dia: "#C8102E", Eroski: "#0F7B6C", Consum: "#704200", Aldi: "#A34200" };
  const ICONO = {
    pollo: "🍗", huevos: "🥚", atun: "🐟", skyr: "🥛", queso: "🧀", lentejas: "🥫", garbanzos: "🥫", tofu: "🧈",
    salmon: "🍣", arroz: "🍚", avena: "🥣", pasta: "🍝", pan: "🍞", leche: "🥛", aceite: "🌿", platano: "🍌",
    manzana: "🍎", brocoli: "🥦", espinacas: "🥬", tomate: "🍅",
  };
  const NO_VEG = new Set(["pollo", "atun", "salmon"]);

  const finalTiendas = document.getElementById("final-tiendas");
  if (finalTiendas) { finalTiendas.innerHTML = botonesTienda(); aplicarIdioma(); }

  let datos;
  try {
    datos = await (await fetch("/web/datos-demo.json")).json();
  } catch {
    document.querySelectorAll("#funciones, .hero-visual").forEach((d) => { d.hidden = true; });
    return;
  }
  const P = datos.productos;
  const porId = Object.fromEntries(P.map((p) => [p.id, p]));

  // ---------- Utilidades ----------
  const fmt = (n, dec = 2) => new Intl.NumberFormat(gramoIdioma === "es" ? "es-ES" : "en-GB", { style: "currency", currency: "EUR", minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
  const num = (n) => new Intl.NumberFormat(gramoIdioma === "es" ? "es-ES" : "en-GB", { maximumFractionDigits: 0, useGrouping: "always" }).format(n);
  const tx = (clave, vars = {}) => t(clave).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  const nombre = (p) => (gramoIdioma === "es" ? p.es : p.en);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const gramos = (g) => (g >= 1000 ? `${(g / 1000).toLocaleString(gramoIdioma === "es" ? "es-ES" : "en-GB", { maximumFractionDigits: 1 })} kg` : `${Math.round(g)} g`);

  // €/kg de un producto en un súper; "todos" = el más barato de los seis.
  function eurKg(p, mercado) {
    if (mercado !== "todos") return p.precios[mercado]?.eurKg ?? null;
    let mejor = null;
    for (const m of MERCADOS) { const v = p.precios[m]?.eurKg; if (v != null && (mejor == null || v < mejor.v)) mejor = { v, m }; }
    return mejor?.v ?? null;
  }
  function mercadoMasBarato(p) {
    let mejor = null;
    for (const m of MERCADOS) { const v = p.precios[m]?.eurKg; if (v != null && (mejor == null || v < mejor.v)) mejor = { v, m }; }
    return mejor?.m ?? null;
  }

  // ---------- El «motor» de juguete ----------
  // Proteína primero (lo más barato por gramo de proteína, con castigo por repetir),
  // fruta y verdura fijas, y luego se rellenan las calorías.
  function montarCesta({ kcal, prot, dias, veg, mercado, quitados }) {
    const objetivo = { kcal: kcal * dias, prot: prot * dias };
    objetivo.grasa = (objetivo.kcal * 0.28) / 9;
    objetivo.carb = (objetivo.kcal - objetivo.prot * 4 - objetivo.grasa * 9) / 4;

    const vale = (p) => !quitados.has(p.id) && !(veg && NO_VEG.has(p.id)) && eurKg(p, mercado) != null;
    const coste = (p) => (p.racion / 1000) * eurKg(p, mercado);
    const raciones = new Map();
    // `real`: la proteína que viene de fuentes proteicas (carne, pescado, huevos,
    // lácteos proteicos, legumbres). Es la que cuenta para el objetivo, como en la
    // app: si contara la del pan y la pasta, subir las kcal ABARATARÍA la cesta,
    // porque los hidratos irían sustituyendo a la carne.
    const tot = { kcal: 0, prot: 0, real: 0, carb: 0, grasa: 0, euros: 0 };
    const meter = (p) => {
      raciones.set(p.id, (raciones.get(p.id) || 0) + 1);
      const f = p.racion / 100;
      tot.kcal += p.kcal * f; tot.prot += p.prot * f; tot.carb += p.carb * f; tot.grasa += p.grasa * f; tot.euros += coste(p);
      if (p.grupo === "prote" || p.grupo === "legumbre") tot.real += p.prot * f;
    };
    const n = (p) => raciones.get(p.id) || 0;

    // Fruta (~0,85 raciones al día, alternando) y verdura (una ración al día).
    for (const [grupo, total] of [["fruta", Math.max(1, Math.round(dias * 0.85))], ["verdura", dias]]) {
      const lista = P.filter((p) => p.grupo === grupo && vale(p)).sort((a, b) => coste(a) - coste(b)).slice(0, 2);
      for (let i = 0; i < total && lista.length; i++) meter(lista[i % lista.length]);
    }

    const elegir = (candidatos, puntos) => {
      let mejor = null, mejorPuntos = -Infinity;
      for (const p of candidatos) { const s = puntos(p); if (s > mejorPuntos) { mejorPuntos = s; mejor = p; } }
      return mejor;
    };

    // 1) Primero la proteína, de fuentes proteicas y sin mirar cuántas kcal se piden.
    const fuentes = P.filter((p) => ["prote", "legumbre"].includes(p.grupo) && vale(p));
    const masProteina = (hasta) => {
      for (let vueltas = 0; vueltas < 200 && tot.real < objetivo.prot * hasta; vueltas++) {
        const opciones = fuentes.filter((p) => n(p) < Math.ceil(dias * 2.2) && tot.kcal + p.kcal * p.racion / 100 <= objetivo.kcal * 1.05);
        const p = elegir(opciones, (p) => (p.prot * p.racion / 100) / coste(p) / (1 + 0.7 * n(p)));
        if (!p) break;
        meter(p);
      }
    };
    masProteina(0.85);

    // 2) Calorías, empujando hacia el macro que más falta (hidratos o grasa).
    const energia = P.filter((p) => ["base", "grasa", "lacteo", "legumbre", "fruta"].includes(p.grupo) && vale(p));
    for (let vueltas = 0; vueltas < 300 && tot.kcal < objetivo.kcal * 0.98; vueltas++) {
      const faltaGrasa = Math.max(0, 1 - tot.grasa / objetivo.grasa);
      const faltaCarb = Math.max(0, 1 - tot.carb / objetivo.carb);
      const caben = energia.filter((p) => {
        const tope = p.grupo === "grasa" ? dias * 4 : p.grupo === "fruta" ? dias * 2 : dias * 3;
        return n(p) < tope && tot.kcal + p.kcal * p.racion / 100 <= objetivo.kcal * 1.06;
      });
      // Mejor lo que no dispara la proteína; si ya no queda nada así, se acepta
      // pasarse (la barra lo enseñará en ámbar) antes que dejar la cesta corta de kcal.
      const sinPasarse = caben.filter((p) => tot.prot + p.prot * p.racion / 100 <= objetivo.prot * 1.11);
      const opciones = sinPasarse.length ? sinPasarse : caben;
      const p = elegir(opciones, (p) => {
        const k = p.kcal * p.racion / 100;
        const deGrasa = (p.grasa * 9) / Math.max(1, p.kcal);
        const empuje = 1 + 3 * (deGrasa * faltaGrasa + (p.carb * 4 / Math.max(1, p.kcal)) * faltaCarb);
        return (k / coste(p)) * empuje / (1 + 0.45 * n(p));
      });
      if (!p) break;
      meter(p);
    }

    // 3) Repaso de proteína por si con los hidratos no se llegó.
    masProteina(0.97);

    const lineas = [...raciones].map(([id, r]) => {
      const p = porId[id];
      const g = p.racion * r;
      return { id, p, gramos: g, coste: (g / 1000) * eurKg(p, mercado), mercado: mercado === "todos" ? mercadoMasBarato(p) : mercado };
    }).sort((a, b) => b.coste - a.coste);
    return { lineas, tot, objetivo, dias };
  }

  // Precio de una línea en un súper concreto. Si ese súper no tiene el alimento,
  // se usa el más barato del mismo grupo que sí tenga (la app hace lo mismo con
  // sus sustitutos), y se marca.
  function precioEn(linea, m, veg, quitados) {
    const v = linea.p.precios[m]?.eurKg;
    if (v != null) return { euros: (linea.gramos / 1000) * v, sust: false };
    const alt = P.filter((p) => p.grupo === linea.p.grupo && p.precios[m] && !quitados.has(p.id) && !(veg && NO_VEG.has(p.id)))
      .sort((a, b) => a.precios[m].eurKg - b.precios[m].eurKg)[0];
    if (!alt) return { euros: null, sust: true };
    return { euros: (linea.gramos / 1000) * alt.precios[m].eurKg, sust: true, alt };
  }

  // ---------- Arrastrar (ratón inmediato; en táctil, mantener pulsado) ----------
  let arrastre = null;
  // Si el elemento se repinta a mitad de arrastre, su pointerup no llega: sin esto
  // el fantasma se quedaría y el touchmove seguiría bloqueando el scroll.
  window.addEventListener("pointerup", (e) => { if (arrastre && e.pointerId === arrastre.id) cancelar(); });
  window.addEventListener("pointercancel", (e) => { if (arrastre && e.pointerId === arrastre.id) cancelar(); });
  document.addEventListener("touchmove", (e) => { if (arrastre && (arrastre.activo || arrastre.armado)) e.preventDefault(); }, { passive: false });

  function arrastrable(el, { destinos, alSoltar }) {
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("button")) return;
      cancelar(); // un segundo dedo no deja huérfano el fantasma del primero
      const tactil = e.pointerType !== "mouse";
      arrastre = { el, x0: e.clientX, y0: e.clientY, activo: false, armado: !tactil, destino: null, id: e.pointerId };
      if (tactil) {
        arrastre.reloj = setTimeout(() => {
          if (arrastre && arrastre.el === el) { arrastre.armado = true; empezar(e.clientX, e.clientY); navigator.vibrate?.(15); }
        }, 260);
      }
    });
    el.addEventListener("pointermove", (e) => {
      if (!arrastre || arrastre.el !== el) return;
      const d = Math.hypot(e.clientX - arrastre.x0, e.clientY - arrastre.y0);
      if (!arrastre.activo) {
        if (!arrastre.armado) { if (d > 8) cancelar(); return; } // en táctil, moverse antes de tiempo es hacer scroll
        if (d < 6) return;
        empezar(e.clientX, e.clientY);
      }
      mover(e.clientX, e.clientY);
    });
    const soltar = () => {
      if (!arrastre || arrastre.el !== el) return;
      const { activo, destino } = arrastre;
      cancelar();
      if (activo) alSoltar(destino);
    };
    el.addEventListener("pointerup", soltar);
    el.addEventListener("pointercancel", cancelar);

    function empezar(x, y) {
      const r = el.getBoundingClientRect();
      const f = el.cloneNode(true);
      f.classList.add("fantasma");
      Object.assign(f.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, margin: 0 });
      // El fantasma vive fuera de la demo: copiamos las variables de color que hereda.
      const css = getComputedStyle(el);
      for (const v of ["--c", "--ct"]) f.style.setProperty(v, css.getPropertyValue(v));
      document.body.appendChild(f);
      arrastre.fantasma = f; arrastre.dx = x - r.left; arrastre.dy = y - r.top; arrastre.activo = true;
      el.classList.add("arrastrando");
      try { el.setPointerCapture(arrastre.id); } catch { /* el puntero ya no existe */ }
      mover(x, y);
    }
    function mover(x, y) {
      arrastre.fantasma.style.left = `${x - arrastre.dx}px`;
      arrastre.fantasma.style.top = `${y - arrastre.dy}px`;
      const debajo = document.elementFromPoint(x, y)?.closest(destinos) || null;
      if (debajo !== arrastre.destino) {
        arrastre.destino?.classList.remove("encima");
        debajo?.classList.add("encima");
        arrastre.destino = debajo;
      }
    }
  }
  function cancelar() {
    if (!arrastre) return;
    clearTimeout(arrastre.reloj);
    arrastre.fantasma?.remove();
    arrastre.destino?.classList.remove("encima");
    arrastre.el.classList.remove("arrastrando");
    arrastre = null;
  }

  // Al repintar con innerHTML se pierde el foco: se devuelve al elemento
  // equivalente (mismo data-id) o, si ya no existe, al primero del contenedor.
  function conFoco(contenedor, selector, pintar) {
    const activo = document.activeElement;
    const tenia = activo && contenedor.contains(activo) ? activo.closest("[data-id]")?.dataset.id ?? "" : null;
    pintar();
    if (tenia == null) return;
    const destino = (tenia && (contenedor.querySelector(`${selector}[data-id="${tenia}"]`)
      || contenedor.querySelector(`[data-id="${tenia}"] ${selector}`)))
      || contenedor.querySelector(selector);
    destino?.focus();
  }

  // ---------- Estado compartido ----------
  const estado = { kcal: 2400, prot: 140, dias: 7, veg: false, mercado: "todos", quitados: new Set(), asignacion: new Map() };
  let cesta = null;
  const $ = (id) => document.getElementById(id);

  // ---------- Demo 1: cesta por macros ----------
  const sSuper = $("s-super");
  function opcionesSuper() {
    const todos = gramoIdioma === "es" ? "Los 6 súpers (lo más barato)" : "All 6 (cheapest of each)";
    sSuper.innerHTML = `<option value="todos">${todos}</option>` + MERCADOS.map((m) => `<option value="${m}">${m}</option>`).join("");
    sSuper.value = estado.mercado;
  }
  sSuper.addEventListener("change", () => { estado.mercado = sSuper.value; recalcular(); });
  for (const [id, clave] of [["r-kcal", "kcal"], ["r-prot", "prot"], ["r-dias", "dias"]]) {
    $(id).addEventListener("input", (e) => { estado[clave] = +e.target.value; recalcular(); });
  }
  $("g-dieta").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    estado.veg = b.dataset.v === "veg";
    $("g-dieta").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    recalcular();
  });

  // Como en la app: las kcal son un objetivo (±12 %) y la proteína un SUELO.
  // Pasarse de proteína no es fallar; quedarse corto, sí.
  function colorMeta(valor, meta, esSuelo) {
    const d = esSuelo ? Math.max(0, 1 - valor / meta) : Math.abs(valor / meta - 1);
    return d <= 0.12 ? "var(--ok)" : d <= 0.25 ? "var(--aviso)" : "var(--mal)";
  }

  function quitar(id) { estado.quitados.add(id); recalcular(); }

  let idsAntes = new Set();
  function pintarCesta() {
    const { lineas, tot, objetivo, dias } = cesta;
    $("v-kcal").textContent = `${num(estado.kcal)} kcal`;
    $("v-prot").textContent = `${estado.prot} g`;
    $("v-dias").textContent = tx(estado.dias === 1 ? "d1.dia" : "d1.dias.n", { n: estado.dias });
    $("c-total").textContent = fmt(tot.euros);
    $("c-pordia").textContent = tx("d1.pordia", { x: fmt(tot.euros / dias) });

    $("c-macros").innerHTML = [["kcal", "kcal", ""], ["prot", "prot", " g"], ["carb", "carb", " g"], ["grasa", "grasa", " g"]].map(([k, c, u]) => {
      // Calorías y proteína llevan semáforo, que son lo que mueves; hidratos y grasa
      // se enseñan de referencia: con 20 alimentos la demo no los puede afinar.
      const conMeta = c === "kcal" || c === "prot";
      const pct = Math.min(100, (tot[c] / objetivo[c]) * 100);
      const color = conMeta ? colorMeta(tot[c], objetivo[c], c === "prot") : "var(--tinta-3)";
      return `<div class="macro${conMeta ? "" : " info"}"><div><span>${t("macro." + k)}</span><b>${num(tot[c] / dias)}${u || " kcal"}</b></div>
        <div class="barra"><i style="width:${pct}%;background:${color}"></i></div></div>`;
    }).join("");

    const ul = $("c-lineas");
    conFoco(ul, ".x", () => { ul.innerHTML = lineas.map((l) => `
      <li class="linea${idsAntes.has(l.id) ? "" : " entra"}" data-id="${l.id}">
        <span class="ico" aria-hidden="true">${ICONO[l.id]}</span>
        <span class="nombre">${esc(nombre(l.p))}<small>${gramos(l.gramos)} · ${l.mercado}</small></span>
        <span class="precio">${fmt(l.coste)}</span>
        <button class="x" type="button" aria-label="${esc(tx("d1.quitar", { x: nombre(l.p) }))}">×</button>
      </li>`).join(""); });
    idsAntes = new Set(lineas.map((l) => l.id));
    ul.querySelectorAll(".linea").forEach((li) => {
      li.querySelector(".x").addEventListener("click", () => quitar(li.dataset.id));
      arrastrable(li, { destinos: "#c-papelera", alSoltar: (d) => { if (d) quitar(li.dataset.id); } });
    });

    const q = $("c-quitados");
    q.hidden = estado.quitados.size === 0;
    q.innerHTML = `<span>${t("d1.quitados")}</span>` + [...estado.quitados].map((id) =>
      `<button type="button" data-id="${id}" aria-label="${esc(tx("d1.devolver", { x: nombre(porId[id]) }))}">${ICONO[id]} ${esc(nombre(porId[id]))} ↺</button>`).join("");
    q.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      estado.quitados.delete(b.dataset.id);
      recalcular();
      (q.querySelector("button") || ul.querySelector(".x"))?.focus();
    }));

    // Si el súper elegido no publica el precio de algo (Aldi y la fruta), se dice.
    let aviso = $("c-aviso");
    if (!aviso) { aviso = document.createElement("p"); aviso.id = "c-aviso"; aviso.className = "pista"; $("c-papelera").before(aviso); }
    const sinFruta = estado.mercado !== "todos" && !P.some((p) => p.grupo === "fruta" && p.precios[estado.mercado]);
    aviso.hidden = !sinFruta;
    aviso.textContent = sinFruta ? tx("d1.sinfruta", { s: estado.mercado }) : "";
  }

  // ---------- Demo 2: comparar súpers ----------
  // Total de toda la cesta en cada súper. Si a un súper le falta un alimento y
  // no hay sustituto (Aldi no publica el precio de su fruta), no se inventa: el
  // total queda incompleto y se dice qué falta.
  function totalesPorSuper() {
    const r = {};
    for (const m of MERCADOS) {
      let s = 0; const faltan = [];
      for (const l of cesta.lineas) { const x = precioEn(l, m, estado.veg, estado.quitados); if (x.euros == null) faltan.push(l); else s += x.euros; }
      r[m] = { s, faltan };
    }
    return r;
  }
  const tienePrecio = (l, m) => precioEn(l, m, estado.veg, estado.quitados).euros != null;
  // El súper más barato para una línea, entre los que tienen ESE alimento. Un
  // sustituto es otro alimento: solo se usa si no lo vende nadie, para no sacar
  // una mezcla más barata que la cesta de la demo 1.
  function mejorSuperDe(l, veg = estado.veg, quitados = estado.quitados) {
    let mejor = null;
    for (const real of [true, false]) {
      for (const m of MERCADOS) {
        const x = precioEn(l, m, veg, quitados);
        if (x.euros != null && x.sust !== real && (!mejor || x.euros < mejor.e)) mejor = { m, e: x.euros };
      }
      if (mejor) break;
    }
    return mejor?.m;
  }
  function asignarOptima() { estado.asignacion = new Map(cesta.lineas.map((l) => [l.id, mejorSuperDe(l)])); }
  function asignarUna() {
    const tot = totalesPorSuper();
    const m = MERCADOS.filter((x) => !tot[x].faltan.length).sort((a, b) => tot[a].s - tot[b].s)[0];
    estado.asignacion = new Map(cesta.lineas.map((l) => [l.id, m]));
  }
  $("m-optima").addEventListener("click", () => { asignarOptima(); pintarComparar(); });
  $("m-una").addEventListener("click", () => { asignarUna(); pintarComparar(); });

  function pintarComparar() {
    // Lo que entra nuevo en la cesta va a su súper más barato; lo que ya estaba se queda donde lo puso la persona.
    const nueva = new Map();
    for (const l of cesta.lineas) {
      const antes = estado.asignacion.get(l.id);
      nueva.set(l.id, antes && tienePrecio(l, antes) ? antes : mejorSuperDe(l));
    }
    estado.asignacion = nueva;

    const tot = totalesPorSuper();
    const completos = MERCADOS.filter((m) => !tot[m].faltan.length);
    const max = Math.max(1, ...MERCADOS.map((m) => tot[m].s));
    const masBarato = completos.slice().sort((a, b) => tot[a].s - tot[b].s)[0] || MERCADOS[0];
    const mio = cesta.lineas.reduce((s, l) => s + (precioEn(l, estado.asignacion.get(l.id), estado.veg, estado.quitados).euros ?? 0), 0);
    const dif = tot[masBarato].s - mio;

    $("m-resumen").innerHTML = `<span>${t("d2.tumezcla")}</span><strong>${fmt(mio)}</strong>
      <span class="ahorro">${dif > 0.005 ? tx("d2.ahorro", { x: fmt(dif), s: masBarato }) : dif < -0.005 ? tx("d2.mas", { x: fmt(-dif), s: masBarato }) : tx("d2.igual", { s: masBarato })}</span>`;

    // Primero los que tienen la cesta entera, de más barato a más caro.
    const orden = MERCADOS.slice().sort((a, b) => (tot[a].faltan.length > 0) - (tot[b].faltan.length > 0) || tot[a].s - tot[b].s);
    conFoco($("m-filas"), ".ficha", () => { $("m-filas").innerHTML = orden.map((m) => {
      const mias = cesta.lineas.filter((l) => estado.asignacion.get(l.id) === m);
      const suyo = mias.reduce((s, l) => s + (precioEn(l, m, estado.veg, estado.quitados).euros ?? 0), 0);
      const fichas = mias.map((l) => {
        const x = precioEn(l, m, estado.veg, estado.quitados);
        const aviso = x.sust ? tx("d2.notiene", { s: m }) : "";
        const etiqueta = `${nombre(l.p)}, ${fmt(x.euros)}${aviso ? ". " + aviso : ""}. ${t("d2.siguiente")}`;
        return `<span class="ficha${x.sust ? " sust" : ""}" data-id="${l.id}" role="button" tabindex="0" aria-label="${esc(etiqueta)}"${aviso ? ` title="${esc(aviso)}"` : ""}>${ICONO[l.id]} ${esc(nombre(l.p))} <b>${fmt(x.euros)}</b></span>`;
      }).join("") || `<span class="vacio">${t("d2.vacio")}</span>`;
      return `<div class="fila-super" data-m="${m}" style="--c:${COLOR[m]};--ct:${COLOR_TEXTO[m]}">
        <div class="fila-cab"><b>${m}</b><span class="barra"><i style="width:${(tot[m].s / max) * 100}%"></i></span>
        <span class="todo">${tot[m].faltan.length ? esc(tx("d2.falta", { x: tot[m].faltan.map((l) => nombre(l.p).toLowerCase()).join(", ") })) : esc(tx("d2.todoen", { s: "" }).trim()) + " " + fmt(tot[m].s)}</span><span class="suyo">${mias.length ? fmt(suyo) : ""}</span></div>
        <div class="fichas">${fichas}</div></div>`;
    }).join(""); });

    $("m-filas").querySelectorAll(".ficha").forEach((f) => {
      const mover = (m) => { estado.asignacion.set(f.dataset.id, m); pintarComparar(); };
      const linea = cesta.lineas.find((l) => l.id === f.dataset.id);
      arrastrable(f, { destinos: ".fila-super", alSoltar: (d) => { if (d && tienePrecio(linea, d.dataset.m)) mover(d.dataset.m); } });
      // Con el ratón o el dedo, solo arrastrando (un clic suelto movía fichas sin
      // querer). Desde el teclado, Intro o Espacio la pasan al siguiente súper.
      const siguiente = () => {
        const actual = f.closest(".fila-super").dataset.m;
        const i = orden.indexOf(actual);
        const sig = [...orden.slice(i + 1), ...orden.slice(0, i)].find((m) => tienePrecio(linea, m));
        if (sig) mover(sig);
      };
      f.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); siguiente(); } });
    });
  }

  // ---------- Demo 3: explorar y compartir ----------
  const EXPLORAR = [
    { id: "volumen", emoji: "💪", kcal: 3000, prot: 180, veg: false },
    { id: "definicion", emoji: "🔥", kcal: 1900, prot: 160, veg: false },
    { id: "veg", emoji: "🌱", kcal: 2200, prot: 110, veg: true },
    { id: "estudiante", emoji: "🎓", kcal: 2300, prot: 100, veg: false },
    { id: "equilibrada", emoji: "⚖️", kcal: 2100, prot: 120, veg: false },
  ].map((e) => ({ ...e, cesta: montarCesta({ ...e, dias: 7, mercado: "todos", quitados: new Set() }) }));
  let elegida = EXPLORAR[0].id;

  function pintarExplorar() {
    const car = $("e-carrusel");
    conFoco(car, ".cesta-tarjeta", () => { car.innerHTML = EXPLORAR.map((e) => `
      <button class="cesta-tarjeta" type="button" data-id="${e.id}" aria-pressed="${e.id === elegida}">
        <span class="emoji" aria-hidden="true">${e.emoji}</span><strong>${t("e." + e.id)}</strong>
        <small>${t("e." + e.id + ".d")}</small>
        <span class="p">${fmt(e.cesta.tot.euros, 0)} <span>${t("d3.semana")}</span></span>
      </button>`).join(""); });
    car.querySelectorAll(".cesta-tarjeta").forEach((b) => b.addEventListener("click", () => {
      if (car.dataset.movido) return;
      elegida = b.dataset.id; pintarExplorar();
    }));
    pintarVista(false);
  }

  function pintarVista(compartida) {
    const e = EXPLORAR.find((x) => x.id === elegida);
    const precio = fmt(e.cesta.tot.euros);
    const ahora = new Date().toLocaleTimeString(gramoIdioma === "es" ? "es-ES" : "en-GB", { hour: "2-digit", minute: "2-digit" });
    $("e-vista").innerHTML = `
      <div class="vista-cab"><span class="emoji" aria-hidden="true">${e.emoji}</span>
        <div><h4>${t("e." + e.id)}</h4><small>${t("e." + e.id + ".d")}</small></div><span class="p">${precio}</span></div>
      <div class="mini-lista">${e.cesta.lineas.map((l) => `<span>${ICONO[l.id]} ${esc(nombre(l.p))} · ${gramos(l.gramos)}</span>`).join("")}</div>
      <div class="vista-acciones">
        <button class="btn-demo" type="button" id="e-compartir">↗ ${t("d3.compartir")}</button>
        <button class="btn-demo claro" type="button" data-usar>${t("d3.usar")}</button>
      </div>
      ${compartida ? `<div class="chat"><div class="burbuja">
        <div class="previa"><img src="/c/icono.png" alt=""><span><b>${t("d3.enlace")}</b><small>${t("d3.enlace2")}</small></span></div>
        <p>${esc(tx("d3.mensaje", { n: t("e." + e.id), p: precio }))}<br><a>gramo-app.netlify.app/c/?e=…</a></p>
        <span class="hora">${ahora} ✓✓</span></div></div>` : ""}`;
    $("e-compartir").addEventListener("click", () => { pintarVista(true); $("e-compartir").focus(); });
  }

  // Arrastrar el carrusel con el ratón (en táctil ya se desliza solo).
  (function () {
    const car = $("e-carrusel");
    let x0 = null, s0 = 0;
    car.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; x0 = e.clientX; s0 = car.scrollLeft; delete car.dataset.movido; });
    window.addEventListener("pointermove", (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 5) { car.dataset.movido = "1"; car.classList.add("cogido"); }
      car.scrollLeft = s0 - dx;
    });
    window.addEventListener("pointerup", () => {
      if (x0 == null) return;
      x0 = null; car.classList.remove("cogido");
      setTimeout(() => delete car.dataset.movido, 0);
    });
  })();

  // ---------- Hero y nota ----------
  function pintarHero() {
    const base = montarCesta({ kcal: 2400, prot: 150, dias: 7, veg: false, mercado: "todos", quitados: new Set() });
    // La mezcla, calculada como «Mezcla más barata» en la demo 2, para que las cifras cuadren.
    const mezcla = base.lineas.reduce((acc, l) => acc + precioEn(l, mejorSuperDe(l, false, new Set()), false, new Set()).euros, 0);
    $("hero-precio").textContent = fmt(mezcla);
    $("hero-prot").textContent = tx("hero.tf1pie", { p: num(base.tot.prot), o: num(150 * 7) });
  }

  function recalcular() {
    cancelar();
    cesta = montarCesta(estado);
    pintarCesta();
    pintarComparar();
  }

  function pintarTodo() {
    opcionesSuper();
    recalcular();
    pintarExplorar();
    pintarHero();
  }
  document.addEventListener("idioma", pintarTodo);
  pintarTodo();
})();
