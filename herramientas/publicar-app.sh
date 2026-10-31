#!/usr/bin/env bash
# Exporta la app de Gramo (repo gramo, carpeta app/) a web y la deja en app/,
# que es lo que Netlify sirve en gramo.dev/app. Después: revisar, commit y push.
#
#   herramientas/publicar-app.sh [ruta-a-gramo-app-web/app]
#
# Notas que costó averiguar:
# - GRAMO_WEB_BASE la lee app.config.js para poner `experiments.baseUrl`. Va por
#   variable y NO en app.json ni como script de package.json porque las dos
#   cosas entran en la huella de las OTA (runtimeVersion: fingerprint): cambiarlas
#   dejaría sin actualizaciones a los móviles con la build instalada.
# - MSYS_NO_PATHCONV=1: en Git Bash, sin esto «/app» llega convertido en
#   «C:/Program Files/Git/app» y la web pide sus .js a esa ruta.
# - Se exporta a una carpeta aparte y luego se cambia por app/: así un export a
#   medias nunca deja la web rota.
set -euo pipefail

# `pwd -W` da la ruta de Windows (C:/...): con MSYS_NO_PATHCONV, una /c/... no se traduciría.
AQUI="$(cd "$(dirname "$0")/.." && (pwd -W 2>/dev/null || pwd))"
APP="${1:-$AQUI/../gramo-app-web/app}"
TMP="$AQUI/.app-nueva"

rm -rf "$TMP"
( cd "$APP" && MSYS_NO_PATHCONV=1 GRAMO_WEB_BASE=/app npx expo export -p web --output-dir "$TMP" )

grep -q 'src="/app/_expo/' "$TMP/index.html" || { echo "El index.html no apunta a /app/_expo: revisa GRAMO_WEB_BASE" >&2; exit 1; }

rm -rf "$AQUI/app"
mv "$TMP" "$AQUI/app"
echo "Listo: $AQUI/app"
