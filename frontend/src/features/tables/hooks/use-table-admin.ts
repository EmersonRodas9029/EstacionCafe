import { useMutation } from '@tanstack/react-query'
import {
  updateTable,
  useCreateTable,
  useDeleteTable,
  useUpdateTable,
} from '@/api/generated/tables/tables'
import { useInvalidatingOptions } from '@/lib/mutation-options'

// Las cuentas muestran la mesa: se refrescan ambas
const TABLE_PREFIXES = ['/tables', '/bills']

export const useAddTable = () =>
  useCreateTable({ mutation: useInvalidatingOptions(TABLE_PREFIXES) })
export const useEditTable = () =>
  useUpdateTable({ mutation: useInvalidatingOptions(TABLE_PREFIXES) })
export const useRemoveTable = () =>
  useDeleteTable({ mutation: useInvalidatingOptions(TABLE_PREFIXES) })

/** La API no tiene zonas como entidad: renombrar una zona es mover todas sus mesas. */
export function useRenameZone() {
  return useMutation({
    ...useInvalidatingOptions(TABLE_PREFIXES),
    mutationFn: ({ tableIds, zone }: { tableIds: string[]; zone: string }) =>
      Promise.all(tableIds.map((id) => updateTable(id, { zone }))),
  })
}
