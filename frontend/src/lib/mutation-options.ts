import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from './errors'
import { invalidatePrefixes } from './query'

/** Opciones comunes de mutación: refrescar las rutas afectadas y avisar errores con toast. */
export function useInvalidatingOptions(prefixes: readonly string[]) {
  const queryClient = useQueryClient()
  return {
    // Sin await: si la mutación esperara el refetch, la fila que la disparó podría
    // desaparecer del listado filtrado y React Query omitiría los callbacks de mutate()
    onSettled: () => {
      void invalidatePrefixes(queryClient, prefixes)
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  }
}
