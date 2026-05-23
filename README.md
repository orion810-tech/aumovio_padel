# Aumovio Padel

Aplicación web para organizar torneos de pádel con rotación automática de parejas. Genera todas las rondas necesarias para que todos jueguen con todos, lleva la clasificación en tiempo real y archiva el histórico de torneos.

![Aumovio Padel](https://img.shields.io/badge/version-1.0-d4ff3f) ![License](https://img.shields.io/badge/license-MIT-737373)

## Características

- **Login privado** con usuario y contraseña configurables
- **Rotación inteligente** de parejas y descansos para que todos jueguen con todos
- **Sin límite de puntos** — registra el resultado que quieras, terminas la ronda cuando quieras
- **Añadir o quitar jugadores** durante el torneo
- **Historial completo** de todos los torneos archivados, con clasificación y rondas detalladas
- **Reset total** de datos desde ajustes
- **Persistencia local** — los torneos se guardan en el navegador
- **Mobile-first** con tema oscuro

## Credenciales

| Usuario   | Contraseña |
|-----------|------------|
| `aumovio` | `aumovio`  |

> ⚠️ **Aviso de seguridad**: la autenticación es solo client-side y sirve únicamente como puerta de entrada visual. Cualquiera con conocimientos técnicos puede ver las credenciales en el código fuente. Para uso en producción con datos sensibles, añadir un backend con autenticación real.

## Despliegue

### Opción 1 — GitHub Pages (recomendado)

1. Crea un nuevo repositorio en GitHub (público o privado con plan Pro).
2. Sube estos archivos al repo:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```
3. Ve a **Settings → Pages**.
4. En **Source**, selecciona `main` y carpeta `/ (root)`.
5. Guarda. En 1-2 minutos tu app estará en `https://TU_USUARIO.github.io/TU_REPO/`.

### Opción 2 — Netlify / Vercel

Arrastra la carpeta del proyecto a [netlify.com/drop](https://app.netlify.com/drop) o conecta el repo en [vercel.com](https://vercel.com). Sin configuración.

### Opción 3 — Local

```bash
# Opción A: abrir directamente
open index.html

# Opción B: servidor local
python -m http.server 8000
# luego visita http://localhost:8000
```

## Cómo cambiar las credenciales

Edita la línea correspondiente en `index.html`. Busca:

```js
if (user.trim().toLowerCase() === "aumovio" && pass === "aumovio") {
```

Sustituye ambos `"aumovio"` por las nuevas credenciales.

## Estructura del proyecto

```
aumovio-padel/
├── index.html      # App completa (React + lógica + estilos)
├── README.md       # Este archivo
├── LICENSE         # Licencia MIT
└── .gitignore      # Archivos ignorados por git
```

Toda la aplicación vive en `index.html` para simplificar el despliegue. Usa React 18, Tailwind CSS y Babel Standalone vía CDN — sin compilación ni build step.

## Cómo se usa

1. **Login** con `aumovio` / `aumovio`.
2. **Nuevo torneo** → añade jugadores (mínimo 4), elige pistas, dale un nombre.
3. **Empieza** y registra los resultados de cada partido. Las parejas y descansos rotan automáticamente.
4. **Terminar ronda** cuando todos los partidos hayan terminado (sin límite de puntos: registras lo que sea).
5. **Añadir jugadores** en cualquier momento desde el contador de jugadores en la cabecera del torneo.
6. **Finalizar torneo** desde el enlace en la barra inferior cuando quieras cerrar.
7. **Archivar** el torneo para guardarlo en el historial.
8. **Historial** consultable desde el menú principal.
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

Cualquier otra combinación también funciona; algunos jugadores descansarán por ronda y el sistema irá rotando para que sea justo.

## Persistencia

Los datos se guardan en el `localStorage` del navegador bajo las claves:
- `aumovio_auth_v1` — estado de sesión
- `aumovio_data_v1` — torneo activo + historial

Esto significa que los datos viven en el navegador del dispositivo. No hay backend ni sincronización entre dispositivos. Para limpiar todo: `Ajustes → Borrar todos los datos`.

## Licencia

MIT — Ver `LICENSE`.
