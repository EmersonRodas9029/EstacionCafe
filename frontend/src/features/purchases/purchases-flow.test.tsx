import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db, resetDb } from '@/mocks/db'
import { renderApp } from '@/test/render-app'

describe('Compras', () => {
  it('registra una compra con inventario: suma stock y actualiza el costo', async () => {
    const router = renderApp('/admin/compras/nueva?proveedor=1', 'admin')
    const user = userEvent.setup()

    expect(await screen.findByLabelText('Proveedor')).toHaveValue('1')
    await user.selectOptions(screen.getByLabelText('Consumible de la línea 1'), 'Café en grano (g)')
    // Propone el costo actual del consumible
    expect(screen.getByLabelText('Costo unitario de la línea 1')).toHaveValue(0.02)
    await user.type(screen.getByLabelText('Cantidad de la línea 1'), '1000')
    await user.clear(screen.getByLabelText('Costo unitario de la línea 1'))
    await user.type(screen.getByLabelText('Costo unitario de la línea 1'), '0.025')

    await user.click(screen.getByRole('button', { name: /agregar línea/i }))
    await user.selectOptions(screen.getByLabelText('Consumible de la línea 2'), 'Leche entera (ml)')
    await user.type(screen.getByLabelText('Cantidad de la línea 2'), '5000')

    // 1000 × 0.025 + 5000 × 0.002 = 35
    expect(screen.getByText('$35.00')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Registrar compra' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/compras/2'))
    expect(await screen.findByText('Compra registrada')).toBeInTheDocument()
    expect(db.consumables.find((c) => c.consumableId === 1)).toMatchObject({
      quantity: 6000,
      cost: 0.025,
    })
    expect(await screen.findByText('$0.025')).toBeInTheDocument()
  })

  it('registra un gasto sin inventario y valida líneas repetidas', async () => {
    const router = renderApp('/admin/compras/nueva', 'admin')
    const user = userEvent.setup()

    await user.selectOptions(await screen.findByLabelText('Proveedor'), 'Dulces del Valle')
    await user.selectOptions(screen.getByLabelText('Consumible de la línea 1'), 'Caramelo (ml)')
    await user.type(screen.getByLabelText('Cantidad de la línea 1'), '1')
    await user.click(screen.getByRole('button', { name: /agregar línea/i }))
    await user.selectOptions(screen.getByLabelText('Consumible de la línea 2'), 'Caramelo (ml)')
    await user.type(screen.getByLabelText('Cantidad de la línea 2'), '1')
    await user.click(screen.getByRole('button', { name: 'Registrar compra' }))
    expect(await screen.findByText(/Repetido/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Gasto sin inventario' }))
    await user.type(screen.getByLabelText('Total del gasto'), '18.50')
    await user.click(screen.getByRole('button', { name: 'Registrar compra' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/compras/2'))
    expect(db.purchases.at(-1)).toMatchObject({ total: 18.5, details: [] })
    // Texto exclusivo del detalle: el botón del formulario también dice "Gasto sin inventario"
    expect(await screen.findByText('Esta compra no movió stock.')).toBeInTheDocument()
  })

  it('eliminar una compra revierte el stock; si ya se consumió, lo impide', async () => {
    renderApp('/admin/compras/1', 'admin')
    const user = userEvent.setup()

    db.consumables.find((c) => c.consumableId === 1)!.quantity = 500
    await user.click(await screen.findByRole('button', { name: /eliminar/i }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Eliminar compra' }),
    )
    expect(await screen.findByText(/ya se consumió/)).toBeInTheDocument()
    expect(db.purchases).toHaveLength(1)

    db.consumables.find((c) => c.consumableId === 1)!.quantity = 5000
    await user.click(screen.getByRole('button', { name: /eliminar/i }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Eliminar compra' }),
    )
    expect(await screen.findByText('Compra #1 eliminada')).toBeInTheDocument()
    expect(db.consumables.find((c) => c.consumableId === 1)?.quantity).toBe(3000)
  })

  it('la lista filtra por periodo y proveedor', async () => {
    // Mitad de mes: la compra sembrada (hace 2 días) cae en "Este mes"
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-03-15T18:00:00Z'))
    resetDb()
    renderApp('/admin/compras', 'admin')
    const user = userEvent.setup()

    expect(await screen.findByRole('link', { name: 'Café de Altura' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Proveedor'), 'Dulces del Valle')
    expect(await screen.findByText('Sin compras')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Proveedor'), 'Todos')
    await user.click(screen.getByRole('button', { name: 'Hoy' }))
    expect(await screen.findByText('Sin compras')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
