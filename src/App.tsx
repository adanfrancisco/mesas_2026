import { useMemo, useState } from 'react'
import { ConnectScreen } from './components/ConnectScreen'
import { SourcesPanel, type LoadedSheet } from './components/SourcesPanel'
import { ColumnMappingPanel } from './components/ColumnMappingPanel'
import { ParsedSummaryPanel } from './components/ParsedSummaryPanel'
import { TeacherPanel } from './components/TeacherPanel'
import { DraftsPanel } from './components/DraftsPanel'
import { useGoogleAuth } from './google/auth'
import type { CorreosMapping, MesasMapping } from './model/mapping'
import { parseCorreos, parseMesas } from './model/parse'
import { buildTeacherRows, groupByTeacher } from './model/group'
import './App.css'

type Mapping = { mesas: MesasMapping; correos: CorreosMapping }
type Paso = 'resumen' | 'docentes' | 'correo'

function App() {
  const auth = useGoogleAuth()
  const [mesasSheet, setMesasSheet] = useState<LoadedSheet | null>(null)
  const [correosSheet, setCorreosSheet] = useState<LoadedSheet | null>(null)
  const [mapping, setMapping] = useState<Mapping | null>(null)
  const [paso, setPaso] = useState<Paso>('resumen')
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  const parsedMesas = useMemo(
    () => (mesasSheet && mapping ? parseMesas(mesasSheet.values, mapping.mesas) : null),
    [mesasSheet, mapping],
  )
  const parsedCorreos = useMemo(
    () => (correosSheet && mapping ? parseCorreos(correosSheet.values, mapping.correos) : null),
    [correosSheet, mapping],
  )
  const teacherRows = useMemo(() => {
    if (!parsedMesas || !parsedCorreos) return null
    const groups = groupByTeacher(parsedMesas.mesas)
    return buildTeacherRows(groups, parsedCorreos.docentes, overrides)
  }, [parsedMesas, parsedCorreos, overrides])

  const resetSources = () => {
    setMesasSheet(null)
    setCorreosSheet(null)
    setMapping(null)
    setPaso('resumen')
    setOverrides({})
  }

  if (!auth.accessToken) {
    return <ConnectScreen onConnect={auth.connect} error={auth.error} />
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Mesas ISFT N°93</h1>
        <p className="subtitle">
          Avisos a docentes — borradores de correo desde tu Gmail institucional
        </p>
      </header>

      <div className="status-bar">
        <span className="badge badge-ok">Conectado con Google</span>
        {auth.isExpired && <span className="badge badge-warn">Sesión expirada</span>}
        <button type="button" className="btn btn-ghost" onClick={auth.disconnect}>
          Desconectar
        </button>
      </div>

      {auth.isExpired && (
        <p className="alert alert-error" role="alert">
          Tu sesión de Google expiró: desconectá y volvé a conectar para continuar.
        </p>
      )}

      {!mesasSheet || !correosSheet ? (
        <SourcesPanel
          token={auth.accessToken}
          mesas={mesasSheet}
          correos={correosSheet}
          onMesasLoaded={setMesasSheet}
          onCorreosLoaded={setCorreosSheet}
        />
      ) : !mapping ? (
        <ColumnMappingPanel
          mesas={mesasSheet}
          correos={correosSheet}
          onApply={(mesas, correos) => {
            setOverrides({})
            setPaso('resumen')
            setMapping({ mesas, correos })
          }}
          onChangeSheets={resetSources}
        />
      ) : (
        <section className="flow">
          {parsedMesas && parsedCorreos && teacherRows && paso === 'resumen' && (
            <>
              <ParsedSummaryPanel
                mesasTitle={mesasSheet.title}
                correosTitle={correosSheet.title}
                mesasResult={parsedMesas}
                correosResult={parsedCorreos}
              />
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setPaso('docentes')}
                >
                  Continuar a los docentes
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setMapping(null)}>
                  Revisar columnas
                </button>
                <button type="button" className="btn btn-ghost" onClick={resetSources}>
                  Cambiar hojas
                </button>
              </div>
            </>
          )}

          {parsedCorreos && teacherRows && paso === 'docentes' && (
            <TeacherPanel
              rows={teacherRows}
              correos={parsedCorreos.docentes}
              onOverride={(key, email) =>
                setOverrides((prev) => {
                  const next = { ...prev }
                  if (email === null) delete next[key]
                  else next[key] = email
                  return next
                })
              }
              onContinue={() => setPaso('correo')}
              onBack={() => setPaso('resumen')}
            />
          )}

          {parsedCorreos && teacherRows && paso === 'correo' && (
            <DraftsPanel
              token={auth.accessToken}
              rows={teacherRows}
              correos={parsedCorreos.docentes}
              onBack={() => setPaso('docentes')}
              carrera={mapping.mesas.carreraNombre}
              resolucion={mapping.mesas.resolucion}
            />
          )}
        </section>
      )}
    </main>
  )
}

export default App
