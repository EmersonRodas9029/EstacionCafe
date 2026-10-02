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

const timeFormatter = new Intl.DateTimeFormat('es-SV', { timeZone: TIME_ZONE, timeStyle: 'short' })

export const formatTime = (value: string | Date) => timeFormatter.format(new Date(value))

/** "hace 12 min" para cuentas abiertas. */
export const formatElapsed = (value: string | Date, now = Date.now()) => {
  const minutes = Math.max(0, Math.round((now - new Date(value).getTime()) / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours} h ${minutes % 60} min`
}

export const formatDate = (value: string | Date) => dateFormatter.format(new Date(value))

/** Margen bruto en % sobre el precio de venta. */
export const marginPercent = (price: number, cost: number) =>
  price > 0 ? Math.round(((price - cost) / price) * 100) : 0

const quantityFormatter = new Intl.NumberFormat('es-SV', { maximumFractionDigits: 3 })

/** Cantidades de inventario: hasta 3 decimales, sin ceros de relleno. */
export const formatQuantity = (value: number) => quantityFormatter.format(value)

const unitCostFormatter = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

/** Costos por g/ml: hasta 4 decimales ($0.0025). */
export const formatUnitCost = (value: number) => unitCostFormatter.format(value)

/** Teléfono SV: 22223333 → 2222-3333; +50377778888 → +503 7777-8888. */
export const formatPhone = (phone: string) => {
  const match = /^(\+503)?(\d{4})(\d{4})$/.exec(phone.replace(/[\s-]/g, ''))
  if (!match) return phone
  return `${match[1] ? '+503 ' : ''}${match[2]}-${match[3]}`
}
