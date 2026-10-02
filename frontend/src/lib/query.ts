import type { QueryClient } from '@tanstack/react-query'

/** Invalida todas las queries cuya ruta (primer elemento de la key) empieza con un prefijo. */
export const invalidatePrefixes = (queryClient: QueryClient, prefixes: readonly string[]) =>
  queryClient.invalidateQueries({
    predicate: ({ queryKey }) =>
      typeof queryKey[0] === 'string' &&
      prefixes.some((prefix) => (queryKey[0] as string).startsWith(prefix)),
  })
