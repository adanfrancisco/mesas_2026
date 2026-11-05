export class SheetsApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'SheetsApiError'
    this.status = status
  }
}

function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Solicitud inválida: revisá la URL y el nombre de la solapa.'
    case 401:
      return 'La sesión de Google expiró: desconectá y volvé a conectar.'
    case 403:
      return 'Permiso denegado al leer la hoja. Verificá que la cuenta conectada tenga acceso y que el alcance "Sheets solo lectura" esté aprobado.'
    case 404:
      return 'No se encontró la hoja: revisá la URL o asegurate de tener acceso a ella.'
    case 429:
      return 'Demasiadas consultas a Google: esperá un minuto y volvé a intentar.'
    default:
      return `Error al consultar Google Sheets (HTTP ${status}).`
  }
}

async function sheetsFetch(token: string, path: string): Promise<unknown> {
  const res = await fetch(`https://sheets.googleapis.com/v4/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new SheetsApiError(res.status, messageForStatus(res.status))
  return res.json()
}

type SheetProperties = { properties?: { title?: string } }
type SheetsPayload = { sheets?: SheetProperties[] }
type ValuesPayload = { values?: unknown[][] }

export async function fetchSheetTitles(token: string, spreadsheetId: string): Promise<string[]> {
  const data = (await sheetsFetch(
    token,
    `spreadsheets/${spreadsheetId}?fields=sheets.properties(title)`,
  )) as SheetsPayload
  return (data.sheets ?? [])
    .map((s) => s.properties?.title ?? '')
    .filter((title): title is string => title.length > 0)
}

export async function fetchSheetValues(
  token: string,
  spreadsheetId: string,
  sheetTitle: string,
): Promise<string[][]> {
  const quoted = `'${sheetTitle.replaceAll("'", "''")}'!A:AZ`
  const data = (await sheetsFetch(
    token,
    `spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quoted)}?majorDimension=ROWS`,
  )) as ValuesPayload
  return (data.values ?? []).map((row) => row.map((cell) => (cell == null ? '' : String(cell))))
}

export type ParsedUrl = { id: string } | { error: string }

export function extractSpreadsheetId(input: string): ParsedUrl {
  const trimmed = input.trim()
  if (!trimmed) return { error: 'Ingresá la URL de la hoja.' }

  const standard = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (standard) return { id: standard[1] }

  const published = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9_-]+)/)
  if (published) {
    return {
      error:
        'Esa URL es de una hoja publicada. Copiá la URL del editor: https://docs.google.com/spreadsheets/d/ID/edit',
    }
  }

  if (/^[a-zA-Z0-9_-]{30,}$/.test(trimmed)) return { id: trimmed }

  return {
    error: 'No se reconoce la URL. Ejemplo: https://docs.google.com/spreadsheets/d/ABC123xyz/edit',
  }
}
