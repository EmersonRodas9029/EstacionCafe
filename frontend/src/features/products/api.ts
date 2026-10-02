import { queryOptions } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Product } from './types'

export const productKeys = {
  all: ['products'] as const,
  active: () => [...productKeys.all, 'active'] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
}

export const productsQuery = () =>
  queryOptions({
    queryKey: productKeys.all,
    queryFn: ({ signal }) => api.get<Product[]>('/products', { signal }),
  })

export const activeProductsQuery = () =>
  queryOptions({
    queryKey: productKeys.active(),
    queryFn: ({ signal }) => api.get<Product[]>('/products/active', { signal }),
  })
