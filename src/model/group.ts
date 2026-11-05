import { matchDocente, normalizeName, type MatchResult } from './match'
import type { DocenteCorreo, Mesa, Rol } from './types'

export type MesaConRol = {
  mesa: Mesa
  rol: Rol
  colegas: string[]
  acompaniaA: string[]
}

export type TeacherGroup = {
  key: string
  nombre: string
  items: MesaConRol[]
}

export function groupByTeacher(mesas: Mesa[]): TeacherGroup[] {
  const groups = new Map<string, TeacherGroup>()

  for (const mesa of mesas) {
    for (const participacion of mesa.participaciones) {
      const key = normalizeName(participacion.nombre)
      if (!key) continue

      let group = groups.get(key)
      if (!group) {
        group = { key, nombre: participacion.nombre, items: [] }
        groups.set(key, group)
      }

      const colegas = mesa.participaciones
        .filter((other) => other.nombre !== participacion.nombre)
        .map((other) => other.nombre)

      const acompaniaA = mesa.participaciones
        .filter((other) => other.nombre !== participacion.nombre && other.rol === 'titular')
        .map((other) => other.nombre)

      group.items.push({ mesa, rol: participacion.rol, colegas, acompaniaA })
    }
  }

  return [...groups.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export type TeacherRow = {
  group: TeacherGroup
  match: MatchResult
  email: string | null
  manual: boolean
}

export type EstadoFila = 'exacto' | 'difuso' | 'sin-match' | 'conflicto' | 'manual'

export function estadoDeFila(row: TeacherRow): EstadoFila {
  if (row.manual) return 'manual'
  return row.match.estado
}

export function buildTeacherRows(
  groups: TeacherGroup[],
  correos: DocenteCorreo[],
  overrides: Record<string, string>,
): TeacherRow[] {
  return groups.map((group) => {
    const overrideEmail = overrides[group.key]
    if (overrideEmail) {
      return { group, match: { estado: 'sin-match' }, email: overrideEmail, manual: true }
    }
    const match = matchDocente(group.nombre, correos)
    if (match.estado === 'sin-match') {
      return { group, match, email: null, manual: false }
    }
    if (match.estado === 'conflicto') {
      return { group, match, email: null, manual: false }
    }
    return { group, match, email: match.docente.email, manual: false }
  })
}
