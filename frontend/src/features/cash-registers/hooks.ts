import {
  useCreateCashRegister,
  useUpdateCashRegister,
} from '@/api/generated/cash-registers/cash-registers'
import { useInvalidatingOptions } from '@/lib/mutation-options'

const PREFIXES = ['/cash-registers']

export const useAddCashRegister = () =>
  useCreateCashRegister({ mutation: useInvalidatingOptions(PREFIXES) })
export const useEditCashRegister = () =>
  useUpdateCashRegister({ mutation: useInvalidatingOptions(PREFIXES) })
