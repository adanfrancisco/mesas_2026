import { useState } from 'react'
import { extractSpreadsheetId, fetchSheetTitles, fetchSheetValues } from '../google/sheets'

export type LoadedSheet = {
  id: string
  title: string
  values: string[][]
}

type Side = {
  label: string
  hint: string
}

const MESAS: Side = {
  label: 'Hoja de mesas de examen',
  hint: 'Una solapa por carrera. Elegí la solapa a explorar.',
}

const CORREOS: Side = {
  label: 'Hoja de docentes y correos',
  hint: 'Una fila por docente con su nombre y correo electrónico.',
}

type SideState = {
  url: string
  id: string | null
  titles: string[]
  selectedTitle: string
  loaded: LoadedSheet | null
  loading: boolean
  error: string | null
}

const EMPTY_SIDE: SideState = {
  url: '',
  id: null,
  titles: [],
  selectedTitle: '',
  loaded: null,
  loading: false,
  error: null,
}

type Props = {
  token: string
  mesas: LoadedSheet | null
  correos: LoadedSheet | null
  onMesasLoaded: (sheet: LoadedSheet) => void
  onCorreosLoaded: (sheet: LoadedSheet) => void
}

export function SourcesPanel({ token, mesas, correos, onMesasLoaded, onCorreosLoaded }: Props) {
  const [mesaState, setMesaState] = useState<SideState>(EMPTY_SIDE)
  const [correoState, setCorreoState] = useState<SideState>(EMPTY_SIDE)

  const loadTitles = async (side: 'mesas' | 'correos') => {
    const setState = side === 'mesas' ? setMesaState : setCorreoState
    const current = side === 'mesas' ? mesaState : correoState
    const parsed = extractSpreadsheetId(current.url)
    if ('error' in parsed) {
      setState({ ...current, error: parsed.error })
      return
    }
    setState({ ...current, loading: true, error: null, id: parsed.id })
    try {
      const titles = await fetchSheetTitles(token, parsed.id)
      if (titles.length === 0) {
        setState({
          ...current,
          loading: false,
          id: parsed.id,
          error: 'La hoja no tiene solapas o la cuenta no tiene acceso.',
        })
        return
      }
      setState({
        ...current,
        loading: false,
        id: parsed.id,
        titles,
        selectedTitle: titles[0],
        error: null,
      })
    } catch (err) {
      setState({ ...current, loading: false, error: errorMessage(err) })
    }
  }

  const loadValues = async (side: 'mesas' | 'correos') => {
    const setState = side === 'mesas' ? setMesaState : setCorreoState
    const current = side === 'mesas' ? mesaState : correoState
    if (!current.id || !current.selectedTitle) return
    setState({ ...current, loading: true, error: null })
    try {
      const values = await fetchSheetValues(token, current.id, current.selectedTitle)
      if (values.length === 0) {
        setState({
          ...current,
          loading: false,
          error: 'La solapa está vacía o no se pudieron leer datos.',
        })
        return
      }
      const loaded: LoadedSheet = {
        id: current.id,
        title: current.selectedTitle,
        values,
      }
      setState({ ...current, loading: false, loaded, error: null })
      if (side === 'mesas') onMesasLoaded(loaded)
      else onCorreosLoaded(loaded)
    } catch (err) {
      setState({ ...current, loading: false, error: errorMessage(err) })
    }
  }

  return (
    <section className="panel sources">
      <h2>Paso 1 · Elegir las hojas</h2>
      <p className="hint">
        Pegá el link de cada hoja de Google (menú <em>Archivo → Compartir → Copiar enlace</em>
        ). Se leen con tu propia cuenta: no hace falta compartirlas públicamente.
      </p>
      <div className="sources-grid">
        <SheetSide
          side={MESAS}
          state={mesaState}
          loaded={mesas}
          onUrlChange={(url) => setMesaState({ ...mesaState, url })}
          onTitleChange={(selectedTitle) => setMesaState({ ...mesaState, selectedTitle })}
          onLoadTitles={() => loadTitles('mesas')}
          onLoadValues={() => loadValues('mesas')}
        />
        <SheetSide
          side={CORREOS}
          state={correoState}
          loaded={correos}
          onUrlChange={(url) => setCorreoState({ ...correoState, url })}
          onTitleChange={(selectedTitle) => setCorreoState({ ...correoState, selectedTitle })}
          onLoadTitles={() => loadTitles('correos')}
          onLoadValues={() => loadValues('correos')}
        />
      </div>
    </section>
  )
}

type SheetSideProps = {
  side: Side
  state: SideState
  loaded: LoadedSheet | null
  onUrlChange: (url: string) => void
  onTitleChange: (title: string) => void
  onLoadTitles: () => void
  onLoadValues: () => void
}

function SheetSide({
  side,
  state,
  loaded,
  onUrlChange,
  onTitleChange,
  onLoadTitles,
  onLoadValues,
}: SheetSideProps) {
  return (
    <div className="source-card">
      <h3>{side.label}</h3>
      <p className="hint">{side.hint}</p>

      <label className="field">
        <span>URL de la hoja</span>
        <input
          type="url"
          value={state.url}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          onChange={(e) => onUrlChange(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="btn"
        onClick={onLoadTitles}
        disabled={state.loading || !state.url.trim()}
      >
        {state.loading ? 'Consultando…' : 'Buscar solapas'}
      </button>

      {state.titles.length > 0 && (
        <>
          <label className="field">
            <span>Solapa a explorar</span>
            <select value={state.selectedTitle} onChange={(e) => onTitleChange(e.target.value)}>
              {state.titles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn" onClick={onLoadValues} disabled={state.loading}>
            {state.loading ? 'Cargando…' : 'Cargar datos de esta solapa'}
          </button>
        </>
      )}

      {state.error && (
        <p className="alert alert-error" role="alert">
          {state.error}
        </p>
      )}

      {loaded && (
        <p className="alert alert-ok" role="status">
          Solapa «{loaded.title}» cargada ({loaded.values.length} filas).
        </p>
      )}
    </div>
  )
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Ocurrió un error inesperado al leer la hoja.'
}
