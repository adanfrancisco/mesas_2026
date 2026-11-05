import type { DocenteCorreo } from './types'

const TITLES = new Set([
  'prof',
  'profa',
  'profesor',
  'profesora',
  'dra',
  'dr',
  'lic',
  'mtro',
  'mts',
  'ing',
  'abg',
  'sr',
  'sra',
  'ms',
  'mr',
])

export function normalizeName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/u)
    .filter((token) => token.length > 1 && !TITLES.has(token))
    .join(' ')
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(current[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = current
  }
  return prev[b.length]
}

function levenshteinSimilarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1
  const max = Math.max(a.length, b.length)
  return 1 - levenshtein(a, b) / max
}

function tokenSet(text: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const token of text.split(' ').filter(Boolean)) {
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }
  return counts
}

function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a || !b) return 0
  const tokensA = tokenSet(a)
  const tokensB = tokenSet(b)
  let common = 0
  for (const [token, count] of tokensA) {
    common += Math.min(count, tokensB.get(token) ?? 0)
  }
  return (2 * common) / (a.split(' ').length + b.split(' ').length)
}

function containmentSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.split(' ').filter(Boolean))
  const tokensB = new Set(b.split(' ').filter(Boolean))
  if (tokensA.size === 0 || tokensB.size === 0) return 0
  const shorter = Math.min(a.length, b.length)
  if (shorter < 6) return 0
  let common = 0
  for (const token of tokensA) {
    if (tokensB.has(token)) common += 1
  }
  return (common / Math.min(tokensA.size, tokensB.size)) * 0.95
}

export function nameSimilarity(rawA: string, rawB: string): number {
  const a = normalizeName(rawA)
  const b = normalizeName(rawB)
  if (!a || !b) return 0
  if (a === b) return 1
  return Math.max(levenshteinSimilarity(a, b), diceSimilarity(a, b), containmentSimilarity(a, b))
}

export const DEFAULT_THRESHOLD = 0.72

export type MatchCandidate = { docente: DocenteCorreo; score: number }

export type MatchResult =
  | { estado: 'exacto'; docente: DocenteCorreo }
  | { estado: 'difuso'; docente: DocenteCorreo; score: number }
  | { estado: 'conflicto'; candidatos: MatchCandidate[] }
  | { estado: 'sin-match' }

export function matchDocente(
  nombreMesa: string,
  docentes: DocenteCorreo[],
  threshold: number = DEFAULT_THRESHOLD,
): MatchResult {
  const normalized = normalizeName(nombreMesa)
  if (!normalized) return { estado: 'sin-match' }

  const exact = docentes.find((docente) => normalizeName(docente.nombre) === normalized)
  if (exact) return { estado: 'exacto', docente: exact }

  const scored: MatchCandidate[] = []
  for (const docente of docentes) {
    const score = nameSimilarity(nombreMesa, docente.nombre)
    if (score >= threshold) scored.push({ docente, score })
  }
  scored.sort((a, b) => b.score - a.score)

  if (scored.length === 0) return { estado: 'sin-match' }
  if (
    scored.length >= 2 &&
    scored[0].score - scored[1].score < 0.06 &&
    scored[0].docente.email !== scored[1].docente.email
  ) {
    return { estado: 'conflicto', candidatos: scored.slice(0, 3) }
  }
  return { estado: 'difuso', docente: scored[0].docente, score: scored[0].score }
}
