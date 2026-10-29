# gramo-web

La web de Gramo: **gramo.dev** (y `gramo-app.netlify.app`). HTML, CSS y JS sin build; Netlify publica la rama `main` tal cual.

| Ruta | Qué es |
|---|---|
| `/` | Portada con las tres demos jugables (`web/demos.js`, datos en `web/datos-demo.json`) |
| `/descargar/` | Enlaces a Google Play y App Store |
| `/legal/` | Privacidad, términos, aviso legal, fuentes y borrar cuenta (es + traducción en) |
| `/c/` | Página puente de las cestas compartidas. **La usa la app: no tocar** (ni `/estilo.css`, que es suya) |
| `/.well-known/` + `_headers` | Verificación de App Links y Universal Links. **No tocar** |

- Cabecera, pie y el aviso de «Usar Gramo» salen de `web/marco.js`. Cuando exista Gramo para el ordenador, basta con poner su ruta en `URL_APP_WEB`.
- Textos: los comunes en `web/i18n.js`, los de la portada en `web/textos-portada.js`. Los documentos largos van duplicados en el HTML con `data-idioma="es"` / `"en"`.

## Ojo: la política está en DOS sitios

Las tiendas siguen apuntando a `dovkesito.github.io/gramo-legal`, que no se ha tocado. `legal/` aquí es una copia. **Al cambiar un documento legal, cámbialo en los dos repos** (y su traducción inglesa aquí).

## Datos de las demos

`web/datos-demo.json` es una instantánea: 20 alimentos con macros estándar y, por súper, la mediana del €/kg de los productos que encajan. La saca `herramientas/instantanea-demo.mjs` (solo lectura contra Supabase, con la clave pública del `.env` de la app): `node herramientas/instantanea-demo.mjs ../gramo-app-web/app/.env web/datos-demo.json`. Para refrescarla basta con volver a ejecutarlo: el script apunta la fecha en el JSON y la web la enseña.
