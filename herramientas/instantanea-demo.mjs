// Instantánea de productos para las demos de gramo.dev. Solo lectura.
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(process.argv[2], "utf8").split(/\r?\n/)
  .filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL, KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const MARKETS = {
  Mercadona: "mercadona_id=not.ilike.*aldi.es*&mercadona_id=not.ilike.*dia.es*&mercadona_id=not.ilike.*eroski.es*&mercadona_id=not.ilike.*consum.es*&mercadona_id=not.like./*&mercadona_id=not.like.carrefour:*",
  Carrefour: "or=(mercadona_id.like./*,mercadona_id.like.carrefour:*)",
  Dia: "mercadona_id=ilike.*dia.es*",
  Eroski: "mercadona_id=ilike.*eroski.es*",
  Consum: "mercadona_id=ilike.*consum.es*",
  Aldi: "mercadona_id=ilike.*aldi.es*",
};
// id, nombre es, nombre en, patrón(es) de nombre, ración en g para la demo, grupo
const CONCEPTOS = [
  ["pollo", "Pechuga de pollo", "Chicken breast", ["pechuga*pollo*", "*filete*pechuga*"], 150, "prote"],
  ["huevos", "Huevos L", "Eggs L", ["huevos*", "huevo*"], 120, "prote"],
  ["atun", "Atún claro al natural", "Light tuna in water", ["atún claro*natural*", "atun claro*natural*"], 80, "prote"],
  ["skyr", "Yogur tipo skyr", "Skyr yogurt", ["*skyr*"], 150, "prote"],
  ["queso", "Queso fresco batido 0%", "Quark 0%", ["*queso fresco batido*"], 200, "prote"],
  ["lentejas", "Lentejas cocidas", "Cooked lentils", ["lentejas cocidas*", "*lenteja*cocida*"], 200, "legumbre"],
  ["garbanzos", "Garbanzos cocidos", "Cooked chickpeas", ["garbanzos cocidos*", "*garbanzo*cocido*"], 200, "legumbre"],
  ["tofu", "Tofu", "Tofu", ["tofu*"], 150, "prote"],
  ["salmon", "Salmón", "Salmon", ["*lomo*salmón*", "salmón*"], 125, "prote"],
  ["arroz", "Arroz redondo", "Round rice", ["arroz redondo*", "arroz*"], 80, "base"],
  ["avena", "Copos de avena", "Rolled oats", ["copos*avena*"], 50, "base"],
  ["pasta", "Macarrones", "Macaroni", ["macarrones*"], 80, "base"],
  ["pan", "Pan integral de molde", "Wholemeal sandwich bread", ["pan*molde*integral*", "pan integral*"], 60, "base"],
  ["leche", "Leche semidesnatada", "Semi-skimmed milk", ["leche semidesnatada*"], 250, "lacteo"],
  ["aceite", "Aceite de oliva virgen extra", "Extra virgin olive oil", ["aceite de oliva virgen extra*"], 15, "grasa"],
  ["platano", "Plátano", "Banana", ["plátano*", "platano*", "banana*"], 120, "fruta"],
  ["manzana", "Manzana", "Apple", ["manzana*"], 150, "fruta"],
  ["brocoli", "Brócoli", "Broccoli", ["brócoli*", "brocoli*"], 150, "verdura"],
  ["espinacas", "Espinacas", "Spinach", ["espinaca*"], 100, "verdura"],
  ["tomate", "Tomate triturado", "Crushed tomato", ["tomate triturado*"], 100, "verdura"],
];
const EXCLUIR = /chocolate|sorpresa|rellen|loncha|braseada|barbacoa|ahumad|boloñesa|cheese|gratinad|sabor|canela|smoothie|microondas|crema|cocinar|tarrina|soja-coco|vegetales|espelta|cebolla|bajo de sal|1\/2|cocid[ao] en|tortilla|ensalada|pizza|zumo|batido de (fresa|frutas|vainilla)|galleta|barrita|marinad|bechamel|empanad|hierbas|ajillo|coliflor|congelad/i;
// Macros estándar por 100 g (tablas de composición), no las del producto concreto:
// la demo compara alimentos, no marcas.
const MACROS = {
  pollo: { kcal: 110, prot: 23, carb: 0, grasa: 1.8 }, huevos: { kcal: 143, prot: 12.6, carb: 0.7, grasa: 9.5 },
  atun: { kcal: 100, prot: 23, carb: 0, grasa: 1 }, skyr: { kcal: 62, prot: 11, carb: 4, grasa: 0.2 },
  queso: { kcal: 46, prot: 8, carb: 3.5, grasa: 0.2 }, lentejas: { kcal: 90, prot: 7.5, carb: 12, grasa: 0.5 },
  garbanzos: { kcal: 120, prot: 7, carb: 15, grasa: 2.5 }, tofu: { kcal: 120, prot: 13, carb: 1.5, grasa: 7 },
  salmon: { kcal: 200, prot: 20, carb: 0, grasa: 13 }, arroz: { kcal: 350, prot: 7, carb: 78, grasa: 0.8 },
  avena: { kcal: 370, prot: 13, carb: 59, grasa: 7 }, pasta: { kcal: 355, prot: 12, carb: 72, grasa: 1.5 },
  pan: { kcal: 240, prot: 10, carb: 40, grasa: 3.5 }, leche: { kcal: 46, prot: 3.2, carb: 4.7, grasa: 1.6 },
  aceite: { kcal: 884, prot: 0, carb: 0, grasa: 100 }, platano: { kcal: 90, prot: 1.1, carb: 20, grasa: 0.3 },
  manzana: { kcal: 52, prot: 0.3, carb: 12, grasa: 0.2 }, brocoli: { kcal: 34, prot: 2.8, carb: 4.5, grasa: 0.4 },
  espinacas: { kcal: 23, prot: 2.9, carb: 1.4, grasa: 0.4 }, tomate: { kcal: 30, prot: 1.3, carb: 4.5, grasa: 0.2 },
};
const COLS = "name,unit_price,package_grams,energy_kcal_100g,protein_100g,carbs_100g,fat_100g";

async function buscar(market, patron) {
  const u = `${URL_}/rest/v1/products_with_nutrition?select=${COLS}&name=ilike.${encodeURIComponent(patron)}&${MARKETS[market]}&unit_price=gt.0&package_grams=gt.0&energy_kcal_100g=not.is.null&protein_100g=not.is.null&order=unit_price.asc&limit=60`;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(u, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, signal: ctl.signal });
    return r.ok ? r.json() : [];
  } finally { clearTimeout(t); }
}

const out = { fecha: new Date().toISOString().slice(0, 10), productos: [] };
for (const [id, es, en, patrones, racion, grupo] of CONCEPTOS) {
  const precios = {}; 
  for (const m of Object.keys(MARKETS)) {
    let filas = [];
    for (const p of patrones) { filas = (await buscar(m, p)).filter((f) => !EXCLUIR.test(f.name)); if (filas.length) break; }
    filas = filas.filter((f) => !EXCLUIR.test(f.name));
    if (!filas.length) continue;
    // Mediana por €/kg de lo que encaja: ni el paquete raro más barato ni el más caro.
    filas = filas.map((f) => ({ ...f, eurKg: f.unit_price / f.package_grams * 1000 })).sort((a, b) => a.eurKg - b.eurKg);
    const f = filas[Math.floor((filas.length - 1) / 2)];
    const eurKg = f.eurKg;
    precios[m] = { eurKg: +eurKg.toFixed(2), nombre: f.name };

  }
  out.productos.push({ id, es, en, racion, grupo, ...MACROS[id], precios });
  for (const [m, v] of Object.entries(precios)) console.error(id, m, v.eurKg, v.nombre);
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
