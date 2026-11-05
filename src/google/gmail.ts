export class GmailApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GmailApiError'
    this.status = status
  }
}

function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Gmail rechazó el borrador (solicitud inválida).'
    case 401:
      return 'La sesión de Google expiró: desconectá y volvé a conectar.'
    case 403:
      return 'Permiso denegado por Gmail. Verificá el alcance "crear borradores".'
    case 429:
      return 'Demasiadas consultas a Gmail: esperá unos segundos y volvé a intentar.'
    default:
      return `Error al crear el borrador en Gmail (HTTP ${status}).`
  }
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export function base64UrlEncode(text: string): string {
  return encodeBase64(new TextEncoder().encode(text))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function encodeHeader(header: string): string {
  if (/^[\x20-\x7E]*$/.test(header)) return header
  return `=?UTF-8?B?${encodeBase64(new TextEncoder().encode(header))}?=`
}

export type DraftContent = {
  to: string
  subject: string
  body: string
}

export async function createDraft(token: string, draft: DraftContent): Promise<string> {
  const message = [
    `To: ${draft.to}`,
    `Subject: ${encodeHeader(draft.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    draft.body,
  ].join('\r\n')

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw: base64UrlEncode(message) } }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const text = await res.text()
      const parsed = JSON.parse(text) as { error?: { message?: string; status?: string } }
      detail = parsed.error?.message ?? parsed.error?.status ?? ''
    } catch {
      detail = ''
    }
    const base = messageForStatus(res.status)
    throw new GmailApiError(res.status, detail ? `${base} — ${detail}` : base)
  }

  const data = (await res.json()) as { id?: string }
  return data.id ?? ''
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Ocurrió un error inesperado al crear el borrador.'
}
