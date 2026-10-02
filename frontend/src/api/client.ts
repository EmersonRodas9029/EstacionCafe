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

/**
 * Cliente HTTP único. Agrega el token, desempaqueta `{ status, data }`
 * y convierte cualquier error en `ApiError`.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, ...init } = options
  const token = useSessionStore.getState().token

  const response = await fetch(buildUrl(path, query), {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const payload = await parseBody(response)

  if (!response.ok) {
    const error = new ApiError(response.status, (payload ?? {}) as Partial<ApiErrorBody>)
    if (error.isUnauthorized) useSessionStore.getState().clear()
    throw error
  }

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

/** Adaptador para hooks generados por orval (`orval.config.ts`). */
export const orvalMutator = <T>(config: {
  url: string
  method: string
  params?: Record<string, QueryValue>
  data?: unknown
  signal?: AbortSignal
}) =>
  apiRequest<T>(config.url, {
    method: config.method.toUpperCase(),
    query: config.params,
    body: config.data,
    signal: config.signal,
  })
