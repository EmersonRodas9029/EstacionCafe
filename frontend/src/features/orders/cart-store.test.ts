import { useCartStore } from './cart-store'

const cart = (billId: number) => useCartStore.getState().carts[billId] ?? {}

beforeEach(() => useCartStore.setState({ carts: {} }))

describe('cart store', () => {
  it('suma al agregar el mismo producto y separa por cuenta', () => {
    const { add } = useCartStore.getState()
    add(1, 10)
    add(1, 10)
    add(2, 10)
    expect(cart(1)).toEqual({ 10: 2 })
    expect(cart(2)).toEqual({ 10: 1 })
  })

  it('cantidad 0 quita la línea y clear vacía solo esa cuenta', () => {
    const { add, setQuantity, clear } = useCartStore.getState()
    add(1, 10)
    add(1, 11)
    setQuantity(1, 10, 0)
    expect(cart(1)).toEqual({ 11: 1 })
    add(2, 5)
    clear(1)
    expect(cart(1)).toEqual({})
    expect(cart(2)).toEqual({ 5: 1 })
  })
})
