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
