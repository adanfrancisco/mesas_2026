import type { TeacherRow } from '../model/group'
import type { DocenteCorreo } from '../model/types'
import type { MesaConRol } from '../model/group'

export type DraftTarget = {
  email: string
  nombre: string
  items: MesaConRol[]
}

export type DraftTargetsResult = {
  targets: DraftTarget[]
  sinCorreo: number
}

export function buildDraftTargets(
  rows: TeacherRow[],
  correos: DocenteCorreo[],
): DraftTargetsResult {
  const nombrePorEmail = new Map<string, string>()
  for (const docente of correos) {
    const email = docente.email.trim().toLowerCase()
    if (email && !nombrePorEmail.has(email)) nombrePorEmail.set(email, docente.nombre)
  }

  const porEmail = new Map<string, DraftTarget>()
  let sinCorreo = 0

  for (const row of rows) {
    const email = row.email?.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      sinCorreo += 1
      continue
    }
    const nombre = nombrePorEmail.get(email) ?? row.group.nombre
    const target = porEmail.get(email)
    if (target) {
      target.items.push(...row.group.items)
    } else {
      porEmail.set(email, { email, nombre, items: [...row.group.items] })
    }
  }

  const targets = [...porEmail.values()]
  targets.forEach((target) =>
    target.items.sort((a, b) =>
      (a.mesa.fecha + a.mesa.hora).localeCompare(b.mesa.fecha + b.mesa.hora, 'es'),
    ),
  )
  targets.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return { targets, sinCorreo }
}
