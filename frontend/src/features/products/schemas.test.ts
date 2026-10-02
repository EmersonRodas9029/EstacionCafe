import { productFormSchema } from './schemas'

const valid = {
  name: 'Latte',
  description: 'Café con leche',
  price: '3.50',
  cost: '1.20',
  productTypeId: '1',
  recipe: [{ consumableId: '2', quantity: '150' }],
}

describe('productFormSchema', () => {
  it('acepta y convierte valores válidos', () => {
    expect(productFormSchema.parse(valid)).toMatchObject({
      price: 3.5,
      cost: 1.2,
      productTypeId: 1,
      recipe: [{ consumableId: 2, quantity: 150 }],
    })
  })

  it('rechaza precio menor o igual al costo', () => {
    const result = productFormSchema.safeParse({ ...valid, price: '1.00' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['price'])
  })

  it('rechaza consumibles repetidos y más de 2 decimales en la receta', () => {
    const result = productFormSchema.safeParse({
      ...valid,
      recipe: [
        { consumableId: '2', quantity: '150' },
        { consumableId: '2', quantity: '0.005' },
      ],
    })
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      'Máximo 2 decimales',
      'Este consumible ya está en la receta',
    ])
  })

  it('campos vacíos dan mensajes claros', () => {
    const result = productFormSchema.safeParse({ ...valid, price: '', productTypeId: '' })
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      'Escribe el precio',
      'Selecciona una categoría',
    ])
  })
})
