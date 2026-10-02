import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db, resetDb } from '@/mocks/db'
import { renderApp } from '@/test/render-app'

beforeEach(() => {
  // Mediodía en El Salvador: "hoy" no depende de la hora real
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-03-10T18:00:00Z'))
  resetDb()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('Facturas del admin', () => {
  it('lista las del día con resumen y filtra por estado y cliente', async () => {
    renderApp('/admin/facturas', 'admin')
    const user = userEvent.setup()

    expect(await screen.findByRole('link', { name: 'Ana' })).toBeInTheDocument()
    expect(rows()).toHaveLength(3)
    // Vendido = cuentas cobradas (Luis $4 + Marta $2.50)
    expect(screen.getByText('Vendido').parentElement).toHaveTextContent('$6.50')

    await user.selectOptions(screen.getByLabelText('Estado'), 'Cobrada')
    await waitFor(() => expect(rows()).toHaveLength(2))

    await user.type(screen.getByLabelText('Cliente o número'), 'mar')
    expect(rows()).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Marta' })).toBeInTheDocument()
  })

  it('"Ayer" no trae las facturas de hoy', async () => {
    renderApp('/admin/facturas', 'admin')
    const user = userEvent.setup()

    await screen.findByRole('link', { name: 'Ana' })
    await user.click(screen.getByRole('button', { name: 'Ayer' }))
    expect(await screen.findByText('Sin facturas')).toBeInTheDocument()
    expect(screen.getByLabelText('Desde')).toHaveValue('2026-03-09')
  })

  it('exporta a CSV lo filtrado', async () => {
    const blobs: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return 'blob:csv'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderApp('/admin/facturas', 'admin')
    const user = userEvent.setup()

    await screen.findByRole('link', { name: 'Ana' })
    await user.click(screen.getByRole('button', { name: /exportar csv/i }))

    const text = await blobs[0]!.text()
    const lines = text.replace('﻿', '').split('\r\n')
    expect(lines[0]).toBe('Factura,Fecha,Cliente,Tipo,Mesa,Mesero,Caja,Estado,Pago,Total')
    expect(lines).toHaveLength(4)
    expect(text).toContain('Luis,Para llevar,,admin.demo,001,Cobrada,Efectivo,4.00')
  })

  it('anula una factura cobrada desde el detalle', async () => {
    renderApp('/admin/facturas/3', 'admin')
    const user = userEvent.setup()

    expect(await screen.findByText('Espresso')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /anular/i }))
    const dialog = await screen.findByRole('dialog', { name: '¿Anular la factura #3?' })
    expect(dialog).toHaveTextContent('El inventario no se devuelve')
    await user.click(within(dialog).getByRole('button', { name: 'Anular factura' }))

    expect(await screen.findByText('Factura #3 anulada')).toBeInTheDocument()
    expect(db.bills.find((b) => b.billId === 3)?.status).toBe('void')
    expect(await screen.findByText(/no cuenta en ventas/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /anular/i })).not.toBeInTheDocument()
  })

  it('una cuenta abierta se puede abrir en operación', async () => {
    renderApp('/admin/facturas/1', 'admin')
    expect(await screen.findByRole('link', { name: /abrir en operación/i })).toHaveAttribute(
      'href',
      '/mesero/cuentas/1',
    )
    expect(screen.getByRole('link', { name: /pre-cuenta/i })).toBeInTheDocument()
  })
})
