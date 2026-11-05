import type { ParseCorreosResult, ParseMesasResult } from '../model/parse'

type Props = {
  mesasTitle: string
  correosTitle: string
  mesasResult: ParseMesasResult
  correosResult: ParseCorreosResult
}

const PREVIEW_COUNT = 12

export function ParsedSummaryPanel({
  mesasTitle,
  correosTitle,
  mesasResult,
  correosResult,
}: Props) {
  const conEmail = correosResult.docentes.filter((d) => d.email.includes('@')).length

  return (
    <section className="panel">
      <h2>Datos leídos</h2>

      <div className="stat-grid">
        <div className="stat">
          <span className="stat-value">{mesasResult.mesas.length}</span>
          <span className="stat-label">mesas en «{mesasTitle}»</span>
        </div>
        <div className="stat">
          <span className="stat-value">{mesasResult.omitidas}</span>
          <span className="stat-label">filas vacías ignoradas</span>
        </div>
        <div className="stat">
          <span className="stat-value">{correosResult.docentes.length}</span>
          <span className="stat-label">docentes en «{correosTitle}»</span>
        </div>
        <div className="stat">
          <span className="stat-value">{conEmail}</span>
          <span className="stat-label">con correo válido</span>
        </div>
      </div>

      {mesasResult.omitidas > 0 && (
        <p className="hint">
          Las filas vacías se ignoraron porque no tienen materia ni docentes (suelen ser separadores
          de la hoja).
        </p>
      )}

      <h3>Avance de mesas (primeras {PREVIEW_COUNT})</h3>
      <ul className="mesa-list">
        {mesasResult.mesas.slice(0, PREVIEW_COUNT).map((mesa) => (
          <li key={mesa.fila}>
            <span className="mesa-when">
              {mesa.fecha}
              {mesa.hora && ` ${mesa.hora}`}
            </span>{' '}
            <strong>{mesa.materia || '(sin materia)'}</strong>
            {mesa.carrera && <span className="muted"> · {mesa.carrera}</span>}
            <div className="mesa-people">
              {mesa.participaciones.length === 0
                ? '(sin docentes en la fila)'
                : mesa.participaciones
                    .map((p) => `${p.nombre} (${p.rol === 'sin-rol' ? 'docente' : p.rol})`)
                    .join(' · ')}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
