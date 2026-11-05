import { useMemo, useState } from 'react'
import type { LoadedSheet } from './SourcesPanel'
import {
  columnLabel,
  detectCorreosMapping,
  detectEmailColumnByContent,
  detectHeaderRow,
  detectMesasMapping,
  extractSheetMeta,
  type CorreosMapping,
  type MesasMapping,
} from '../model/mapping'

const PREVIEW_ROWS = 8
const PREVIEW_COLUMNS = 26

type Props = {
  mesas: LoadedSheet
  correos: LoadedSheet
  onApply: (mesas: MesasMapping, correos: CorreosMapping) => void
  onChangeSheets: () => void
}

function buildInitialMesas(sheet: LoadedSheet): MesasMapping {
  const headerRow = detectHeaderRow(sheet.values)
  const base = detectMesasMapping(sheet.values[headerRow] ?? [])
  const meta = extractSheetMeta(sheet.values, headerRow)
  return { ...base, headerRow, carreraNombre: meta.carreraNombre, resolucion: meta.resolucion }
}

function buildInitialCorreos(sheet: LoadedSheet): CorreosMapping {
  const headerRow = detectHeaderRow(sheet.values)
  const mapping = { ...detectCorreosMapping(sheet.values[headerRow] ?? []), headerRow }
  if (mapping.email === null) {
    const byContent = detectEmailColumnByContent(sheet.values, headerRow)
    if (byContent !== null) mapping.email = byContent
  }
  return mapping
}

export function ColumnMappingPanel({ mesas, correos, onApply, onChangeSheets }: Props) {
  const [mesasMapping, setMesasMapping] = useState(() => buildInitialMesas(mesas))
  const [correosMapping, setCorreosMapping] = useState(() => buildInitialCorreos(correos))
  const [error, setError] = useState<string | null>(null)

  const mesasHeaders = mesas.values[mesasMapping.headerRow] ?? []
  const correosHeaders = correos.values[correosMapping.headerRow] ?? []

  const mesasHighlighted = useMemo(() => {
    const map = new Map<number, string>()
    const fields: [number | null, string][] = [
      [mesasMapping.fecha, 'fecha'],
      [mesasMapping.hora, 'hora'],
      [mesasMapping.materia, 'materia'],
      [mesasMapping.carrera, 'carrera'],
      [mesasMapping.acompaniante, 'acompaniante'],
      [mesasMapping.titular, 'titular'],
      [mesasMapping.docente, 'docente'],
      [mesasMapping.rol, 'rol'],
    ]
    fields.forEach(([column, field]) => {
      if (column !== null) map.set(column, field)
    })
    mesasMapping.acompaniantes.forEach((column) => map.set(column, 'acompaniante'))
    return map
  }, [mesasMapping])

  const correosHighlighted = useMemo(() => {
    const map = new Map<number, string>()
    if (correosMapping.nombre !== null) map.set(correosMapping.nombre, 'nombre')
    if (correosMapping.email !== null) map.set(correosMapping.email, 'email')
    return map
  }, [correosMapping])

  const apply = () => {
    if (mesasMapping.fecha === null || mesasMapping.materia === null) {
      setError('En la hoja de mesas hace falta mapear Fecha y Materia.')
      return
    }
    if (mesasMapping.titular === null && mesasMapping.docente === null) {
      setError('Mapeá la columna de Docente Titular (o de Docente, si la hoja no distingue rol).')
      return
    }
    if (correosMapping.nombre === null || correosMapping.email === null) {
      setError('En la hoja de correos hace falta mapear Nombre y Correo.')
      return
    }
    setError(null)
    onApply(mesasMapping, correosMapping)
  }

  return (
    <section className="panel mapping">
      <h2>Paso 2 · Columnas de cada hoja</h2>
      <p className="hint">
        Detectamos los encabezados automáticamente. Revisá que cada dato apunte a la columna
        correcta (las filas de datos arrancan debajo del encabezado marcado).
      </p>

      <h3>Hoja de mesas — «{mesas.title}»</h3>
      <div className="mapping-fields">
        <ColumnSelect
          label="Fila de encabezados"
          value={mesasMapping.headerRow}
          headers={mesas.values.slice(0, 15).map((row, index) => ({
            index,
            title: `Fila ${index + 1} — ${
              row
                .filter((c) => c.trim())
                .slice(0, 3)
                .join(' | ') || '(vacía)'
            }`,
          }))}
          onChange={(value) => {
            if (value === null) return
            setMesasMapping(() => {
              const base = detectMesasMapping(mesas.values[value] ?? [])
              const meta = extractSheetMeta(mesas.values, value)
              return {
                ...base,
                headerRow: value,
                carreraNombre: meta.carreraNombre,
                resolucion: meta.resolucion,
              }
            })
          }}
        />
        <ColumnSelect
          label="Fecha (obligatoria)"
          value={mesasMapping.fecha}
          headers={mesasHeaders}
          onChange={(value) => setMesasMapping({ ...mesasMapping, fecha: value })}
        />
        <ColumnSelect
          label="Hora"
          value={mesasMapping.hora}
          headers={mesasHeaders}
          onChange={(value) => setMesasMapping({ ...mesasMapping, hora: value })}
        />
        <ColumnSelect
          label="Materia (obligatoria)"
          value={mesasMapping.materia}
          headers={mesasHeaders}
          onChange={(value) => setMesasMapping({ ...mesasMapping, materia: value })}
        />
        <ColumnSelect
          label="Carrera"
          value={mesasMapping.carrera}
          headers={mesasHeaders}
          onChange={(value) => setMesasMapping({ ...mesasMapping, carrera: value })}
        />
        <label className="field">
          <span>Carrera (nombre para el correo)</span>
          <input
            type="text"
            value={mesasMapping.carreraNombre}
            onChange={(e) => setMesasMapping({ ...mesasMapping, carreraNombre: e.target.value })}
            placeholder="Ej.: Tecnicatura Superior en Desarrollo de Software"
          />
        </label>
        <label className="field">
          <span>Resolución (para el correo)</span>
          <input
            type="text"
            value={mesasMapping.resolucion}
            onChange={(e) => setMesasMapping({ ...mesasMapping, resolucion: e.target.value })}
            placeholder="Ej.: Res. 123/24"
          />
        </label>
        <ColumnSelect
          label="Docente Titular"
          value={mesasMapping.titular}
          headers={mesasHeaders}
          onChange={(value) => setMesasMapping({ ...mesasMapping, titular: value })}
        />
        <ColumnSelect
          label="Acompañante"
          value={mesasMapping.acompaniante}
          headers={mesasHeaders}
          onChange={(value) => setMesasMapping({ ...mesasMapping, acompaniante: value })}
        />
        <ColumnSelect
          label="Docente (si no hay columna de rol)"
          value={mesasMapping.docente}
          headers={mesasHeaders}
          onChange={(value) => setMesasMapping({ ...mesasMapping, docente: value })}
        />
        <ColumnSelect
          label="Rol (si mezcla titular/acompañante en una columna)"
          value={mesasMapping.rol}
          headers={mesasHeaders}
          onChange={(value) => setMesasMapping({ ...mesasMapping, rol: value })}
        />
      </div>

      <fieldset className="field-list">
        <legend>Columnas de acompañantes (podés marcar varias)</legend>
        {mesasHeaders.map((header, index) => {
          if (!header.trim()) return null
          return (
            <label key={index} className="check">
              <input
                type="checkbox"
                checked={mesasMapping.acompaniantes.includes(index)}
                onChange={(e) => {
                  const acompaniantes = e.target.checked
                    ? [...mesasMapping.acompaniantes, index]
                    : mesasMapping.acompaniantes.filter((c) => c !== index)
                  setMesasMapping({ ...mesasMapping, acompaniantes })
                }}
              />
              <span>
                {columnLabel(index)} — {header}
              </span>
            </label>
          )
        })}
      </fieldset>

      <PreviewTable
        sheet={mesas}
        headerRow={mesasMapping.headerRow}
        highlighted={mesasHighlighted}
      />

      <h3>Hoja de correos — «{correos.title}»</h3>
      <div className="mapping-fields">
        <ColumnSelect
          label="Fila de encabezados"
          value={correosMapping.headerRow}
          headers={correos.values.slice(0, 15).map((row, index) => ({
            index,
            title: `Fila ${index + 1} — ${
              row
                .filter((c) => c.trim())
                .slice(0, 3)
                .join(' | ') || '(vacía)'
            }`,
          }))}
          onChange={(value) => {
            if (value === null) return
            setCorreosMapping({
              ...detectCorreosMapping(correos.values[value] ?? []),
              headerRow: value,
            })
          }}
        />
        <ColumnSelect
          label="Apellido (opcional, se une al nombre)"
          value={correosMapping.apellido}
          headers={correosHeaders}
          onChange={(value) => setCorreosMapping({ ...correosMapping, apellido: value })}
        />
        <ColumnSelect
          label="Nombre del docente (obligatoria)"
          value={correosMapping.nombre}
          headers={correosHeaders}
          onChange={(value) => setCorreosMapping({ ...correosMapping, nombre: value })}
        />
        <ColumnSelect
          label="Correo electrónico (obligatoria)"
          value={correosMapping.email}
          headers={correosHeaders}
          onChange={(value) => setCorreosMapping({ ...correosMapping, email: value })}
        />
      </div>

      <PreviewTable
        sheet={correos}
        headerRow={correosMapping.headerRow}
        highlighted={correosHighlighted}
      />

      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={apply}>
          Continuar
        </button>
        <button type="button" className="btn btn-ghost" onClick={onChangeSheets}>
          Cambiar hojas
        </button>
      </div>
    </section>
  )
}

type HeaderOption = { index: number; title: string }

function ColumnSelect({
  label,
  value,
  headers,
  onChange,
}: {
  label: string
  value: number | null
  headers: string[] | HeaderOption[]
  onChange: (value: number | null) => void
}) {
  const options: HeaderOption[] = headers.map((header, index) =>
    typeof header === 'string'
      ? {
          index,
          title: header.trim()
            ? `${columnLabel(index)} — ${header}`
            : `${columnLabel(index)} — (vacía)`,
        }
      : header,
  )

  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={value ?? -1}
        onChange={(e) => onChange(Number(e.target.value) === -1 ? null : Number(e.target.value))}
      >
        <option value={-1}>(sin columna)</option>
        {options.map((option) => (
          <option key={option.index} value={option.index}>
            {option.title}
          </option>
        ))}
      </select>
    </label>
  )
}

function PreviewTable({
  sheet,
  headerRow,
  highlighted,
}: {
  sheet: LoadedSheet
  headerRow: number
  highlighted: Map<number, string>
}) {
  const rows = sheet.values
    .slice(headerRow, headerRow + 1 + PREVIEW_ROWS)
    .map((row) => row.slice(0, PREVIEW_COLUMNS))

  return (
    <div className="preview-wrap">
      <table className="preview-table">
        <thead>
          <tr>
            {Array.from({ length: Math.max(...rows.map((r) => r.length), 1) }, (_, column) => (
              <th
                key={column}
                className={highlighted.has(column) ? `hl hl-${highlighted.get(column)}` : undefined}
              >
                {columnLabel(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex + headerRow === headerRow ? 'header-row' : undefined}
            >
              {Array.from({ length: Math.max(...rows.map((r) => r.length), 1) }, (_, column) => (
                <td
                  key={column}
                  className={
                    highlighted.has(column) ? `hl hl-${highlighted.get(column)}` : undefined
                  }
                >
                  {row[column] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">Vista previa: encabezado + {PREVIEW_ROWS} filas.</p>
    </div>
  )
}
