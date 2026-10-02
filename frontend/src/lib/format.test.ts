import { formatCurrency, marginPercent } from './format'

describe('format', () => {
  it('formatea USD', () => {
    expect(formatCurrency(15.5)).toBe('$15.50')
  })

  it('calcula margen sobre precio', () => {
    expect(marginPercent(4, 1)).toBe(75)
    expect(marginPercent(0, 1)).toBe(0)
  })
})
