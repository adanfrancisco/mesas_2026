export type MesasMapping = {
  headerRow: number
  fecha: number | null
  hora: number | null
  materia: number | null
  carrera: number | null
  titular: number | null
  acompaniantes: number[]
  docente: number | null
  rol: number | null
  carreraNombre: string
  resolucion: string
}

export type CorreosMapping = {
  headerRow: number
  nombre: number | null
  apellido: number | null
  email: number | null
}

export function normalizeHeader(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[:;.,/]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function columnLabel(index: number): string {
  let label = ''
  let n = index
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

function nonEmptyCount(row: string[]): number {
  return row.reduce((count, cell) => (cell.trim() ? count + 1 : count), 0)
}

const FECHA = ['fecha', 'fechas', 'fecha de examen', 'fecha mesa']
const HORA = ['hora', 'horario', 'hs', 'hora desde', 'hora inicio']
const MATERIA = ['materia', 'asignatura', 'examinal']
const CARRERA = ['carrera', 'carreras', 'plan', 'titulatura']
const TITULAR = ['titular', 'titulares', 'profesor titular', 'docente titular', 'prof/a titular']
const ACOMPANIANTE = ['acompanante', 'acompanantes', 'vocal', 'vocales', 'co-titular']
const APELLIDO = ['apellido', 'apellidos', 'apellido y nombre']
const DOCENTE = ['docente', 'docentes', 'apellido y nombre', 'apellido y nombres']
const ROL = ['rol', 'funcion', 'caracter', 'participacion']
const NOMBRE = [
  'nombre',
  'nombres',
  'docente',
  'docentes',
  'apellido y nombre',
  'apellido y nombres',
]
const EMAIL = ['correo', 'correos', 'email', 'e-mail', 'mail', 'correo electronico']

function scoreHeader(normalized: string, keywords: string[]): number {
  if (keywords.includes(normalized)) return 3
  if (keywords.some((k) => normalized.startsWith(k))) return 2
  if (keywords.some((k) => normalized.includes(k))) return 1
  return 0
}

function bestColumn(headers: string[], keywords: string[], taken: Set<number>): number | null {
  let best: number | null = null
  let bestScore = 0
  headers.forEach((header, index) => {
    if (taken.has(index)) return
    const score = scoreHeader(normalizeHeader(header), keywords)
    if (score > bestScore) {
      bestScore = score
      best = index
    }
  })
  return best
}

export function detectHeaderRow(values: string[][]): number {
  const scan = values.slice(0, 20)
  const keywordSets = [FECHA, MATERIA, TITULAR, ACOMPANIANTE, DOCENTE, EMAIL, NOMBRE]
  const scoredIndex = scan.findIndex((row) => {
    const normalized = row.map(normalizeHeader)
    const matches = keywordSets.filter((keywords) =>
      normalized.some((h) => scoreHeader(h, keywords) >= 2),
    ).length
    return matches >= 2
  })
  if (scoredIndex >= 0) return scoredIndex

  let bestRow = 0
  let bestCount = -1
  scan.slice(0, 12).forEach((row, index) => {
    const count = nonEmptyCount(row)
    if (count > bestCount) {
      bestCount = count
      bestRow = index
    }
  })
  return bestRow
}

export function detectMesasMapping(headers: string[]): MesasMapping {
  const taken = new Set<number>()
  const claim = (keywords: string[]): number | null => {
    const column = bestColumn(headers, keywords, taken)
    if (column !== null) taken.add(column)
    return column
  }

  const fecha = claim(FECHA)
  const hora = claim(HORA)
  const materia = claim(MATERIA)
  const carrera = claim(CARRERA)
  const titular = claim(TITULAR)

  const acompaniantes: number[] = []
  headers.forEach((header, index) => {
    if (taken.has(index)) return
    if (scoreHeader(normalizeHeader(header), ACOMPANIANTE) >= 2) {
      taken.add(index)
      acompaniantes.push(index)
    }
  })

  const docente = claim(DOCENTE)
  const rol = claim(ROL)

  return { headerRow: 0, fecha, hora, materia, carrera, titular, acompaniantes, docente, rol, carreraNombre: '', resolucion: '' }
}

export function detectCorreosMapping(headers: string[]): CorreosMapping {
  const taken = new Set<number>()
  const apellido = bestColumn(headers, APELLIDO, taken)
  if (apellido !== null) taken.add(apellido)
  const nombre = bestColumn(headers, NOMBRE, taken)
  if (nombre !== null) taken.add(nombre)
  const email = bestColumn(headers, EMAIL, taken)
  return { headerRow: 0, nombre, apellido, email }
}

export function extractSheetMeta(
  values: string[][],
  headerRow: number,
): { carreraNombre: string; resolucion: string } {
  const pre = values.slice(0, Math.max(0, headerRow))
  const texts: string[] = []
  pre.forEach((row) => {
    const joined = row.map((cell) => (cell ?? '').trim()).filter(Boolean).join(' ')
    if (joined) texts.push(joined)
  })

  let carreraNombre = ''
  let resolucion = ''
  for (const text of texts) {
    if (/resoluci/i.test(text) || /\bres\.?\s*\d/i.test(text)) {
      if (!resolucion) resolucion = text
      continue
    }
    if (!carreraNombre && text.length >= 4 && !/fecha|materia|titular|vocal|email|correo/i.test(text)) {
      carreraNombre = text
    }
  }
  if (!carreraNombre && texts.length > 0) carreraNombre = texts[0]

  return { carreraNombre, resolucion }
}
export function detectEmailColumnByContent(values: string[][], headerRow: number): number | null {
  const sample = values.slice(headerRow + 1, headerRow + 11)
  const columnCount = Math.max(0, ...values.slice(0, headerRow + 11).map((r) => r.length))
  for (let column = 0; column < columnCount; column += 1) {
    const withAt = sample.filter((row) => (row[column] ?? '').includes('@')).length
    if (sample.length > 0 && withAt >= Math.ceil(sample.length / 2)) return column
  }
  return null
}
