import {
  useCreateSupplier,
  useDeleteSupplier,
  useUpdateSupplier,
} from '@/api/generated/suppliers/suppliers'
import { useInvalidatingOptions } from '@/lib/mutation-options'

// Consumibles y compras muestran el nombre del proveedor
const PREFIXES = ['/suppliers', '/consumable', '/purchases']

const useOptions = () => useInvalidatingOptions(PREFIXES)

export const useAddSupplier = () => useCreateSupplier({ mutation: useOptions() })
export const useEditSupplier = () => useUpdateSupplier({ mutation: useOptions() })
export const useDeactivateSupplier = () => useDeleteSupplier({ mutation: useOptions() })
