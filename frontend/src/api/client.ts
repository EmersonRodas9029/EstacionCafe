import { env } from '@/lib/env'
import { useSessionStore } from '@/features/auth/session-store'
import { ApiError } from './errors'
import type { ApiErrorBody, ApiSuccess } from './types'

type QueryValue = string | number | boolean | undefined

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  query?: Record<string, QueryValue>
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = `${env.apiUrl}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

/** Envía la petición con token y convierte errores en ApiError. Devuelve el body completo. */
async function send(url: string, init: RequestInit): Promise<unknown> {
  const token = useSessionStore.getState().token
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, { ...init, headers, credentials: 'include' })
  const payload = await parseBody(response)

  if (!response.ok) {
    const error = new ApiError(response.status, (payload ?? {}) as Partial<ApiErrorBody>)
    if (error.isUnauthorized) useSessionStore.getState().clear()
    throw error
  }
  return payload
}

/**
 * Cliente HTTP para código escrito a mano: desempaqueta `{ status, data }`.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, ...init } = options
  const payload = await send(buildUrl(path, query), {
    ...init,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return (payload as ApiSuccess<T> | undefined)?.data as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
}

/**
 * Mutator de orval (`orval.config.ts`). Devuelve el envelope completo,
 * que es lo que describen los tipos generados (usar `select: (r) => r.data`).
 */
export const orvalMutator = <T>(url: string, init: RequestInit = {}): Promise<T> =>
  send(`${env.apiUrl}${url}`, init) as Promise<T>

/** orval usa este tipo para el TError de los hooks: el cliente siempre lanza ApiError. */
export type ErrorType<_Body = unknown> = ApiError
