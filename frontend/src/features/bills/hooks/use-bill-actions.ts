import {
  useCloseTableBills,
  useCreateBill,
  useUpdateBill,
  useVoidBill,
} from '@/api/generated/bills/bills'
import { useUpdateTableStatus } from '@/api/generated/tables/tables'
import { useInvalidatingOptions } from '@/lib/mutation-options'
import { OPERATION_PREFIXES } from '../invalidate'

/** Opciones comunes: refrescar operación y avisar errores con toast. */
const useOperationOptions = () => useInvalidatingOptions(OPERATION_PREFIXES)

export const useOpenBill = () => useCreateBill({ mutation: useOperationOptions() })
export const useEditBill = () => useUpdateBill({ mutation: useOperationOptions() })
export const useChargeTable = () => useCloseTableBills({ mutation: useOperationOptions() })
export const useChangeTableStatus = () => useUpdateTableStatus({ mutation: useOperationOptions() })
export const useCancelBill = () => useVoidBill({ mutation: useOperationOptions() })
