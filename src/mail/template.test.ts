import { describe, expect, it } from 'vitest'
import { buildTemplateVars, formatMesaLine, renderTemplate } from './template'
import type { MesaConRol } from '../model/group'
import type { Mesa } from '../model/types'

const mesa: Mesa = {
  fecha: '12/11/2026',
  hora: '09:00',
  materia: 'Matemática',
  carrera: 'TUDS',
  participaciones: [],
  fila: 2,
}

const item: MesaConRol = {
  mesa,
  rol: 'titular',
  colegas: ['Luis Pérez'],
  acompaniaA: [],
}

describe('renderTemplate', () => {
  it('reemplaza placeholders', () => {
    expect(renderTemplate('Hola {{docente}}', { docente: 'Ana' })).toBe('Hola Ana')
  })

  it('respeta placeholders desconocidos', () => {
    expect(renderTemplate('Hola {{otro}}', { docente: 'Ana' })).toBe('Hola {{otro}}')
  })
})

describe('formatMesaLine', () => {
  it('arma la línea con fecha, materia, rol y colegas', () => {
    expect(formatMesaLine(item)).toBe(
      '12/11/2026 09:00 — Matemática — (TUDS) — titular — con Luis Pérez',
    )
  })
})

describe('buildTemplateVars', () => {
  it('arma las variables para la plantilla', () => {
    const vars = buildTemplateVars('Ana Gómez', [item])
    expect(vars.docente).toBe('Ana Gómez')
    expect(vars.cantidad).toBe('1')
    expect(vars.mesas).toContain('Matemática')
    expect(vars.colegas).toBe('Luis Pérez')
  })
})
