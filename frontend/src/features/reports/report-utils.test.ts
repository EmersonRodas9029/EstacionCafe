import { grossMargin, salesByDay, share } from './report-utils'

describe('utilidades de reportes', () => {
  it('rellena días sin ventas con 0', () => {
    const data = salesByDay(
      [{ date: '2026-03-02', total: 12.5, bills: 3 }],
      '2026-03-01',
      '2026-03-03',
    )
    expect(data.map((d) => d.value)).toEqual([0, 12.5, 0])
    expect(data[1]).toMatchObject({ key: '2026-03-02', detail: '3 cuentas' })
    expect(data[0]!.label).toMatch(/1/)
  })

  it('calcula margen y participación', () => {
    expect(grossMargin(200, 130)).toBe(65)
    expect(grossMargin(0, 0)).toBe(0)
    expect(share(25, 100)).toBe('25%')
    expect(share(1, 0)).toBe('0%')
  })
})
