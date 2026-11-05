import { useMemo, useState } from 'react'
import type { DocenteCorreo, Rol } from '../model/types'
import { estadoDeFila, type EstadoFila, type TeacherRow } from '../model/group'

type Props = {
  rows: TeacherRow[]
  correos: DocenteCorreo[]
  onOverride: (key: string, email: string | null) => void
  onContinue: () => void
  onBack: () => void
}

type Filtro = 'todos' | EstadoFila

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'exacto', label: 'Coincidencia exacta' },
  { id: 'difuso', label: 'Coincidencia difusa' },
  { id: 'sin-match', label: 'Sin correo' },
  { id: 'conflicto', label: 'Conflicto' },
  { id: 'manual', label: 'Asignado a mano' },
]

const BADGE_CLASS: Record<EstadoFila, string> = {
  exacto: 'badge badge-ok',
  difuso: 'badge badge-warn',
  'sin-match': 'badge badge-danger',
  conflicto: 'badge badge-danger',
  manual: 'badge badge-accent',
}

const BADGE_TEXT: Record<EstadoFila, string> = {
  exacto: 'correo exacto',
  difuso: 'correo probable',
  'sin-match': 'sin correo',
  conflicto: 'conflicto de nombres',
  manual: 'asignado a mano',
}

const ROL_TEXT: Record<Rol, string> = {
  titular: 'titular',
  acompaniante: 'acompañante',
  'sin-rol': 'docente',
}

export function TeacherPanel({ rows, correos, onOverride, onContinue, onBack }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const counts = useMemo(() => {
    const result: Record<EstadoFila, number> = {
      exacto: 0,
      difuso: 0,
      'sin-match': 0,
      conflicto: 0,
      manual: 0,
    }
    rows.forEach((row) => {
      result[estadoDeFila(row)] += 1
    })
    return result
  }, [rows])

  const visible = rows.filter((row) => filtro === 'todos' || estadoDeFila(row) === filtro)
  const conCorreo = rows.filter((row) => row.email).length
  const pendientes = counts['sin-match'] + counts.conflicto

  const correosOrdenados = useMemo(
    () => [...correos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [correos],
  )

  return (
    <section className="panel">
      <h2>Paso 3 · Docentes y sus mesas</h2>
      <p className="hint">
        {rows.length} docentes figuran en la hoja de mesas; {conCorreo} tienen correo asignado.
        {pendientes > 0 && (
          <span>
            {' '}
            Quedaron <strong>{pendientes}</strong> sin asignar: abajo podés elegir el correo a mano.
          </span>
        )}
      </p>

      <div className="filters">
        {FILTROS.map((item) => {
          const count = item.id === 'todos' ? rows.length : counts[item.id]
          return (
            <button
              key={item.id}
              type="button"
              className={`btn btn-filter${filtro === item.id ? ' active' : ''}`}
              onClick={() => setFiltro(item.id)}
            >
              {item.label} ({count})
            </button>
          )
        })}
      </div>

      <ul className="teacher-list">
        {visible.map((row) => (
          <TeacherRowItem
            key={row.group.key}
            row={row}
            correos={correosOrdenados}
            onOverride={onOverride}
          />
        ))}
      </ul>

      {visible.length === 0 && <p className="hint">Ningún docente en este filtro.</p>}

<div className="actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Volver al resumen
        </button>
        <button type="button" className="btn btn-primary" onClick={onContinue}>
          Continuar a los borradores
        </button>
      </div>
    </section>
  )
}

function TeacherRowItem({
  row,
  correos,
  onOverride,
}: {
  row: TeacherRow
  correos: DocenteCorreo[]
  onOverride: (key: string, email: string | null) => void
}) {
  const estado = estadoDeFila(row)
  const needsPicker = estado === 'sin-match' || estado === 'conflicto' || estado === 'manual'

  return (
    <li className="teacher-card">
      <details>
        <summary>
          <span className="teacher-name">{row.group.nombre}</span>
          <span className="badge badge-plain">
            {row.group.items.length} mesa{row.group.items.length === 1 ? '' : 's'}
          </span>
          <span className={BADGE_CLASS[estado]}>
            {BADGE_TEXT[estado]}
            {estado === 'difuso' && row.match.estado === 'difuso'
              ? ` ${Math.round(row.match.score * 100)}%`
              : ''}
          </span>
          {row.email && <span className="teacher-email">{row.email}</span>}
        </summary>

        <div className="teacher-body">
          <ul className="mesa-list">
            {row.group.items.map(({ mesa, rol, colegas, acompaniaA }) => (
              <li key={mesa.fila}>
                <span className="mesa-when">
                  {mesa.fecha}
                  {mesa.hora && ` ${mesa.hora}`}
                </span>{' '}
                <strong>{mesa.materia || '(sin materia)'}</strong>
                <span className="muted"> · {ROL_TEXT[rol]}</span>
                {mesa.carrera && <span className="muted"> · {mesa.carrera}</span>}
                {rol === 'acompaniante' && acompaniaA && acompaniaA.length > 0 ? (
                  <div className="mesa-people">
                    Acompaña a: {acompaniaA.join(' · ')}
                  </div>
                ) : (
                  colegas.length > 0 && (
                    <div className="mesa-people">Con: {colegas.join(' · ')}</div>
                  )
                )}
              </li>
            ))}
          </ul>

          {row.match.estado === 'conflicto' && (
            <p className="alert alert-error">
              El nombre coincide con varios correos:{' '}
              {row.match.candidatos
                .map(
                  (c) => `${c.docente.nombre} <${c.docente.email}> (${Math.round(c.score * 100)}%)`,
                )
                .join(' · ')}
            </p>
          )}

          {needsPicker && (
            <div className="override-row">
              <label className="field">
                <span>Asignar correo manualmente</span>
                <select
                  value={row.email ?? ''}
                  onChange={(e) => onOverride(row.group.key, e.target.value || null)}
                >
                  <option value="">(— sin asignar —)</option>
                  {correos.map((docente) => (
                    <option key={`${docente.fila}-${docente.email}`} value={docente.email}>
                      {docente.nombre} — {docente.email || '(sin correo en la hoja)'}
                    </option>
                  ))}
                </select>
              </label>
              {row.manual && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onOverride(row.group.key, null)}
                >
                  Quitar asignación manual
                </button>
              )}
            </div>
          )}
        </div>
      </details>
    </li>
  )
}
