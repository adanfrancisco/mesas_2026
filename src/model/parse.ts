import type { CorreosMapping, MesasMapping } from './mapping'
import type { DocenteCorreo, Mesa, Participacion, Rol } from './types'

const NAME_SPLITTERS = /\n|;|,/u

export function parseRol(texto: string): Rol {
  const t = texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
  if (t.includes('titular')) return 'titular'
  if (t.includes('acompan') || t.includes('vocal')) return 'acompaniante'
  return 'sin-rol'
}

function cell(row: string[], column: number | null): string {
  if (column === null) return ''
  return (row[column] ?? '').trim()
}

function splitNames(text: string): string[] {
  return text
    .split(NAME_SPLITTERS)
    .map((name) => name.trim())
    .filter(Boolean)
}

export type ParseMesasResult = {
  mesas: Mesa[]
  omitidas: number
}

export function parseMesas(values: string[][], mapping: MesasMapping): ParseMesasResult {
  const mesas: Mesa[] = []
  let omitidas = 0
  let lastFecha = ''
  let lastHora = ''
  let lastCarrera = ''

  values.slice(mapping.headerRow + 1).forEach((row, index) => {
    const rawFecha = cell(row, mapping.fecha)
    const rawHora = cell(row, mapping.hora)
    const rawCarrera = cell(row, mapping.carrera)
    if (rawFecha) lastFecha = rawFecha
    if (rawHora) lastHora = rawHora
    if (rawCarrera) lastCarrera = rawCarrera

    const materia = cell(row, mapping.materia)
    const participaciones: Participacion[] = []

    if (mapping.titular !== null) {
      const titular = cell(row, mapping.titular)
      if (titular) participaciones.push({ nombre: titular, rol: 'titular' })
      for (const column of mapping.acompaniantes) {
        for (const nombre of splitNames(cell(row, column))) {
          participaciones.push({ nombre, rol: 'acompaniante' })
        }
      }
    } else if (mapping.docente !== null) {
      const nombre = cell(row, mapping.docente)
      if (nombre) {
        const rolTexto = mapping.rol !== null ? cell(row, mapping.rol) : ''
        participaciones.push({ nombre, rol: parseRol(rolTexto) })
      }
    }

    if (!materia && participaciones.length === 0) {
      omitidas += 1
      return
    }

    mesas.push({
      fecha: lastFecha,
      hora: lastHora,
      materia,
      carrera: lastCarrera,
      participaciones,
      fila: mapping.headerRow + index + 2,
    })
  })

  return { mesas, omitidas }
}

export type ParseCorreosResult = {
  docentes: DocenteCorreo[]
  omitidas: number
  sinEmailValido: number
}

export function parseCorreos(values: string[][], mapping: CorreosMapping): ParseCorreosResult {
  const docentes: DocenteCorreo[] = []
  let omitidas = 0
  let sinEmailValido = 0

  values.slice(mapping.headerRow + 1).forEach((row, index) => {
    const apellido = mapping.apellido !== null ? cell(row, mapping.apellido) : ''
    const nombreRaw = cell(row, mapping.nombre)
    const nombre = [apellido, nombreRaw].filter(Boolean).join(' ').trim()
    const email = cell(row, mapping.email).toLowerCase()

    if (!nombre && !email) {
      omitidas += 1
      return
    }
    if (!nombre) {
      omitidas += 1
      return
    }
    if (!email.includes('@')) sinEmailValido += 1

    docentes.push({ nombre, email, fila: mapping.headerRow + index + 2 })
  })

  return { docentes, omitidas, sinEmailValido }
}
