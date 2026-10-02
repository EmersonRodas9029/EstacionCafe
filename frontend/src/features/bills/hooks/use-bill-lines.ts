import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getListBillDetailsByBillQueryKey,
  useDeleteBillDetail,
  useListBillDetailsByBill,
  useUpdateBillDetail,
} from '@/api/generated/bill-details/bill-details'
import type { ListBillDetailsByBill200 } from '@/api/generated/model/listBillDetailsByBill200'
import type { BillDetailLine } from '@/api/generated/model/billDetailLine'
import { errorMessage } from '@/lib/errors'
import { invalidateOperation, LIVE_REFRESH_MS } from '../invalidate'

type Snapshot = { previous?: ListBillDetailsByBill200 }

/**
 * Líneas de una cuenta con cambios optimistas: la UI responde al toque
 * y se revierte si la API rechaza (p. ej. stock insuficiente).
 */
export function useBillLines(billId: number) {
  const queryClient = useQueryClient()
  const key = getListBillDetailsByBillQueryKey(billId)

  const lines = useListBillDetailsByBill(billId, {
    query: { refetchInterval: LIVE_REFRESH_MS, select: (r) => r.data },
  })

  const patchCache = async (
    change: (lines: BillDetailLine[]) => BillDetailLine[],
  ): Promise<Snapshot> => {
    await queryClient.cancelQueries({ queryKey: key })
    const previous = queryClient.getQueryData<ListBillDetailsByBill200>(key)
    if (previous) queryClient.setQueryData(key, { ...previous, data: change(previous.data) })
    return { previous }
  }

  const rollback = (error: unknown, _vars: unknown, snapshot?: Snapshot) => {
    if (snapshot?.previous) queryClient.setQueryData(key, snapshot.previous)
    toast.error(errorMessage(error))
  }

  const updateQuantity = useUpdateBillDetail<unknown, Snapshot>({
    mutation: {
      onMutate: ({ id, data }) =>
        patchCache((current) =>
          current.map((line) =>
            line.billDetailId === id
              ? { ...line, quantity: data.quantity, subTotal: data.quantity * line.price }
              : line,
          ),
        ),
      onError: rollback,
      onSettled: () => invalidateOperation(queryClient),
    },
  })

  const removeLine = useDeleteBillDetail<unknown, Snapshot>({
    mutation: {
      onMutate: ({ id }) =>
        patchCache((current) => current.filter((line) => line.billDetailId !== id)),
      onError: rollback,
      onSettled: () => invalidateOperation(queryClient),
    },
  })

  return { lines, updateQuantity, removeLine }
}
