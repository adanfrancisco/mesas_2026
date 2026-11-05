import type { MesaConRol } from '../model/group'
import type { Rol } from '../model/types'

export const DEFAULT_SUBJECT = 'Mesas de examen ISFT N°93 — {{docente}}'

export const DEFAULT_BODY = `Hola {{docente}},

Te comparto las mesas de examen del ISFT N°93 en las que figurás ({{cantidad}}):

{{mesas}}

Por favor, revisá los datos y avisá si hay alguna corrección.

¡Gracias!`

export const AVAILABLE_PLACEHOLDERS = [
  '{{docente}}',
  '{{cantidad}}',
  '{{mesas}}',
  '{{colegas}}',
  '{{carrera}}',
  '{{resolucion}}',
]

const ROL_LABEL: Record<Rol, string> = {
  titular: 'titular',
  acompaniante: 'acompañante',
  'sin-rol': 'docente',
}

export function formatMesaLine(item: MesaConRol): string {
  const { mesa, rol, colegas, acompaniaA } = item
  const when = [mesa.fecha, mesa.hora].filter(Boolean).join(' ')
  const rolText =
    rol === 'acompaniante' && acompaniaA && acompaniaA.length > 0
      ? `acompañante de ${acompaniaA.join(', ')}`
      : ROL_LABEL[rol]
  const accompaniment =
    rol === 'acompaniante' && acompaniaA && acompaniaA.length > 0
      ? ''
      : colegas.length > 0
        ? `con ${colegas.join(', ')}`
        : ''
  return [
    when,
    mesa.materia || '(sin materia)',
    mesa.carrera ? `(${mesa.carrera})` : '',
    rolText,
    accompaniment,
  ]
    .filter(Boolean)
    .join(' — ')
}

export function buildTemplateVars(
  nombre: string,
  items: MesaConRol[],
  extra?: { carrera?: string; resolucion?: string },
): Record<string, string> {
  const colegas = [...new Set(items.flatMap((item) => item.colegas).filter(Boolean))]
  return {
    docente: nombre,
    cantidad: String(items.length),
    mesas: items.map((item) => `• ${formatMesaLine(item)}`).join('\n'),
    colegas: colegas.join(', '),
    carrera: extra?.carrera ?? items[0]?.mesa?.carrera ?? '',
    resolucion: extra?.resolucion ?? '',
  }
}

export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) => vars[key] ?? match)
}
