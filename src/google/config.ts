export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '605578125207-1cderk5v11t08lhgkajv2utdrjilbmf7.apps.googleusercontent.com'

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
].join(' ')
