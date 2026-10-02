const TIME_ZONE = 'America/El_Salvador'

const currencyFormatter = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' })

const dateTimeFormatter = new Intl.DateTimeFormat('es-SV', {
  timeZone: TIME_ZONE,
  dateStyle: 'short',
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('es-SV', { timeZone: TIME_ZONE, dateStyle: 'medium' })

export const formatCurrency = (value: number) => currencyFormatter.format(value)

export const formatDateTime = (value: string | Date) => dateTimeFormatter.format(new Date(value))

export const formatDate = (value: string | Date) => dateFormatter.format(new Date(value))

/** Margen bruto en % sobre el precio de venta. */
export const marginPercent = (price: number, cost: number) =>
  price > 0 ? Math.round(((price - cost) / price) * 100) : 0
