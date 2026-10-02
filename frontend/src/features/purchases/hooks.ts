import { useCreatePurchase, useDeletePurchase } from '@/api/generated/purchases/purchases'
import { useInvalidatingOptions } from '@/lib/mutation-options'

// Una compra con detalle mueve stock y costo de los consumibles (y por ende las recetas)
const PREFIXES = ['/purchases', '/consumable', '/ingredient', '/reports']

export const useAddPurchase = () =>
  useCreatePurchase({ mutation: useInvalidatingOptions(PREFIXES) })
export const useRemovePurchase = () =>
  useDeletePurchase({ mutation: useInvalidatingOptions(PREFIXES) })
