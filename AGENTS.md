# AGENTS.md — Guía del proyecto (stack y convenciones)

## Propósito

**Mesas ISFT N°93 — Avisos a docentes.** App web que lee la hoja de mesas de examen del
ISFT N°93 desde Google Sheets, agrupa mesas por docente (titular/acompañante), cruza con
la hoja de correos (matching difuso) y crea **borradores de correo en Gmail** para que el
usuario los revise y envíe desde su cuenta institucional.

## Stack

| Capa          | Tecnología                                       | Notas                                            |
| ------------- | ------------------------------------------------ | ------------------------------------------------ |
| Framework     | React 19 + TypeScript ~7.0 (`strict`)            | JSX `react-jsx`, sin `any` innecesario           |
| Build         | Vite 8                                           | Scripts: `dev`, `build`, `preview`               |
| Lint / Format | **oxlint** + **Prettier**                        | No usar ESLint (el template no lo incluye)       |
| Google Auth   | `@react-oauth/google` (Google Identity Services) | Flujo de tokens en navegador, sin backend        |
| Google Sheets | Sheets API v4 (`spreadsheets.get`, `values.get`) | Scope `spreadsheets.readonly`                    |
| Google Gmail  | Gmail API (`users.drafts.create`)                | Scope `gmail.compose` — **nunca** `gmail.send`   |
| Tests         | Vitest (node) — `npm test`                       | Enfocados en parser, matcher, template y targets |
| Deploy        | Vercel (SPA rewrite)                             | Repo privado en GitHub `mesas-isft93`            |
| Versionado    | Git, commits incrementales por hito              | Mensajes en español, formato `M#: descripción`   |

## Comandos

```bash
npm run dev          # servidor de desarrollo (http://localhost:5173)
npm run build        # typecheck (tsc -b) + build de producción
npm run preview      # probar el build localmente
npm run lint         # oxlint
npm run format       # Prettier: formatear todo
npm run format:check # Prettier: verificar sin escribir
npm test             # Vitest (disponible desde M6)
```

## Convenciones

- **Idioma:** UI, mensajes, commits y documentación en español.
- **Comentarios en código:** solo si es imprescindible; no explicar lo obvio.
- **Estilos:** CSS plano con variables globales en `src/index.css`
  (`--surface`, `--accent`, `--ok`, `--warn`, `--danger`...); clases en `src/App.css`
  o CSS Modules por componente si crece. Respetar modo claro/oscuro.
- **Estado:** `useState`/`useReducer` + contexto solo si hace falta; no instalar
  librerías de estado sin justificarlo.
- **Dependencias nuevas:** justificar antes de agregar (`npm i`).
- **Secrets:** `VITE_GOOGLE_CLIENT_ID` vive en `.env` (gitignored). Nunca commitear
  `.env`. `.env.example` siempre actualizado.
- **Errores de API Google:** traducir a mensajes claros en español
  (403 = permiso/scope, 404 = hoja inaccesible/URL mal, 429 = rate limit → reintentar).

## Estructura (evolucionando por hito)

```
mesas_2026/
├── PROJECT_MEMORY.md      # kanban + registro de sesiones (ACTUALIZAR EN CADA AVANCE)
├── AGENTS.md              # este archivo (stack y convenciones)
├── README.md              # guía de uso final
├── docs/
│   └── google-cloud-setup.md  # guía OAuth paso a paso
├── src/
│   ├── main.tsx           # monta <GoogleOAuthProvider> + <App/>
│   ├── App.tsx            # flujo principal (pantallas por hito)
│   ├── google/            # auth + clientes API (Sheets/Gmail)
│   ├── model/             # tipos, parser de mesas, matcher difuso
│   └── mail/              # plantilla + creación de borradores
└── .env                   # VITE_GOOGLE_CLIENT_ID (no commiteado)
```

## Scopes de Google (los mínimos necesarios)

```
https://www.googleapis.com/auth/spreadsheets.readonly   # leer hojas
https://www.googleapis.com/auth/gmail.compose           # crear borradores (NO enviar)
```

Endpoints usados:

- `GET https://sheets.googleapis.com/v4/spreadsheets/{id}?fields=sheets.properties` — solapas.
- `GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}` — datos.
- `POST https://gmail.googleapis.com/gmail/v1/users/me/drafts` — crear borrador
  (`message.raw` = RFC 2822 en base64url, UTF-8).

## Reglas del proceso (obligatorias)

1. **Cada avance de desarrollo** debe:
   - Actualizar `PROJECT_MEMORY.md`: mover la tarea en el Kanban y agregar una línea
     fechada en "Registro de sesiones" (qué se hizo, qué falta, gotchas).
   - Hacer un commit de git con mensaje `M#: descripción corta`.
2. No romper `npm run lint` ni `npm run build` antes de dar por terminado un hito.
3. El deploy en Vercel debe agregarse como **origen JavaScript** en el OAuth Client de
   Google Cloud (junto con `http://localhost:5173`).

## Estado actual

Ver `PROJECT_MEMORY.md` (kanban). Último hito completado: **M7**.
