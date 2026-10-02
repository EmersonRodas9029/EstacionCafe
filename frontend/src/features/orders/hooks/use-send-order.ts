import { useQueryClient } from '@tanstack/react-query'
import { useCreateBillDetails } from '@/api/generated/bill-details/bill-details'
import { invalidateOperation } from '@/features/bills/invalidate'

export const useSendOrder = () => {
  const queryClient = useQueryClient()
  return useCreateBillDetails({
    mutation: { onSettled: () => invalidateOperation(queryClient) },
  })
}
