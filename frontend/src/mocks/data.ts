import type { Product } from '@/features/products/types'

export const products: Product[] = [
  {
    productId: 1,
    name: 'Espresso',
    description: 'Café espresso simple',
    price: 2.5,
    cost: 1,
    productTypeId: 1,
    active: true,
  },
  {
    productId: 2,
    name: 'Cappuccino',
    description: 'Espresso con leche espumada',
    price: 4,
    cost: 1.6,
    productTypeId: 1,
    active: true,
  },
  {
    productId: 3,
    name: 'Frappé de caramelo',
    description: 'Café frío con caramelo',
    price: 4.5,
    cost: 1.8,
    productTypeId: 2,
    active: true,
  },
  {
    productId: 4,
    name: 'Croissant',
    description: 'Croissant de mantequilla',
    price: 2.25,
    cost: 0.9,
    productTypeId: 3,
    active: false,
  },
]
