import type { CurrentUser } from '@/api/generated/model/currentUser'
import type { Product } from '@/api/generated/model/product'

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

export const DEMO_PASSWORD = 'AdminDemo123!'

const userType = (userTypeId: number, name: string, role: CurrentUser['role']) => ({
  userTypeId,
  name,
  permissionLevel: role === 'admin' ? 10 : 3,
  role,
})

export const users: CurrentUser[] = [
  {
    userId: 1,
    username: 'admin.demo',
    email: 'admin.demo@estacioncafe.test',
    userTypeId: 1,
    active: true,
    userType: userType(1, 'Administrador', 'admin'),
    role: 'admin',
  },
  {
    userId: 2,
    username: 'mesero.demo',
    email: 'mesero.demo@estacioncafe.test',
    userTypeId: 2,
    active: true,
    userType: userType(2, 'Mesero', 'mesero'),
    role: 'mesero',
  },
]
