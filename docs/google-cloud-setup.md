# Google Cloud — configuración paso a paso (OAuth + APIs)

Guía para crear las credenciales que usa la app. Solo hay que hacerla **una vez**.

**Resultado final:** un `VITE_GOOGLE_CLIENT_ID` para el archivo `.env`.

---

## 1. Crear el proyecto

1. Abrí <https://console.cloud.google.com/> e iniciá sesión con **tu cuenta
   institucional del ISFT N°93** (la misma con la que vas a crear los borradores).
2. En la barra superior, junto al logo de Google Cloud, hacé clic en el proyecto
   actual → **Nuevo proyecto**.
3. Nombre: `Mesas ISFT93` (o el que quieras) → **Crear**.
4. Esperá a que aparezca en la barra de proyectos y **seleccioná**.

## 2. Habilitar las APIs

1. Menú ☰ → **APIs y servicios → Biblioteca**.
2. Buscar **Google Sheets API** → **Habilitar**.
3. Volver a la biblioteca → buscar **Gmail API** → **Habilitar**.

## 3. Pantalla de consentimiento OAuth

1. Menú ☰ → **APIs y servicios → Pantalla de consentimiento OAuth**.
2. **Tipo de usuario:**
   - Si tu institución usa **Google Workspace** (correo con dominio propio, no
     `@gmail.com`): elegí **Interno**. Es la mejor opción: no requiere verificación y
     solo podrán usarla cuentas de tu dominio.
   - Si tu correo es `@gmail.com`: elegí **Externo**.
3. **Información de la app:**
   - Nombre de la app: `Mesas ISFT93`.
   - Correo de soporte: tu correo institucional.
   - Dominios de la organización: el dominio de tu institución (si aplica).
4. **Guardá y continuá.**
5. **Alcances (scopes):** podés agregarlos ahora o dejar que la app los pida al
   conectar. Si los agregás manualmente, buscá y sumá:
   - `.../auth/spreadsheets.readonly`
   - `.../auth/gmail.compose`
6. **Usuarios de prueba** (aplica solo para apps **Externo**):
   - **Agregar usuarios** → tu correo institucional.
   - Sin esto, Google bloqueará el login con error `access_blocked`.
   - Recordá que en modo "en pruebas" los tokens duran ~1 hora; la app lo maneja
     pidiendo reconectar si expira.

## 4. Credenciales → OAuth Client ID

1. Menú ☰ → **APIs y servicios → Credenciales** (arriba, pestaña _Credenciales_).
2. **Crear credenciales → ID de cliente OAuth**.
3. Tipo de aplicación: **Aplicación web**.
4. Nombre: `mesas-isft93-web`.
5. **Orígenes JavaScript autorizados** (agregá los dos):
   ```
   http://localhost:5173
   ```
   > El de Vercel se agrega al hacer el deploy (hito M7 / `docs/vercel-deploy.md`),
   > tendrá la forma `https://<tu-proyecto>.vercel.app` (también funciona el dominio
   > custom si usás uno).
6. **URLs de redireccionamiento (no se usa en este flujo):** dejar vacío / no hace falta.
7. **Crear** → copiá el **Client ID** (termina en `.apps.googleusercontent.com`).

## 5. Configurar el `.env` local

En la carpeta del proyecto:

```powershell
Copy-Item .env.example .env
```

Abrí `.env` y pegá:

```
VITE_GOOGLE_CLIENT_ID=TU_CLIENT_ID.apps.googleusercontent.com
```

Reiniciá el servidor de desarrollo (`npm run dev`) — Vite solo lee `.env` al arrancar.

## 6. Probar

1. `npm run dev` → abrir <http://localhost:5173>.
2. Botón **Conectar con Google** → elegir cuenta institucional → aceptar permisos.
3. Debería aparecer el badge **"Conectado con Google"**.

---

## Problemas frecuentes

| Síntoma                                                                          | Causa / solución                                                                                      |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `redirect_uri_mismatch`                                                          | El origen no está en la lista de _Orígenes JavaScript autorizados_.                                   |
| `access_blocked` / `403: access_blocked`                                         | App en pruebas sin tu correo en **Usuarios de prueba**, o no es usuario del dominio en apps Internas. |
| `popup_closed`                                                                   | Cerraste la ventana: volvé a conectar (no es error).                                                  |
| Se bloquea la ventana emergente                                                  | Permití pop-ups del sitio en el navegador.                                                            |
| `invalid_client`                                                                 | El Client ID está mal copiado en `.env` o falta reiniciar `npm run dev`.                              |
| El admin bloqueó "Acceso de apps de terceros" o "APIs de Google" en el Workspace | Solo tu administrador de Google Workspace puede habilitarlo.                                          |

## Seguridad

- El Client ID **no es un secreto** (va en el bundle del navegador); la protección real
  está en la lista de orígenes permitidos y en la pantalla de consentimiento.
- El **Client Secret** (si lo creaste) no se usa en esta app: el flujo es de tokens en
  navegador, sin backend. **Nunca** lo pongas en el código ni lo commitees.
- `.env` está en `.gitignore`; solo se commitea `.env.example`.
