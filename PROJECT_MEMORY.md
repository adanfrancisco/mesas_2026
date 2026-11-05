# PROJECT_MEMORY — Mesas ISFT N°93 · Avisos a docentes

> Memoria viva del proyecto. **Regla obligatoria:** cada avance del desarrollo debe
> actualizar este archivo (Kanban + Registro de sesiones) antes de pasar al siguiente hito.

## Estado general

- **Fase actual:** M7 — README, deploy y GitHub (completado)
- **Versión:** 0.0.1
- **Última actualización:** 2026-11-04

## Resumen del sistema

Aplicación web (React + Vite) que:

1. Conecta con Google (OAuth 2.0 en navegador, sin backend) usando la cuenta institucional.
2. Lee la hoja de mesas de examen del ISFT N°93 (elegir solapa/carrera y columnas).
3. Agrupa las mesas por docente (titular o acompañante) con fecha, materia y colegas.
4. Cruza con la hoja de docentes/correos usando coincidencia **difusa** de nombres.
5. Genera **borradores de correo en Gmail** (no envía: los revisás y enviás a mano).

## Stack (detalle completo en AGENTS.md)

React 19 · TypeScript 7 (strict) · Vite 8 · Google Identity Services · Sheets API v4 ·
Gmail API (`drafts.create`) · oxlint + Prettier · Vitest (28 tests) · Vercel · Git/GitHub

## Kanban

### ✅ Completado

- [x] **M0** — Andamiaje: scaffold Vite + React + TS (`npx create-vite`), TS strict,
      oxlint + Prettier, `.env.example`, shell de la app (título/estilo base),
      `PROJECT_MEMORY.md`, `AGENTS.md`, `README.md`, `git init` + primer commit.
- [x] **M1** — Auth Google: `@react-oauth/google`, hook `useGoogleAuth`
      (`src/google/auth.tsx`), pantalla `ConnectScreen` con descripción de permisos,
      `GoogleOAuthProvider` en `main.tsx` con aviso si falta `VITE_GOOGLE_CLIENT_ID`,
      scopes `spreadsheets.readonly` + `gmail.compose`, manejo de errores de popup,
      guía completa `docs/google-cloud-setup.md`.
- [x] **M2** — Fuentes: `src/google/sheets.ts` (cliente Sheets API + errores en español + `extractSpreadsheetId`), `SourcesPanel` (URLs, buscar solapas, cargar valores,
      contador de filas), `src/model/mapping.ts` (normalización de encabezados, detección
      de fila de encabezados y columnas por sinónimos + fallback de columna email por
      contenido con '@'), `ColumnMappingPanel` (mapeo manual con selects + columnas de
      acompañantes multi-selección + vista previa resaltada de ambas hojas), flujo de
      pasos en `App.tsx` (conectar → hojas → columnas).
- [x] **M3** — Modelo y parser: `src/model/types.ts` (`Mesa`, `Participacion`, `Rol`,
      `DocenteCorreo`), `src/model/parse.ts` (`parseMesas` con forward-fill de
      fecha/hora/carrera para celdas combinadas, dos modos: titular+columnas de
      acompañantes (con split de nombres por coma/punto y coma/salto) o docente+rol;
      `parseCorreos` con conteo de emails inválidos), `ParsedSummaryPanel` (stats +
      preview de mesas), integración en `App.tsx` con `useMemo`.
- [x] **M4** — Matching y vista docentes: `src/model/match.ts` (`normalizeName` quita
      tildes/títulos/puntuación; similitud = máx(Levenshtein, Dice de tokens,
      contención); `matchDocente` con exacto/difuso/umbral 0.72/conflicto si dos
      candidatos difieren <6 pts), `src/model/group.ts` (`groupByTeacher` agrupa mesas
      por nombre normalizado con rol y colegas; `buildTeacherRows` aplica match +
      overrides manuales), `TeacherPanel` (filtros por estado con contadores, tarjetas
      desplegables con mesas de cada docente, selector manual de correo para
      sin-match/conflicto, botón continuar), flujo de pasos en App
      (resumen → docentes → correo).
- [x] **Corrección** — detección de solapas en Google Sheets:
  `fetchSheetTitles` leía `sheet.title`, pero la API responde
  `sheet.properties.title`; se corrigió el tipo `SheetProperties` y el mapeo.
  Síntoma: "La hoja no tiene solapas o la cuenta no tiene acceso." aunque la
  hoja tuviera solapas.

### 🚧 En curso

- _(ninguno — esperando siguiente hito)_

### 📥 Pendiente (configuración externa — requiere cuentas del usuario)

- [ ] **Usuario:** crear proyecto en Google Cloud + OAuth Client ID siguiendo
      `docs/google-cloud-setup.md` → completar `.env` con `VITE_GOOGLE_CLIENT_ID`.
- [ ] **Usuario:** compartir los links de las dos hojas (mesas y correos) y probar el
      flujo completo en local (`npm run dev`).
- [ ] **Usuario:** crear cuenta en Vercel e importar `adanfrancisco/mesas-isft93`
      (ver `docs/vercel-deploy.md`) → agregar `https://<app>.vercel.app` a los orígenes
      JS del OAuth Client.
- [ ] **Después del deploy:** prueba de humo online (conectar → hojas → 1 borrador).

### ⛔ Bloqueado

- Ninguno.

## Decisiones de diseño (acordadas con el usuario)

| #   | Decisión                            | Detalle                                                                                                    |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **Borradores, no envío automático** | `users.drafts.create`; el usuario revisa y envía desde Gmail.                                              |
| 2   | **Despliegue en Vercel**            | Repo privado, sitio público en `*.vercel.app`.                                                             |
| 3   | **Repo privado `mesas-isft93`**     | Repo creado vía API de GitHub con credenciales del GCM (sin `gh` CLI); push a `main`.                      |
| 4   | **Dos hojas distintas**             | URLs se pegan en la app; NO requiere compartir las hojas públicamente (se leen con la sesión del usuario). |
| 5   | **Coincidencia difusa**             | Normalización + scoring; matches dudosos se muestran para confirmación.                                    |
| 6   | **Plantilla editable en la app**    | Con placeholders; previsualización por docente antes de crear borradores.                                  |
| 7   | **oxlint en vez de ESLint**         | El template actual de Vite trae oxlint; se adoptó (más rápido, ya configurado).                            |

## Registro de sesiones

### 2026-11-04 — M10: carrera y resolución (post-M9)

**Realizado:**

- `src/model/mapping.ts`: campos `carreraNombre` y `resolucion` en `MesasMapping` y
  `extractSheetMeta` para tomarlas de las filas previas al encabezado.
- `ColumnMappingPanel`: inputs editables para carrera (nombre) y resolución.
- `template.ts`/`DraftsPanel`: placeholders `{{carrera}}` y `{{resolucion}}`,
  pasados desde `App.tsx`.
- `DraftsPanel`: botón "Copiar al portapapeles" para pegar manualmente en Gmail.

**Gotchas aprendidos:**

- Los metadatos de carrera/resolución están fuera del rango de datos, por lo que
  deben extraerse antes del `headerRow` y editarse a mano si la detección falla.

### 2026-11-04 — Corrección de acompañantes (post-M8)

**Realizado:**

- `src/model/group.ts`: `MesaConRol` ahora incluye `acompaniaA` (titulares de la mesa).
- `src/mail/template.ts`: si el docente es acompañante, la línea muestra
  "acompañante de [titular]" en lugar de solo "acompañante".
- `src/components/TeacherPanel.tsx`: muestra "Acompaña a: ..." para acompañantes.
- Actualizados tests de template/targets con el nuevo campo.

**Gotchas aprendidos:**

- Identificar al titular requiere filtrar participaciones por rol dentro del mismo
  grupo/mesa; no alcanza con `colegas`, que mezcla todos los participantes.

### 2026-11-04 — Corrección de solapas (post-M7)

**Realizado:**

- `src/google/sheets.ts`: corregido el parseo de la respuesta de `spreadsheets.get`.
  El campo `title` está anidado en `sheet.properties.title`, no en `sheet.title`;
  el tipo `SheetProperties` y el mapeo se ajustaron. Esto era la causa del mensaje
  "La hoja no tiene solapas o la cuenta no tiene acceso." aunque la hoja las tuviera.
- Verificado `npm run build`, `npm run lint` y `npm test` en verde (28 tests).
- Revertido `.env.example` a placeholder sin secretos y ampliado `.gitignore` para
  ignorar credenciales descargadas de Google Cloud.

**Gotchas aprendidos:**

- La respuesta de `fields=sheets.properties(title)` viene con la forma
  `{ sheets: [{ properties: { title } }] }`; cualquier parseo que asuma
  `sheet.title` queda vacío y se confunde con "sin solapas".

### 2026-10-29 — Sesión 8 (M7)

**Realizado:**

- `README.md` completo: cómo funciona (5 pasos), requisitos, desarrollo local,
  comandos, deploy, stack, estructura, seguridad.
- `docs/vercel-deploy.md`: signup, import del repo (Vite, output `dist`),
  variable `VITE_GOOGLE_CLIENT_ID` en Vercel, registro del dominio en orígenes JS del
  OAuth Client, pruebas y notas (SPA sin rewrites, deploys automáticos por push).
- **Repo creado en GitHub:** `adanfrancisco/mesas-isft93` (privado) vía API con las
  credenciales de Git Credential Manager; remote `origin` configurado.
- `git push -u origin main` con todos los hitos.

**Gotchas aprendidos:**

- `gh` CLI no está instalado en la máquina; para crear el repo se usó la REST API de
  GitHub con el PAT que ya tenía guardado el GCM (sin imprimir el token).

### 2026-10-29 — Sesión 7 (M6)

**Realizado:**

- Vitest instalado (`vitest`, environment node, `include: src/**/*.test.ts`) y script
  `npm test`.
- 5 archivos de test, **28 tests en verde**:
  - `match.test.ts`: normalización (tildes/títulos/iniciales), similitud (idénticos,
    orden variante, distintos), `matchDocente` (exacto, difuso, sin-match, conflicto).
  - `parse.test.ts`: `parseRol`, parseo de mesas (titular+acompañante, forward-fill de
    fecha/hora en filas combinadas, omisión de vacíos, split de acompañantes),
    `parseCorreos` (nombre/email, vacíos, inválidos).
  - `template.test.ts`: `renderTemplate` (reemplazo y placeholders desconocidos),
    `formatMesaLine`, `buildTemplateVars`.
  - `targets.test.ts`: dedupe por email + mezcla de mesas, conteo de sin-correo.
  - `mapping.test.ts`: `columnLabel` (A..Z, AA), `detectHeaderRow`, `detectMesasMapping`
    (sinónimos, Vocales), `detectCorreosMapping`.
- Pulido: botón "Buscar solapas" deshabilitado con URL vacía; badge con cantidad de
  mesas por docente en la lista.

**Gotchas aprendidos:**

- Un test de "conflicto" con 'Ana Gómez'/'Ana Gomez' falló: normalizan igual → es
  match **exacto**, no conflicto. El conflicto real requiere dos nombres que normalicen
  distinto pero ambos superen el umbral con <6 pts de diferencia (ej. "Carlos Gómez
  Lima"/"Lina").

### 2026-10-29 — Sesión 6 (M5)

**Realizado:**

- `src/mail/template.ts`: placeholders `{{docente}}/{{cantidad}}/{{mesas}}/{{colegas}}`,
  asunto y cuerpo por defecto en español, `formatMesaLine` (fecha hora — materia
  (carrera) — rol — con colegas), `renderTemplate` con regex tolerante a espacios.
- `src/mail/targets.ts`: `buildDraftTargets` — agrupa filas de docentes **deduplicando
  por email** (evita borradores dobles cuando el mismo correo matchea 2 variantes de
  nombre), mezcla las mesas de todas las variantes, ordena mesas por fecha, cuenta
  `sinCorreo`, nombre oficial desde la hoja de correos si existe.
- `src/google/gmail.ts`: `createDraft` → `POST /gmail/v1/users/me/drafts` con
  `message.raw` = MIME RFC 2822 (To, Subject, MIME-Version, Content-Type UTF-8) en
  base64url vía `TextEncoder`+`btoa`; asuntos no-ASCII con RFC 2047 (`=?UTF-8?B?...?=`);
  `GmailApiError` con mensajes por status.
- `src/components/DraftsPanel.tsx`: editor de asunto/cuerpo con chips de placeholders,
  restablecer plantilla, **vista previa** renderizada por docente (selector), botón
  "Crear N borradores" con secuencia 250 ms + retry manual ante 429 (1.5 s), progreso
  N/M, resultado por docente (✓/✕ con detalle), link "Abrir borradores en Gmail",
  alerta si la sesión expiró (401).
- `App.tsx`: `teacherRows` calculado con `useMemo` arriba (se comparte entre
  TeacherPanel y DraftsPanel), paso 'correo' activo; TeacherPanel ahora recibe `rows`
  ya construidos (dejó de calcular agrupación internamente).

**Gotchas aprendidos:**

- `btoa` solo acepta Latin-1: para UTF-8 hay que pasar por `TextEncoder` → bytes →
  `String.fromCharCode` → `btoa` → swap `+/` a `-_` y quitar `=`.
- Los asuntos con tildes en el header `Subject:` deben ir en RFC 2047 o Gmail puede
  rechazar el mensaje (se implementó el encode condicional solo si hay no-ASCII).
- Dedupe por email **antes** de crear borradores: sin esto, "Gómez, Ana" y "Ana Gómez"
  generaban dos borradores al mismo correo.

### 2026-10-29 — Sesión 5 (M4)

**Realizado:**

- `src/model/match.ts`: `normalizeName` (NFD, quita tildes/puntuación/títulos
  "Prof./Dra./Lic..."/iniciales de una letra), similitud combinada
  `nameSimilarity` = máx(Levenshtein normalizado, Dice sobre tokens, contención
  0.95× para nombres parciales ≥6 chars), `matchDocente` con:
  exacto (normalizado igual) → difuso (score ≥ 0.72, umbral `DEFAULT_THRESHOLD`) →
  conflicto (2+ candidatos con <6 pts de diferencia y emails distintos) → sin-match.
- `src/model/group.ts`: `groupByTeacher(mesas)` → grupos por nombre normalizado con
  items `{mesa, rol, colegas}`; `buildTeacherRows(groups, correos, overrides)` aplica
  overrides manuales (key → email) y devuelve `{group, match, email, manual}`;
  `estadoDeFila` para el filtro.
- `src/components/TeacherPanel.tsx`: filtros por estado con contadores (todos / exacto /
  difuso / sin correo / conflicto / manual), tarjetas desplegables (`<details>`) con
  badge de estado (+% de similitud), lista de mesas del docente (fecha, materia, rol,
  carrera, colegas), alerta de conflicto con los candidatos, selector para asignar
  correo a mano y botón "Quitar asignación manual", botón "Continuar a los borradores".
- `App.tsx`: máquina de pasos `resumen → docentes → correo`, estado `overrides` con
  alta/baja, reset al cambiar hojas.

**Gotchas aprendidos:**

- JSX: texto con paréntesis/apóstrofes dentro de fragmentos `<>` puede romper el parser
  de Prettier en algunas combinaciones → preferir `<span>` simple con texto corrido.
- Agrupar por nombre **normalizado** permite que variantes ("Gómez, Ana" vs "Ana Gómez")
  caigan en grupos distintos pero matcheen el mismo correo; en M5 hay que **deduplicar
  por email** antes de crear borradores para no duplicar correos.

### 2026-10-29 — Sesión 4 (M3)

**Realizado:**

- `src/model/types.ts`: tipos de dominio `Rol` ('titular' | 'acompaniante' | 'sin-rol'),
  `Participacion`, `Mesa` (fecha/hora/materia/carrera/participaciones/fila),
  `DocenteCorreo`.
- `src/model/parse.ts`:
  - `parseMesas`: recorre filas bajo el encabezado; **forward-fill** de fecha/hora/carrera
    (hojas con celdas combinadas donde la fila siguiente viene vacía); modo A =
    columna titular + columnas de acompañantes (nombres partidos por coma / punto y coma
    / salto de línea); modo B = columna docente + columna rol (`parseRol` detecta
    titular/vocal/acompañante); filas sin materia y sin participaciones → omitidas
    (separadores); devuelve `{mesas, omitidas}`.
  - `parseCorreos`: nombre + email (minúsculas); cuenta `sinEmailValido` (celda sin '@')
    y `omitidas` (filas sin nombre).
- `ParsedSummaryPanel`: 4 stats (mesas, filas ignoradas, docentes, correos válidos) +
  preview de las primeras 12 mesas.
- `App.tsx`: parse con `useMemo` cuando hay hojas + mapping; orden de hooks corregido
  (el early-return de "no conectado" ahora va DESPUÉS de los `useMemo` — Rules of Hooks).

**Gotchas aprendidos:**

- Early-return condicional **antes** de `useMemo`/`useState` viola Rules of Hooks
  (oxlint `react/rules-of-hooks` lo detecta): calcular hooks primero, retornar después.
- Las hojas de mesas usan celdas combinadas: `values` deja la celda vacía en las filas
  "pegadas" → forward-fill de fecha/hora/carrera es obligatorio para no perder contexto.

### 2026-10-29 — Sesión 3 (M2)

**Realizado:**

- `src/google/sheets.ts`: cliente fetch con Bearer token; `fetchSheetTitles`
  (`spreadsheets.get?fields=sheets.properties(title)`), `fetchSheetValues`
  (rango `'Solapa'!A:AZ` con comillas escapadas y URL-encoded), `SheetsApiError` con
  mensajes por status (401/403/404/429...), `extractSpreadsheetId` (URL estándar, URL
  publicada `/d/e/` → error explicativo, ID crudo como fallback).
- `src/components/SourcesPanel.tsx`: dos tarjetas (mesas / correos) con input URL,
  botón "Buscar solapas", select de solapa, botón "Cargar datos", alertas de error/éxito
  con contador de filas.
- `src/model/mapping.ts`: `normalizeHeader` (NFD + diacríticos), `detectHeaderRow`
  (fila con ≥2 encabezados reconocibles; fallback = más celdas no vacías en primeras 12),
  `detectMesasMapping`/`detectCorreosMapping` (sinónimos ES: fecha/hora/materia/carrera/
  titular/acompañante|vocal/docente/rol y nombre/correo|email; scoring exacto > empieza >
  contiene; columnas ya reclamadas no se reasignan), `detectEmailColumnByContent`
  (columna con '@' en ≥50% de las primeras 10 filas), `columnLabel` (A, B, ..., AA).
- `src/components/ColumnMappingPanel.tsx`: selects de fila de encabezados + cada campo,
  checkboxes para columnas de acompañantes, previews de ambas hojas con columnas
  resaltadas por campo, validación al continuar (fecha+materia+(titular o docente);
  nombre+email), botones "Revisar columnas" / "Cambiar hojas".
- `App.tsx`: máquina de pasos (conectar → hojas → columnas → M3).

**Gotchas aprendidos:**

- `erasableSyntaxOnly` (TS 7): no permite parameter properties de clase
  (`constructor(readonly status: number)`) → asignar el campo manualmente.
- Tipos de handler de select con `number | null`: hace falta estrechar (`if null return`)
  antes de usar el valor como índice.
- `values.get` recorta celdas vacías finales por fila: los parsers deben usar
  `row[i] ?? ''`.

### 2026-10-29 — Sesión 2 (M1)

**Realizado:**

- Instalado `@react-oauth/google` (flujo de tokens en navegador, sin backend).
- `src/google/config.ts`: `GOOGLE_CLIENT_ID` (desde `.env`) y `GOOGLE_SCOPES`
  (`spreadsheets.readonly` + `gmail.compose`).
- `src/google/auth.tsx`: hook `useGoogleAuth()` → `{accessToken, expiresAt, isExpired,
error, connect, disconnect}`; maneja `onError` y `onNonOAuthError`
  (`popup_closed` sin alerta, `popup_failed_to_open` con instrucción de pop-ups).
- `src/components/ConnectScreen.tsx`: pantalla de conexión que explica los permisos
  (Sheets solo lectura / Gmail solo borradores, **nunca envía**).
- `src/main.tsx`: `GoogleOAuthProvider` envuelve la app; si falta el Client ID muestra
  instrucciones en lugar de fallar en silencio.
- `src/App.tsx`: estado conectado → status bar con badge "Conectado con Google",
  aviso de sesión expirada y botón Desconectar.
- `docs/google-cloud-setup.md`: guía completa (proyecto, APIs, consentimiento interno
  vs externo + usuarios de prueba, Client ID, `.env`, troubleshooting).
- Prettier/Oxlint/build en verde.

**Pendiente del usuario:**

- [ ] Seguir `docs/google-cloud-setup.md` y crear el Client ID → `.env` (probado en M1
      o antes de M2).

**Gotchas aprendidos:**

- `useGoogleLogin` por defecto prepende `openid profile email` a los scopes pedidos
  (param `overrideScope` para cambiarlo); con app en pruebas los tokens duran ~1 h.
- La librería distingue `popup_closed` (cancelación del usuario, no es error) de
  `popup_failed_to_open` (bloqueo de pop-ups) — mostrar mensajes distintos.
- `access_token` y `expires_in` son **obligatorios** en el tipo `TokenResponse` de la
  librería (salvo en la variante de error).

### 2026-10-29 — Sesión 1 (M0)

**Realizado:**

- Scaffold con `npx create-vite@latest . -- --template react-ts` (create-vite 9.3.3,
  React 19.3, Vite 8, TypeScript 7.0, lint con oxlint).
- `npm install` + Prettier (config `.prettierrc`: sin semillas, comillas simples, ancho 100).
- TS `strict: true` + `DOM.Iterable` en `tsconfig.app.json`.
- `.gitignore` extendido (`.env*`, `.vercel`), `.env.example` con `VITE_GOOGLE_CLIENT_ID`.
- Shell de la app en `src/App.tsx` + estilos base (`index.css` con variables de diseño,
  light/dark). Eliminados assets demo de la plantilla.
- Creados `PROJECT_MEMORY.md`, `AGENTS.md`, `README.md`.
- `git init` + commit inicial.

**Pendiente del usuario (para M1/M7):**

- [ ] Crear proyecto en Google Cloud + OAuth Client ID (seguir `docs/google-cloud-setup.md`).
- [ ] Pegar links de las dos hojas (mesas y docentes/correos) al llegar a M2.
- [ ] Crear repo privado `mesas-isft93` en github.com y pasarme la URL remote.
- [ ] Crear cuenta/ proyecto en Vercel al llegar a M7.

**Gotchas aprendidas:**

- `npm create vite@latest . -- --template react-ts` falla con npm 12 (parsea `--template`
  como flag propio) → usar `npx create-vite@latest`.
- create-vite 9 ya no incluye ESLint: trae **oxlint** (`.oxlintrc.json`).
- La API de Gmail no permite "dejar en cola" correos: o `send` (va a Enviados) o
  `drafts.create` (va a Borradores). El usuario eligió borradores → scope `gmail.compose`.

### 2026-11-05 — Ajuste: campos Docente Titular y Acompañante en el mapeo (paso 2)

**Realizado:**

- `src/model/mapping.ts`: nuevo campo `acompaniante` en `MesasMapping` (columna
  principal de acompañante), detectado automáticamente a partir de la primera columna
  de acompañantes.
- `src/model/parse.ts`: el parser combina `acompaniante` con `acompaniantes`,
  evitando duplicar columnas.
- `src/components/ColumnMappingPanel.tsx`: renombrado el campo visible "Titular" a
  "Docente Titular" y agregado el select "Acompañante" entre los campos principales
  (antes estaba solo como checkboxes de acompañantes).

**Validación:** `npm run build`, `npm run lint` y `npm test` (28 tests) en verde.

---

## Siguiente paso

**Fuera del código (cuentas del usuario):** 1) OAuth Client ID + `.env` (guía
`docs/google-cloud-setup.md`), 2) links de las dos hojas para la prueba real, 3) Vercel + dominio OAuth (guía `docs/vercel-deploy.md`). Después, prueba de humo
completa y ajustes finales que surjan con los datos reales.
