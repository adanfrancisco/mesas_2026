type Props = {
  onConnect: () => void
  error: string | null
}

export function ConnectScreen({ onConnect, error }: Props) {
  return (
    <main className="app">
      <header className="app-header">
        <h1>Mesas ISFT N°93</h1>
        <p className="subtitle">
          Avisos a docentes — borradores de correo desde tu Gmail institucional
        </p>
      </header>

      <section className="panel connect">
        <h2>Conectar con Google</h2>
        <p>
          Para leer las hojas de mesas y de correos, y crear los borradores en tu Gmail, necesitás
          autorizar estos permisos:
        </p>
        <ul className="permissions">
          <li>
            <strong>Google Sheets — solo lectura</strong>: leer la hoja de mesas de examen y la hoja
            de docentes/correos.
          </li>
          <li>
            <strong>Gmail — crear borradores</strong>: dejar listos en tu cuenta los correos para
            que los revises y envíes. La app <em>nunca envía</em> correos por su cuenta.
          </li>
        </ul>

        <button type="button" className="btn btn-primary" onClick={onConnect}>
          Conectar con Google
        </button>

        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}

        <p className="hint">
          Usá la cuenta institucional del ISFT N°93. Si es la primera vez, Google te pedirá aceptar
          los permisos.
        </p>
      </section>
    </main>
  )
}
