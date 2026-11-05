import { describe, expect, it } from 'vitest'
import { columnLabel, detectCorreosMapping, detectHeaderRow, detectMesasMapping } from './mapping'

describe('columnLabel', () => {
  it('convierte índice a letra', () => {
    expect(columnLabel(0)).toBe('A')
    expect(columnLabel(25)).toBe('Z')
    expect(columnLabel(26)).toBe('AA')
  })
})

describe('detectHeaderRow', () => {
  it('detecta fila de encabezados por keywords', () => {
    const values = [
      ['ISFT N°93'],
      [''],
      ['Fecha', 'Materia', 'Titular'],
      ['12/11/2026', 'Matemática', 'Ana Gómez'],
    ]
    expect(detectHeaderRow(values)).toBe(2)
  })
})

describe('detectMesasMapping', () => {
  it('mapea columnas por sinónimos', () => {
    const headers = ['Fecha', 'Hora', 'Asignatura', 'Carrera', 'Titular', 'Acompañante']
    const mapping = detectMesasMapping(headers)
    expect(mapping.fecha).toBe(0)
    expect(mapping.hora).toBe(1)
    expect(mapping.materia).toBe(2)
    expect(mapping.carrera).toBe(3)
    expect(mapping.titular).toBe(4)
    expect(mapping.acompaniantes).toEqual([5])
  })

  it('reconoce Vocales como acompañantes', () => {
    const headers = ['Fecha', 'Materia', 'Titular', 'Vocales']
    const mapping = detectMesasMapping(headers)
    expect(mapping.acompaniantes).toEqual([3])
  })
})

describe('detectCorreosMapping', () => {
  it('mapea nombre y correo', () => {
    const mapping = detectCorreosMapping(['Docente', 'Correo electrónico'])
    expect(mapping.nombre).toBe(0)
    expect(mapping.email).toBe(1)
  })
})
