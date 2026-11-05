# Deploy en Vercel — guía paso a paso

El sitio queda público en `https://<tu-proyecto>.vercel.app` y hay que registrarlo en
Google Cloud para que el login funcione.

## 1. Crear la cuenta

1. <https://vercel.com/signup> — registrarte con **GitHub** (la misma cuenta del repo).
   Plan **Hobby** (gratis) alcanza; permite importar repos **privados**.

## 2. Importar el proyecto

1. Dashboard → **Add New → Project** → buscar `mesas-isft93` → **Import**.
2. Vercel detecta Vite; si pide configuración manual:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. **Environment Variables** (opcional acá, obligatoria si querés que el build la tenga):
   no hace falta `VITE_GOOGLE_CLIENT_ID` en Vercel si el `.env` **no** se commitea… en
   realidad **sí hace falta**: la app la lee en runtime del bundle. Agregá:
   ```
   VITE_GOOGLE_CLIENT_ID = tu-client-id.apps.googleusercontent.com
   ```
   (Google Cloud → Credenciales → OAuth Client ID.)
4. **Deploy**. Al terminar anotá la URL: `https://<proyecto>.vercel.app`.

## 3. Registrar el dominio en Google Cloud

Google Cloud Console → APIs y servicios → **Credenciales** → tu OAuth Client ID
(tipo Aplicación web) → **Orígenes JavaScript autorizados** → **Agregar URI**:

```
https://<tu-proyecto>.vercel.app
```

Guardar. Si ya tenés `http://localhost:5173`, dejalo también (para desarrollo local).

## 4. Probar

1. Abrir `https://<tu-proyecto>.vercel.app`.
2. **Conectar con Google** con la cuenta institucional.
3. Completar el flujo completo (hojas → columnas → docentes → 1 borrador de prueba).

## Notas

- **Builds futuros:** cada push a `main` en GitHub re-deployea automáticamente.
- **SPA:** la app no usa router; no hace falta `vercel.json` con rewrites. Si en el
  futuro agregás rutas, agregar el rewrite a `index.html`.
- Si el OAuth devuelve `redirect_uri_mismatch` o `access_blocked`, revisá
  [google-cloud-setup.md](google-cloud-setup.md) (orígenes JS y usuarios de prueba).
- El Client ID de Google **no es secreto** (va en el bundle); la protección es la lista
  de orígenes. El `.env` no se commitea igual (evita regenerarlo a mano).
