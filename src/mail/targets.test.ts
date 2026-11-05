import { describe, expect, it } from 'vitest'
import { buildDraftTargets } from './targets'
import type { TeacherRow } from '../model/group'
import type { Mesa } from '../model/types'

function makeRow(key: string, nombre: string, email: string | null, mesaFecha: string): TeacherRow {
  const mesa: Mesa = {
    fecha: mesaFecha,
    hora: '09:00',
    materia: `Materia ${mesaFecha}`,
    carrera: 'TUDS',
    participaciones: [],
    fila: 1,
  }
  return {
    group: {
      key,
      nombre,
      items: [{ mesa, rol: 'titular', colegas: [], acompaniaA: [] }],
    },
    match: email
      ? { estado: 'exacto', docente: { nombre, email, fila: 1 } }
      : { estado: 'sin-match' },
    email,
    manual: false,
  }
}

describe('buildDraftTargets', () => {
  it('deduplica por email y mezcla mesas', () => {
    const rows = [
      makeRow('ana', 'Ana Gómez', 'agomez@x.com', '12/11/2026'),
      makeRow('ana variant', 'Gómez, Ana', 'agomez@x.com', '13/11/2026'),
    ]
    const { targets, sinCorreo } = buildDraftTargets(rows, [])
    expect(targets).toHaveLength(1)
    expect(targets[0].items).toHaveLength(2)
    expect(sinCorreo).toBe(0)
  })

  it('cuenta los docentes sin correo', () => {
    const rows = [
      makeRow('ana', 'Ana Gómez', 'agomez@x.com', '12/11/2026'),
      makeRow('luis', 'Luis Pérez', null, '12/11/2026'),
    ]
    const { targets, sinCorreo } = buildDraftTargets(rows, [])
    expect(targets).toHaveLength(1)
    expect(sinCorreo).toBe(1)
  })
})
