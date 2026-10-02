const TIME_ZONE = 'America/El_Salvador'
// El Salvador no usa horario de verano: UTC-6 todo el año
const OFFSET = '-06:00'

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** YYYY-MM-DD del día local (El Salvador). */
export const localDay = (date: Date = new Date()) => dayFormatter.format(date)

/** Rango ISO [00:00, 23:59:59.999] del día local indicado. */
export const dayRange = (day: string) => ({
  from: `${day}T00:00:00${OFFSET}`,
  to: `${day}T23:59:59.999${OFFSET}`,
})

/** Suma días a un YYYY-MM-DD (aritmética en UTC: sin saltos de horario). */
export const shiftDay = (day: string, delta: number) => {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

export const monthStart = (day: string) => `${day.slice(0, 7)}-01`

/** Rango ISO desde el inicio de `from` hasta el final de `to` (días locales). */
export const daysRange = (from: string, to: string) => ({
  from: dayRange(from).from,
  to: dayRange(to).to,
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Valor para <input type="datetime-local"> en hora de El Salvador. */
export const localDateTimeInput = (date: Date = new Date()) =>
  `${localDay(date)}T${timeFormatter.format(date)}`

/** De "YYYY-MM-DDTHH:mm" (hora SV) a ISO con zona. */
export const fromLocalDateTime = (value: string) => `${value}:00${OFFSET}`
