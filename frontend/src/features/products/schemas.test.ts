import { productFormSchema } from './schemas'

const valid = {
  name: 'Latte',
  description: 'Café con leche',
  price: '3.50',
  cost: '1.20',
  productTypeId: '1',
}

describe('productFormSchema', () => {
  it('acepta y convierte valores válidos', () => {
    expect(productFormSchema.parse(valid)).toMatchObject({
      price: 3.5,
      cost: 1.2,
      productTypeId: 1,
    })
  })

  it('rechaza precio menor o igual al costo', () => {
    const result = productFormSchema.safeParse({ ...valid, price: '1.00' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['price'])
  })
})
