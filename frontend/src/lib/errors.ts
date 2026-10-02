import { ApiError } from '@/api/errors'

/** Mensaje mostrable: el de la API para errores de negocio, genérico para fallos de red/servidor. */
export const errorMessage = (error: unknown, fallback = 'Ocurrió un error. Intenta de nuevo.') =>
  error instanceof ApiError && error.status < 500 ? error.message : fallback
