import { supplierFormSchema } from './schemas'

const valid = { name: 'Café de Altura', phone: '2222-3333', email: 'Ventas@Altura.sv' }

describe('supplierFormSchema', () => {
  it.each(['2222-3333', '22223333', '+503 7777-8888', '+50377778888'])('acepta %s', (phone) => {
    expect(supplierFormSchema.safeParse({ ...valid, phone }).success).toBe(true)
  })

  it.each(['1222-3333', '2222-333', '+1 2222-3333', 'abc'])('rechaza %s', (phone) => {
    expect(supplierFormSchema.safeParse({ ...valid, phone }).success).toBe(false)
  })

  it('normaliza el correo', () => {
    expect(supplierFormSchema.parse(valid).email).toBe('ventas@altura.sv')
  })
})
