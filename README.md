[README.md](https://github.com/user-attachments/files/28349443/README.md)
# Aumovio Padel

Aplicación web para organizar torneos de pádel con rotación automática de parejas y **sincronización en tiempo real entre dispositivos** vía Netlify Functions + Netlify Blobs (sin terceros, todo dentro de tu cuenta de Netlify).

![Aumovio Padel](https://img.shields.io/badge/version-1.6-d4ff3f) ![License](https://img.shields.io/badge/license-MIT-737373)

## Características

- 🔄 **Sincronización automática** — los datos viven en Netlify Blobs y se propagan entre dispositivos cada ~4 segundos
- 🔐 **Login privado** (usuario y contraseña configurables)
- 🛡️ **Gate admin** para acciones destructivas (borrar historial / reset total)
- 🎾 **Rotación inteligente** de parejas y descansos para que todos jueguen con todos
- 🚫 **Nadie descansa dos veces seguidas** — quien descansa una ronda tiene prioridad para jugar la siguiente
- ✏️ **Puntuaciones editables en cualquier ronda** — navega entre rondas (incluidas las finalizadas) y corrige marcadores por pista; la clasificación se recalcula al instante
- 📝 **Torneos del historial editables (con admin)** — corrige nombre y marcadores de torneos ya archivados; el campeón y la clasificación se recalculan automáticamente
- 🔢 **Sin límite de puntos** — registras el resultado que quieras, terminas la ronda cuando quieras
- ➕ **Añadir o quitar jugadores y pistas** durante el torneo
- 📊 **Historial completo** de todos los torneos archivados
- 📱 **Mobile-first** con tema oscuro
- 🛟 **Fallback local** — si la API no está disponible, la app sigue funcionando con localStorage

## Credenciales

### Login normal (acceso a la app)

| Usuario   | Contraseña |
|-----------|------------|
| `aumovio` | `aumovio`  |

### Gate admin (borrar historial / reset)

| Usuario | Contraseña  |
|---------|-------------|
| `admin` | `padelrifa` |

Las acciones de **eliminar un torneo del historial** y **borrar todos los datos** piden estas credenciales adicionales, así nadie las dispara por accidente.

---

## Actualizar un deploy existente (sin perder el historial)

Si ya tienes la app desplegada en Netlify y solo quieres subir esta versión nueva:

1. **Reemplaza los archivos** de tu repo con los de esta versión. Los únicos que cambian entre versiones suelen ser `index.html`, `package.json` y `README.md` — el resto (`netlify.toml`, `netlify/functions/store.mjs`, `LICENSE`, `.gitignore`) se mantienen igual.

2. **Push a GitHub:**
   ```bash
   git add .
   git commit -m "Actualizar Aumovio Padel"
   git push
   ```

3. Netlify **auto-despliega** en 1-2 minutos. No tienes que tocar nada en el panel de Netlify.

> ✅ **El historial NO se borra.** Los datos viven en Netlify Blobs (store `aumovio-padel-data`, clave `state`) y en `localStorage` (`aumovio_data_v2`). Mientras no cambies esas claves ni pulses "Borrar todos los datos", todos tus torneos archivados y el torneo en curso se conservan tras la actualización. Esta versión mantiene la misma estructura de datos, así que la migración es transparente.

> 💡 Tras desplegar, si la app no muestra los cambios, haz un **hard refresh** (Ctrl/Cmd + Shift + R) o en Netlify: **Deploys → Trigger deploy → Clear cache and deploy site**.

---

## Despliegue (5 minutos, solo GitHub + Netlify)

### 1. Sube los archivos a GitHub

```bash
git init
git add .
git commit -m "Initial commit: Aumovio Padel"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/aumovio-padel.git
git push -u origin main
```

(O usa la UI de GitHub: **New repository → Add files → Upload files → Drag & drop**.)

### 2. Conecta el repo a Netlify

1. Ve a [app.netlify.com](https://app.netlify.com) y entra (puedes usar la misma cuenta de GitHub).
2. Click en **Add new site → Import an existing project**.
3. Selecciona **GitHub** y autoriza si te lo pide.
4. Busca el repo que acabas de crear y haz click.
5. En la pantalla de configuración:
   - **Branch to deploy**: `main`
   - **Build command**: déjalo vacío
   - **Publish directory**: `.` (un punto)
   
   *(Netlify lee `netlify.toml` automáticamente y configura todo, no tienes que tocar nada más.)*
6. Click **Deploy site**.

A los ~30 segundos tu app está en una URL tipo `https://random-name-12345.netlify.app/`.

### 3. (Opcional) Cambia el nombre del subdominio

En Netlify: **Site configuration → Change site name** → ponle algo como `aumovio-padel` y queda en `https://aumovio-padel.netlify.app/`.

### 4. ¡Listo!

Abre la URL en varios dispositivos. Cuando registres puntos en uno, el otro lo verá en ~4 segundos. ✨

---

## ¿Cómo funciona la sincronización?

El frontend (la app) llama a un endpoint serverless `/api/store` (una **Netlify Function** definida en `netlify/functions/store.mjs`).

Esa función lee y escribe en **Netlify Blobs**, un almacén clave-valor que Netlify ofrece **gratis y de forma automática** en todos los sitios. No hay que configurar nada: ni base de datos, ni claves de API, ni terceros.

- `GET /api/store` → devuelve el estado completo `{ active, history, updatedAt }`
- `POST /api/store` → recibe acciones (`set-active`, `archive`, `delete-history`, `reset`) y actualiza

El cliente:
- Hace una petición inicial al cargar
- Repite cada 4 segundos (solo cuando la pestaña está visible)
- También consulta al volver a la pestaña (`visibilitychange`)
- Solo se actualiza la UI si el `updatedAt` del servidor es más nuevo que el local

Para escrituras se hace **optimistic update**: la UI cambia al instante y luego se sincroniza con el servidor.

## Indicador de estado

En la cabecera siempre se ve el estado actual de sync:

- 🟢 **Sincronizado** — todo OK, conectado al servidor
- 🟠 **Local** — la API no responde, datos solo en este dispositivo
- 🟠 **Reintentando** (parpadeo) — hubo un fallo puntual, intentando recuperar
- 🔴 **Error sync** — error persistente
- ⚪ **Conectando** — al arrancar la app

## Cambiar credenciales

### Login normal

Edita `index.html`. Busca:

```js
if (user.trim().toLowerCase() === "aumovio" && pass === "aumovio") {
```

Sustituye ambos `"aumovio"` por las nuevas credenciales.

### Credenciales admin (para borrar historial / reset)

Edita `index.html`. Busca:

```js
if (user.trim().toLowerCase() === "admin" && pass === "padelrifa") {
```

Sustituye `"admin"` y `"padelrifa"` por las que prefieras.

> ⚠️ Toda la autenticación es client-side, sirve como puerta visual, no como seguridad real. Cualquiera con la URL y las credenciales puede ver los datos. La gate admin solo protege contra borrados accidentales por parte de gente del equipo.

## Cambiar el token de la API

El endpoint `/api/store` valida un header `X-Aumovio-Token`. Por defecto vale `"aumovio"`. Si quieres cambiarlo:

1. Edita `netlify/functions/store.mjs`, línea: `const TOKEN = "aumovio";`
2. Edita `index.html`, línea: `const API_TOKEN = "aumovio";`
3. Ambos deben coincidir.

Igual que con la contraseña, esto **no es seguridad real**, pero filtra escaneos automáticos.

## Estructura del proyecto

```
aumovio-padel/
├── index.html                          # App completa (React + lógica + estilos)
├── netlify.toml                        # Configuración de Netlify
├── netlify/
│   └── functions/
│       └── store.mjs                   # API serverless (GET/POST → Netlify Blobs)
├── README.md
├── LICENSE
└── .gitignore
```

Toda la app vive en `index.html` (React 18 + Tailwind vía CDN, sin build step). La función serverless es un único archivo `.mjs` que Netlify detecta automáticamente.

## Cómo se usa

1. **Login** con `aumovio` / `aumovio` (en cada dispositivo, una sola vez).
2. **Nuevo torneo** → nombre, jugadores (mínimo 4), pistas.
3. **Empieza** y registra los resultados de cada partido. Las parejas y descansos rotan automáticamente.
4. **Terminar ronda** cuando todos los partidos hayan terminado (sin límite de puntos).
5. **Añadir jugadores** en cualquier momento desde el contador de jugadores.
6. **Finalizar torneo** desde el enlace en la barra inferior.
7. **Archivar** el torneo para guardarlo en el historial.
8. **Historial** consultable desde el menú principal — todos los dispositivos ven los mismos torneos.
9. **Ajustes → Borrar todos los datos** para empezar de cero.

## Formato del torneo

Cada ronda las parejas se redistribuyen automáticamente para que cada jugador acabe jugando con todos los demás. El algoritmo minimiza repeticiones de pareja y de oponente, y rota los descansos cuando el número de jugadores no es múltiplo de 4.

**Configuraciones óptimas (nadie descansa):**

| Jugadores | Pistas |
|-----------|--------|
| 4         | 1      |
| 8         | 2      |
| 12        | 3      |
| 16        | 4      |
| 20        | 5      |
| 24        | 6      |

## Cuotas Netlify (plan gratuito)

El plan **Starter** (gratis) de Netlify incluye:

- 100 GB de ancho de banda al mes
- 125.000 invocaciones de funciones al mes
- 1 GB de almacenamiento en Netlify Blobs
- 100 GB de transferencia desde Blobs al mes

Para uso normal (un grupo de amigos que juega tournament cada cierto tiempo) **el plan gratis es más que suficiente** — apenas usarás un 1-2% de las cuotas.

Cálculo aproximado: con 4 dispositivos abiertos durante 2 horas de torneo, son ~7.000 invocaciones (polling cada 4s × 4 dispositivos × 7.200 segundos / 4 ≈ 7.200). Es decir, podrías hacer ~17 torneos al mes solo con la cuota gratuita.

## Probarlo localmente (sin Netlify)

Si abres `index.html` directamente en el navegador (o con un servidor local sin Netlify), la app detecta que `/api/store` no existe y cae en **modo local** automáticamente. Funciona igual, pero sin sincronización entre dispositivos.

```bash
# Servidor local cualquiera
python -m http.server 8000
# Abrir http://localhost:8000
```

Para probar la sincronización en local, instala la CLI de Netlify y usa `netlify dev`:

```bash
npm install -g netlify-cli
netlify dev
```

## Troubleshooting

### El indicador dice "Local" en lugar de "Sincronizado"

Esto significa que la función serverless no está respondiendo. Pasos para diagnosticar:

**1. Comprueba que la función está desplegada**

Ve a Netlify dashboard → tu sitio → pestaña **Functions**. Deberías ver una función llamada `store`. Si no aparece:
- Ve a **Deploys** → último deploy → mira el log
- Busca la sección "Functions bundling" — debería decir "1 function bundled"
- Si dice "0 functions bundled", el directorio no se está detectando. Confirma que tienes el archivo en `netlify/functions/store.mjs`

**2. Prueba el endpoint directo de Netlify**

Abre en el navegador (con tu URL):
```
https://TU-SITIO.netlify.app/.netlify/functions/store
```

- Si responde con `{"error":"Unauthorized"}` ✅ la función funciona, solo falta el token (es el comportamiento correcto)
- Si responde 404 ❌ la función no se desplegó. Mira los deploy logs

**3. Prueba el endpoint con el redirect**

```
https://TU-SITIO.netlify.app/api/store
```

- Si responde con `{"error":"Unauthorized"}` ✅ todo correcto, el redirect funciona
- Si responde 404 ❌ el redirect no está activo. Confirma que `netlify.toml` tiene la sección `[[redirects]]` y haz un nuevo deploy

**4. Fuerza un nuevo deploy**

En Netlify: **Deploys → Trigger deploy → Clear cache and deploy site**. Esto fuerza a Netlify a re-leer `netlify.toml` y re-bundlear las funciones.

**5. Mira los logs en vivo de la función**

Netlify dashboard → Functions → `store` → "Function logs". Abre la app en otra pestaña y verás líneas tipo:
```
[Aumovio API] GET /.netlify/functions/store
```

Si no ves nada cuando la app carga, la función ni siquiera se está invocando (problema de routing).

### Error 500 en la función

Si `/api/store` responde 500, la función SE invoca pero falla. Suele ser un problema con Netlify Blobs. Verifica:
- El nombre del sitio en Netlify no contiene caracteres raros
- Has hecho un deploy *después* de configurar el sitio (no solo subir archivos)
- El plan de Netlify es Starter o superior (Blobs requiere cuenta)

## Licencia

MIT — Ver `LICENSE`.
