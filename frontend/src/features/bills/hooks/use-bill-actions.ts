import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCloseTableBills, useCreateBill, useUpdateBill } from '@/api/generated/bills/bills'
import { useUpdateTableStatus } from '@/api/generated/tables/tables'
import { errorMessage } from '@/lib/errors'
import { invalidateOperation } from '../invalidate'

/** Opciones comunes: refrescar operación y avisar errores con toast. */
function useOperationOptions() {
  const queryClient = useQueryClient()
  return {
    onSettled: () => invalidateOperation(queryClient),
    onError: (error: unknown) => toast.error(errorMessage(error)),
  }
}

export const useOpenBill = () => useCreateBill({ mutation: useOperationOptions() })
export const useEditBill = () => useUpdateBill({ mutation: useOperationOptions() })
export const useChargeTable = () => useCloseTableBills({ mutation: useOperationOptions() })
export const useChangeTableStatus = () => useUpdateTableStatus({ mutation: useOperationOptions() })
