/** Envelope común de la API: { status, message, data } */
export type ApiSuccess<T> = {
  status: 'success'
  message: string
  data: T
}

export type ApiErrorBody = {
  status: 'error'
  message: string
  /** Campo que falló la validación Zod */
  campo?: string | string[]
  /** Código de error Zod */
  error?: string
  /** p. ej. "stock_error" en POST /bill-details */
  type?: string
}
