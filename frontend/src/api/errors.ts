import type { ApiErrorBody } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly field?: string
  readonly code?: string
  readonly type?: string

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.message ?? `Error ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.field = Array.isArray(body.campo) ? body.campo.join('.') : body.campo
    this.code = body.error
    this.type = body.type
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isStockError() {
    return this.type === 'stock_error'
  }
}
