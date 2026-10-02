import {
  useCreateConsumable,
  useDeleteConsumable,
  useUpdateConsumable,
} from '@/api/generated/consumables/consumables'
import {
  useCreateConsumableType,
  useDeleteConsumableType,
  useUpdateConsumableType,
} from '@/api/generated/consumable-types/consumable-types'
import { useInvalidatingOptions } from '@/lib/mutation-options'

// Las recetas muestran stock y costo de cada consumible
const PREFIXES = ['/consumable', '/ingredient']

const useOptions = () => useInvalidatingOptions(PREFIXES)

export const useAddConsumable = () => useCreateConsumable({ mutation: useOptions() })
export const useEditConsumable = () => useUpdateConsumable({ mutation: useOptions() })
export const useDeactivateConsumable = () => useDeleteConsumable({ mutation: useOptions() })
export const useAddConsumableType = () => useCreateConsumableType({ mutation: useOptions() })
export const useRenameConsumableType = () => useUpdateConsumableType({ mutation: useOptions() })
export const useRemoveConsumableType = () => useDeleteConsumableType({ mutation: useOptions() })
