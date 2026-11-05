import { describe, expect, it } from 'vitest'
import { DEFAULT_THRESHOLD, matchDocente, nameSimilarity, normalizeName } from './match'
import type { DocenteCorreo } from './types'

const correos: DocenteCorreo[] = [
  { nombre: 'María Gómez', email: 'mgomez@isft93.edu.ar', fila: 2 },
  { nombre: 'Juan Carlos Pérez', email: 'jperez@isft93.edu.ar', fila: 3 },
  { nombre: 'Ana Lucía Torres', email: 'atorres@isft93.edu.ar', fila: 4 },
]

describe('normalizeName', () => {
  it('quita tildes, mayúsculas y puntuación', () => {
    expect(normalizeName('María Gómez')).toBe('maria gomez')
    expect(normalizeName('Gómez, María')).toBe('gomez maria')
  })

  it('quita títulos y iniciales', () => {
    expect(normalizeName('Prof. María Gómez')).toBe('maria gomez')
    expect(normalizeName('Dra. Ana L. Torres')).toBe('ana torres')
  })
})

describe('nameSimilarity', () => {
  it('da 1 con nombres idénticos', () => {
    expect(nameSimilarity('María Gómez', 'maria gomez')).toBe(1)
  })

  it('es alta con variación de orden', () => {
    expect(nameSimilarity('Gómez María', 'María Gómez')).toBeGreaterThan(0.9)
  })

  it('es media con faltantes de letras', () => {
    expect(nameSimilarity('Maria Gomez', 'María Gómez')).toBe(1)
  })

  it('es baja con nombres distintos', () => {
    expect(nameSimilarity('María Gómez', 'Pedro Alen')).toBeLessThan(DEFAULT_THRESHOLD)
  })
})

describe('matchDocente', () => {
  it('encuentra coincidencia exacta', () => {
    const result = matchDocente('María Gómez', correos)
    expect(result.estado).toBe('exacto')
    if (result.estado === 'exacto') {
      expect(result.docente.email).toBe('mgomez@isft93.edu.ar')
    }
  })

  it('encuentra coincidencia difusa', () => {
    const result = matchDocente('Maria Gomez', correos)
    expect(['exacto', 'difuso']).toContain(result.estado)
  })

  it('devuelve sin-match si no hay candidatos', () => {
    const result = matchDocente('Pedro Alen', correos)
    expect(result.estado).toBe('sin-match')
  })

  it('devuelve conflicto si hay dos nombres muy parecidos', () => {
    const ambiguos: DocenteCorreo[] = [
      { nombre: 'Carlos Gómez Lima', email: 'clima@x.com', fila: 2 },
      { nombre: 'Carlos Gómez Lina', email: 'clina@x.com', fila: 3 },
    ]
    const result = matchDocente('Carlos Gomez Limas', ambiguos)
    expect(result.estado).toBe('conflicto')
  })
})
