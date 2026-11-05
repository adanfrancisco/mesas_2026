import { describe, expect, it } from 'vitest'
import { parseCorreos, parseMesas, parseRol } from './parse'
import type { CorreosMapping, MesasMapping } from './mapping'

const mesasMapping: MesasMapping = {
  headerRow: 0,
  fecha: 0,
  hora: 1,
  materia: 2,
  carrera: 3,
  titular: 4,
  acompaniante: 5,
  acompaniantes: [5],
  docente: null,
  rol: null,
  carreraNombre: '',
  resolucion: '',
}

describe('parseRol', () => {
  it('detecta titular y acompañante', () => {
    expect(parseRol('Titular')).toBe('titular')
    expect(parseRol('Acompañante')).toBe('acompaniante')
    expect(parseRol('Vocal')).toBe('acompaniante')
    expect(parseRol('')).toBe('sin-rol')
  })
})

describe('parseMesas', () => {
  it('parsea filas con titular y acompañante', () => {
    const values = [
      ['Fecha', 'Hora', 'Materia', 'Carrera', 'Titular', 'Acompañante'],
      ['12/11/2026', '09:00', 'Matemática', 'TUDS', 'Ana Gómez', 'Luis Pérez'],
    ]
    const result = parseMesas(values, mesasMapping)
    expect(result.mesas).toHaveLength(1)
    expect(result.mesas[0].fecha).toBe('12/11/2026')
    expect(result.mesas[0].participaciones).toHaveLength(2)
    expect(result.mesas[0].participaciones[0].rol).toBe('titular')
    expect(result.mesas[0].participaciones[1].rol).toBe('acompaniante')
  })

  it('propaga fecha y hora en filas combinadas', () => {
    const values = [
      ['Fecha', 'Hora', 'Materia', 'Carrera', 'Titular', 'Acompañante'],
      ['12/11/2026', '09:00', 'Matemática', 'TUDS', 'Ana Gómez', 'Luis Pérez'],
      ['', '', 'Física', 'TUDS', 'Juan Ruiz', ''],
    ]
    const result = parseMesas(values, mesasMapping)
    expect(result.mesas[1].fecha).toBe('12/11/2026')
    expect(result.mesas[1].hora).toBe('09:00')
  })

  it('omite filas vacías', () => {
    const values = [
      ['Fecha', 'Hora', 'Materia', 'Carrera', 'Titular', 'Acompañante'],
      ['', '', '', '', '', ''],
      ['12/11/2026', '09:00', 'Matemática', 'TUDS', 'Ana Gómez', ''],
    ]
    const result = parseMesas(values, mesasMapping)
    expect(result.mesas).toHaveLength(1)
    expect(result.omitidas).toBe(1)
  })

  it('separa varios acompañantes en una celda', () => {
    const values = [
      ['Fecha', 'Hora', 'Materia', 'Carrera', 'Titular', 'Acompañante'],
      ['12/11/2026', '09:00', 'Matemática', 'TUDS', 'Ana Gómez', 'Luis Pérez, María López'],
    ]
    const result = parseMesas(values, mesasMapping)
    expect(result.mesas[0].participaciones).toHaveLength(3)
  })
})

describe('parseCorreos', () => {
  const correosMapping: CorreosMapping = {
    headerRow: 0,
    nombre: 0,
    apellido: null,
    email: 1,
  }

  it('parsea nombre y email', () => {
    const values = [
      ['Nombre', 'Correo'],
      ['Ana Gómez', 'agomez@isft93.edu.ar'],
    ]
    const result = parseCorreos(values, correosMapping)
    expect(result.docentes).toHaveLength(1)
    expect(result.docentes[0].email).toBe('agomez@isft93.edu.ar')
  })

  it('omite filas vacías y cuenta emails inválidos', () => {
    const values = [
      ['Nombre', 'Correo'],
      ['', ''],
      ['Ana Gómez', 'agomez@isft93.edu.ar'],
      ['Luis Pérez', 'sin-arroba'],
    ]
    const result = parseCorreos(values, correosMapping)
    expect(result.docentes).toHaveLength(2)
    expect(result.omitidas).toBe(1)
    expect(result.sinEmailValido).toBe(1)
  })
})
