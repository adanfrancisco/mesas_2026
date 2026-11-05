# Mesas ISFT N°93 — Avisos a docentes

Aplicación web para organizar el aviso de mesas de examen a los docentes del
**ISFT N°93**: lee la hoja de mesas (una solapa por carrera), agrupa las mesas en las que
cada docente es **titular** o **acompañante**, cruza con la hoja de correos y crea
**borradores de correo en tu Gmail institucional** para que los revises y envíes.

## Cómo funciona (paso a paso)

1. **Conectar con Google** — botón de conexión; pedí permiso para leer hojas
   (solo lectura) y crear borradores en Gmail (la app **nunca envía** correos).
2. **Elegir las hojas** — pegá el link de la _hoja de mesas_ y el de la _hoja de
   docentes/correos_, buscá sus solapas y cargá la que quieras explorar.
3. **Columnas** — la app detecta automáticamente la fila de encabezados y las columnas
   (fecha, hora, materia, carrera, titular, acompañantes…); revisá/corregí el mapeo con
   la vista previa resaltada.
4. **Docentes** — cada docente aparece con todas sus mesas (fecha, materia, rol, colegas)
   y el estado del correo: exacto, probable, conflicto, sin correo o asignado a mano.
   Los pendientes se resuelven con un selector.
5. **Borradores** — editá la plantilla (asunto y cuerpo con placeholders
   `{{docente}}`, `{{cantidad}}`, `{{mesas}}`, `{{colegas}}`), mirá la vista previa y
   creá los borradores en tu Gmail. Después entrás a Gmail → Borradores, revisás y
   enviás.

## Requisitos

- Cuenta **Google Workspace institucional** del ISFT N°93 (o Gmail con hojas
  compartidas a tu cuenta).
- Un **OAuth Client ID** de Google Cloud: guía completa en
  [docs/google-cloud-setup.md](docs/google-cloud-setup.md).
- Node.js 20+ (para desarrollo local).

## Desarrollo local

```bash
npm install
cp .env.example .env      # Windows: Copy-Item .env.example .env
# editar .env → VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
npm run dev               # http://localhost:5173
```

Comandos:

```bash
npm run lint         # oxlint
npm run format       # Prettier
npm test             # Vitest (28 tests)
npm run build        # typecheck + build de producción (dist/)
```

## Deploy en Vercel

Ver [docs/vercel-deploy.md](docs/vercel-deploy.md). Resumen:

1. Subir el repo a GitHub (`mesas-isft93`, privado).
2. Importar el repo en Vercel (framework Vite, build `npm run build`, output `dist`).
3. Agregar `https://<tu-app>.vercel.app` a los **orígenes JavaScript** del OAuth Client
   en Google Cloud.

## Stack

React 19 · TypeScript (strict) · Vite 8 · Google Identity Services (OAuth en navegador,
sin backend) · Sheets API v4 · Gmail API (`drafts.create`) · oxlint + Prettier ·
Vitest · Vercel. Detalle y convenciones en [AGENTS.md](AGENTS.md).

## Estructura

```
├── PROJECT_MEMORY.md        # kanban + registro de sesiones
├── AGENTS.md                # stack y convenciones
├── docs/
│   ├── google-cloud-setup.md  # guía OAuth paso a paso
│   └── vercel-deploy.md       # guía de deploy
└── src/
    ├── App.tsx              # flujo principal (pasos)
    ├── components/          # pantallas (conexión, hojas, columnas, docentes, borradores)
    ├── google/              # auth, cliente Sheets, cliente Gmail
    ├── model/               # tipos, mapeo de columnas, parser, matching, agrupación
    └── mail/                # plantilla y objetivos de correo
```

## Seguridad

- Los borradores se crean con tu propia sesión de Google; las hojas se leen con tus
  permisos (no hace falta compartirlas públicamente).
- Solo se usan dos scopes: `spreadsheets.readonly` y `gmail.compose`.
- `.env` (Client ID) nunca se commitea; el Client Secret no se usa ni se guarda.

## Estado del proyecto

Ver kanban en [PROJECT_MEMORY.md](PROJECT_MEMORY.md). Hitos M0–M7 completados en
desarrollo; pendientes de configuración externa (Google Cloud, Vercel) en el registro
de sesiones.

Código fuente: <https://github.com/adanfrancisco/mesas-isft93> (repo privado).
