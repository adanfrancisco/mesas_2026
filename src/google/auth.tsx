import { useGoogleLogin } from '@react-oauth/google'
import { useCallback, useEffect, useState } from 'react'
import { GOOGLE_SCOPES } from './config'

type AuthState = {
  accessToken: string | null
  expiresAt: number | null
  error: string | null
}

const INITIAL_STATE: AuthState = { accessToken: null, expiresAt: null, error: null }

export function useGoogleAuth() {
  const [state, setState] = useState<AuthState>(INITIAL_STATE)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!state.expiresAt) return
    const remaining = Math.max(0, state.expiresAt - Date.now())
    const timer = setTimeout(() => setIsExpired(true), remaining)
    return () => clearTimeout(timer)
  }, [state.expiresAt])

  const login = useGoogleLogin({
    scope: GOOGLE_SCOPES,
    onSuccess: (response) => {
      setIsExpired(false)
      setState({
        accessToken: response.access_token,
        expiresAt: response.expires_in ? Date.now() + response.expires_in * 1000 : null,
        error: null,
      })
    },
    onError: () =>
      setState((prev) => ({
        ...prev,
        error:
          'No se pudo completar la conexión con Google. Revisá la configuración del OAuth Client (ver docs/google-cloud-setup.md).',
      })),
    onNonOAuthError: (err) => {
      if (err.type === 'popup_closed') {
        setState((prev) => ({ ...prev, error: null }))
        return
      }
      setState((prev) => ({
        ...prev,
        error:
          err.type === 'popup_failed_to_open'
            ? 'Se bloqueó la ventana emergente de Google. Permití las ventanas emergentes para este sitio y volvé a intentar.'
            : 'Ocurrió un error inesperado al conectar con Google. Intentá nuevamente.',
      }))
    },
  })

  const connect = useCallback(() => login(), [login])

  const disconnect = useCallback(() => {
    setIsExpired(false)
    setState(INITIAL_STATE)
  }, [])

  return { ...state, isExpired, connect, disconnect }
}

export type GoogleAuth = ReturnType<typeof useGoogleAuth>
