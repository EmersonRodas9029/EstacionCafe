import type { QueryClient } from '@tanstack/react-query'
import { invalidatePrefixes } from '@/lib/query'

const OPERATION_PREFIXES = ['/bills', '/tables', '/bill-details']

/**
 * Las cuentas afectan mesas (estado), totales y detalles: tras cualquier
 * mutación de operación se refrescan las tres familias de queries.
 */
export const invalidateOperation = (queryClient: QueryClient) =>
  invalidatePrefixes(queryClient, OPERATION_PREFIXES)

/** Refresco periódico de vistas compartidas entre meseros (sin tiempo real en la API). */
export const LIVE_REFRESH_MS = 15_000
