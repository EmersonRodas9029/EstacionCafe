import { dayRange, localDay } from './dates'

describe('dates', () => {
  it('usa el día de El Salvador aunque en UTC ya sea mañana', () => {
    // 2026-03-02 03:00 UTC = 2026-03-01 21:00 en El Salvador
    expect(localDay(new Date('2026-03-02T03:00:00Z'))).toBe('2026-03-01')
  })

  it('arma el rango del día con la zona -06:00', () => {
    expect(dayRange('2026-03-01')).toEqual({
      from: '2026-03-01T00:00:00-06:00',
      to: '2026-03-01T23:59:59.999-06:00',
    })
  })
})
