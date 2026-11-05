import { useMemo, useState } from 'react'
import { createDraft, errorMessage, GmailApiError } from '../google/gmail'
import type { DocenteCorreo } from '../model/types'
import type { TeacherRow } from '../model/group'
import { buildDraftTargets } from '../mail/targets'
import {
  AVAILABLE_PLACEHOLDERS,
  buildTemplateVars,
  DEFAULT_BODY,
  DEFAULT_SUBJECT,
  renderTemplate,
} from '../mail/template'

type Props = {
  token: string
  rows: TeacherRow[]
  correos: DocenteCorreo[]
  onBack: () => void
  carrera?: string
  resolucion?: string
}

type DraftResult = {
  email: string
  nombre: string
  ok: boolean
  detalle: string
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function DraftsPanel({ token, rows, correos, onBack, carrera, resolucion }: Props) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [body, setBody] = useState(DEFAULT_BODY)
  const [previewEmail, setPreviewEmail] = useState('')
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults] = useState<DraftResult[]>([])
  const [fatalError, setFatalError] = useState<string | null>(null)
const [copied, setCopied] = useState(false)

  const { targets, sinCorreo } = useMemo(() => buildDraftTargets(rows, correos), [rows, correos])

  const selectedTarget =
    targets.find((target) => target.email === previewEmail) ?? targets[0] ?? null

  const preview = useMemo(() => {
    if (!selectedTarget) return null
    const vars = buildTemplateVars(selectedTarget.nombre, selectedTarget.items, { carrera, resolucion })
    return {
      to: selectedTarget.email,
      subject: renderTemplate(subject, vars),
      body: renderTemplate(body, vars),
    }
  }, [selectedTarget, subject, body, carrera, resolucion])

  const crearBorradores = async () => {
    if (targets.length === 0 || phase === 'running') return
    setPhase('running')
    setFatalError(null)
    setResults([])
    setProgress({ done: 0, total: targets.length })

    const acumulados: DraftResult[] = []

    for (let i = 0; i < targets.length; i += 1) {
      const target = targets[i]
      const vars = buildTemplateVars(target.nombre, target.items, { carrera, resolucion })
      const draft = {
        to: target.email,
        subject: renderTemplate(subject, vars),
        body: renderTemplate(body, vars),
      }

      let ok = false
      let detalle = ''
      try {
        await createDraft(token, draft)
        ok = true
      } catch (err) {
        if (err instanceof GmailApiError && err.status === 429) {
          await delay(1500)
          try {
            await createDraft(token, draft)
            ok = true
          } catch (retryErr) {
            detalle = errorMessage(retryErr)
            if (retryErr instanceof GmailApiError && retryErr.status === 401) {
              setFatalError(detalle)
            }
          }
        } else {
          detalle = errorMessage(err)
          if (err instanceof GmailApiError && err.status === 401) {
            setFatalError(detalle)
          }
        }
      }

      acumulados.push({ email: target.email, nombre: target.nombre, ok, detalle })
      setResults([...acumulados])
      setProgress({ done: i + 1, total: targets.length })
      await delay(250)
    }

    setPhase('done')
  }

  const creados = results.filter((r) => r.ok).length
  const fallidos = results.length - creados

  return (
    <section className="panel">
      <h2>Paso 4 · Borradores de correo</h2>
      <p className="hint">
        La app crea <strong>borradores</strong> (no envía). Los encontrás en Gmail en Borradores
        para revisarlos y enviarlos. {targets.length} borrador{targets.length === 1 ? '' : 'es'} a
        crear
        {sinCorreo > 0 && (
          <>
            {' '}
            · <strong>{sinCorreo}</strong> docente{sinCorreo === 1 ? '' : 's'} queda
            {sinCorreo === 1 ? '' : 'n'} afuera por no tener correo asignado
          </>
        )}
        .
      </p>

      <div className="template-grid">
        <label className="field">
          <span>Asunto</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={phase === 'running'}
          />
        </label>
        <div className="placeholder-help">
          <span>Placeholders disponibles:</span>
          <div className="placeholder-chips">
            {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
              <code key={placeholder}>{placeholder}</code>
            ))}
          </div>
        </div>
      </div>

      <label className="field">
        <span>Cuerpo del correo</span>
        <textarea
          rows={12}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={phase === 'running'}
        />
      </label>

      <div className="template-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setSubject(DEFAULT_SUBJECT)
            setBody(DEFAULT_BODY)
          }}
          disabled={phase === 'running'}
        >
          Restablecer plantilla
        </button>
        <button
          type="button"
          className="btn"
          onClick={async () => {
            if (!preview) return
            const text = `Para: ${selectedTarget?.nombre ?? ''} <${preview.to}>\nAsunto: ${preview.subject}\n\n${preview.body}`
            try {
              await navigator.clipboard.writeText(text)
            } catch {
              const textarea = document.createElement('textarea')
              textarea.value = text
              textarea.style.position = 'fixed'
              textarea.style.opacity = '0'
              document.body.appendChild(textarea)
              textarea.select()
              document.execCommand('copy')
              document.body.removeChild(textarea)
            }
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          disabled={phase === 'running' || !preview}
        >
          {copied ? 'Copiado' : 'Copiar al portapapeles'}
        </button>
      </div>

      {selectedTarget && preview && (
        <div className="preview-email">
          <div className="preview-email-head">
            <strong>Vista previa</strong>
            <select
              value={selectedTarget.email}
              onChange={(e) => setPreviewEmail(e.target.value)}
              disabled={phase === 'running'}
            >
              {targets.map((target) => (
                <option key={target.email} value={target.email}>
                  {target.nombre}
                </option>
              ))}
            </select>
          </div>
          <p className="preview-line">
            <span>Para:</span> {selectedTarget.nombre} &lt;{preview.to}&gt;
          </p>
          <p className="preview-line">
            <span>Asunto:</span> {preview.subject}
          </p>
          <pre className="preview-body">{preview.body}</pre>
        </div>
      )}

      {fatalError && (
        <p className="alert alert-error" role="alert">
          {fatalError}
        </p>
      )}

      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={crearBorradores}
          disabled={phase === 'running' || targets.length === 0}
        >
          {phase === 'running'
            ? `Creando… ${progress.done}/${progress.total}`
            : `Crear ${targets.length} borrador${targets.length === 1 ? '' : 'es'} en Gmail`}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onBack}
          disabled={phase === 'running'}
        >
          Volver a docentes
        </button>
        {phase === 'done' && (
          <a
            className="btn"
            href="https://mail.google.com/mail/u/0/#drafts"
            target="_blank"
            rel="noreferrer"
          >
            Abrir borradores en Gmail
          </a>
        )}
      </div>

      {results.length > 0 && (
        <p className={`alert ${fallidos === 0 ? 'alert-ok' : 'alert-error'}`} role="status">
          {phase === 'done'
            ? `${creados} borrador${creados === 1 ? '' : 'es'} creado${creados === 1 ? '' : 's'}${
                fallidos > 0 ? `, ${fallidos} con error` : ''
              }.`
            : `Progreso: ${progress.done}/${progress.total}…`}
        </p>
      )}

      {results.length > 0 && (
        <ul className="result-list">
          {results.map((result) => (
            <li key={result.email} className={result.ok ? 'ok' : 'error'}>
              <span className="result-name">{result.nombre}</span>{' '}
              <span>{result.ok ? 'borrador creado' : `error: ${result.detalle}`}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
