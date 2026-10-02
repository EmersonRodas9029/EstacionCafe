import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db, resetDb } from '@/mocks/db'
import { renderApp } from '@/test/render-app'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-03-10T18:00:00Z'))
  resetDb()
})
afterEach(() => vi.useRealTimers())

const stat = (label: string) =>
  within(screen.getByRole('main')).getByText(label, { selector: 'p' }).parentElement!

describe('Dashboard y reportes', () => {
  it('el dashboard resume ventas, operación en vivo y stock bajo', async () => {
    renderApp('/admin', 'admin')

    // Cobradas hoy: Luis $4 + Marta $2.50 (la de Ana sigue abierta)
    expect(await screen.findByText('Ventas de hoy')).toBeInTheDocument()
    expect(stat('Ventas de hoy')).toHaveTextContent('$6.50')
    expect(stat('Ventas de hoy')).toHaveTextContent('2 cuentas')
    // Costo: Cappuccino $1.60 + Espresso $1 → utilidad $3.90 (60%)
    expect(stat('Margen del mes')).toHaveTextContent('60%')
    expect(await screen.findByRole('link', { name: /mesas ocupadas 1 de 3/i })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /cuentas en curso 1 · 0 por cobrar/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Caramelo')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ventas de los últimos 7 días' })).toBeInTheDocument()
  })

  it('el reporte muestra totales, rankings y respeta el periodo', async () => {
    renderApp('/admin/reportes', 'admin')
    const user = userEvent.setup()

    expect(
      await screen.findByRole('heading', { name: 'Productos más vendidos' }),
    ).toBeInTheDocument()
    expect(stat('Ventas')).toHaveTextContent('$6.50')
    expect(stat('Ventas')).toHaveTextContent('2 cuentas')
    expect(stat('Compras')).toHaveTextContent('$40.00')

    const top = screen
      .getByRole('heading', { name: 'Productos más vendidos' })
      .closest('div')!.parentElement!
    expect(within(top).getByText('Cappuccino')).toBeInTheDocument()
    expect(within(top).getByText('Espresso')).toBeInTheDocument()

    // Las anuladas no cuentan
    db.bills.find((b) => b.billId === 3)!.status = 'void'
    await user.click(screen.getByRole('button', { name: 'Ayer' }))
    expect(await screen.findByText('Sin movimientos')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hoy' }))
    expect(
      await screen.findByRole('heading', { name: 'Productos más vendidos' }),
    ).toBeInTheDocument()
    expect(stat('Ventas')).toHaveTextContent('$4.00')
  })

  it('exporta las ventas por día a CSV', async () => {
    const blobs: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return 'blob:csv'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderApp('/admin/reportes', 'admin')
    const user = userEvent.setup()

    await screen.findByRole('heading', { name: 'Ventas por día' })
    await user.click(screen.getAllByRole('button', { name: /csv/i })[0]!)
    const lines = (await blobs[0]!.text()).replace('﻿', '').split('\r\n')
    expect(lines[0]).toBe('Día,Cuentas,Ventas')
    // 7 días (últimos 7 por defecto) + encabezado; hoy con las 2 cobradas
    expect(lines).toHaveLength(8)
    expect(lines.at(-1)).toBe('2026-03-10,2,6.50')
    vi.restoreAllMocks()
  })
})
