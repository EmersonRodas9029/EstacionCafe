import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Quantities = Record<number, number> // productId -> cantidad

type CartState = {
  /** Un carrito por cuenta; sobrevive a recargas para no perder la orden. */
  carts: Record<number, Quantities>
  add: (billId: number, productId: number) => void
  setQuantity: (billId: number, productId: number, quantity: number) => void
  clear: (billId: number) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      add: (billId, productId) =>
        set(({ carts }) => {
          const cart = carts[billId] ?? {}
          return {
            carts: { ...carts, [billId]: { ...cart, [productId]: (cart[productId] ?? 0) + 1 } },
          }
        }),
      setQuantity: (billId, productId, quantity) =>
        set(({ carts }) => {
          const { [productId]: _removed, ...rest } = carts[billId] ?? {}
          return {
            carts: { ...carts, [billId]: quantity > 0 ? { ...rest, [productId]: quantity } : rest },
          }
        }),
      clear: (billId) =>
        set(({ carts }) => {
          const { [billId]: _removed, ...rest } = carts
          return { carts: rest }
        }),
    }),
    { name: 'estacioncafe-carts', version: 1 },
  ),
)

const EMPTY: Quantities = {}
export const useCart = (billId: number) => useCartStore((s) => s.carts[billId] ?? EMPTY)
