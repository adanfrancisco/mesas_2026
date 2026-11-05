import { GoogleOAuthProvider } from '@react-oauth/google'
import { GOOGLE_CLIENT_ID } from './google/config'
import App from './App'

function MissingConfig() {
  return (
    <main className="app">
      <section className="panel">
        <h1>Falta la configuración de Google</h1>
        <p className="alert alert-error">
          Copiá <code>.env.example</code> a <code>.env</code> y completá
          <code> VITE_GOOGLE_CLIENT_ID</code> con tu OAuth Client ID. Guía paso a paso:
          <code> docs/google-cloud-setup.md</code>
        </p>
      </section>
    </main>
  )
}

export default function Root() {
  if (!GOOGLE_CLIENT_ID) return <MissingConfig />

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  )
}
