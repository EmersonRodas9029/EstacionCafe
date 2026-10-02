import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/mocks/db'
import { useCartStore } from '@/features/orders/cart-store'
import { renderApp } from '@/test/render-app'

beforeEach(() => useCartStore.setState({ carts: {} }))

describe('Flujo del mesero', () => {
  it('el mapa muestra mesas con sus cuentas abiertas y filtra por zona', async () => {
    renderApp('/mesero/mesas', 'mesero')
    const user = userEvent.setup()

    const a1 = await screen.findByRole('link', { name: /Mesa A1/ })
    expect(within(a1).getByText(/1 cuenta/)).toBeInTheDocument()
    expect(within(a1).getByText('$5.00')).toBeInTheDocument()
    expect(within(a1).getByText('Ocupada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Terraza' }))
    expect(screen.queryByRole('link', { name: /Mesa A1/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mesa T1/ })).toBeInTheDocument()
  })

  it('abre una cuenta, toma la orden y la envía', async () => {
    const router = renderApp('/mesero/mesas/A2', 'mesero')
    const user = userEvent.setup()

    await user.click((await screen.findAllByRole('button', { name: /nueva cuenta/i }))[0]!)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Nombre de la cuenta')).toHaveValue('Cuenta 1')
    await user.click(within(dialog).getByRole('button', { name: /abrir y tomar orden/i }))

    await screen.findByRole('heading', { name: 'Tomar orden' })
    await user.click(await screen.findByRole('button', { name: /Agregar Espresso/ }))
    await user.click(screen.getByRole('button', { name: /Agregar Espresso/ }))
    await user.click(screen.getByRole('button', { name: /Agregar Cappuccino/ }))

    const order = screen.getByRole('complementary', { name: 'Orden' })
    await user.click(within(order).getByRole('button', { name: /enviar · \$9\.00/i }))

    expect(await screen.findByText('Orden enviada (3 productos)')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/mesero/cuentas/2'))
    expect(await screen.findByText('$9.00', { selector: 'span' })).toBeInTheDocument()
    expect(db.tables.find((t) => t.tableId === 'A2')?.status).toBe('ocupada')
  })

  it('stock insuficiente avisa y conserva la orden', async () => {
    renderApp('/mesero/cuentas/1/orden', 'mesero')
    const user = userEvent.setup()

    const frappe = await screen.findByRole('button', { name: /Agregar Frappé/ })
    for (let i = 0; i < 3; i++) await user.click(frappe)
    const order = screen.getByRole('complementary', { name: 'Orden' })
    await user.click(within(order).getByRole('button', { name: /enviar/i }))

    expect(
      await screen.findByText(/Stock insuficiente para "Frappé de caramelo"/),
    ).toBeInTheDocument()
    expect(useCartStore.getState().carts[1]).toEqual({ 3: 3 })
  })

  it('ajusta cantidades y quita líneas de la cuenta', async () => {
    renderApp('/mesero/cuentas/1', 'mesero')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Agregar uno de Espresso' }))
    expect(await screen.findByText('$7.50', { selector: 'span' })).toBeInTheDocument()
    await waitFor(() => expect(db.details[0]?.quantity).toBe(3))

    await user.click(screen.getByRole('button', { name: 'Quitar Espresso' }))
    expect(await screen.findByText('Cuenta vacía')).toBeInTheDocument()
  })

  it('cobra la mesa con la única caja activa y la libera', async () => {
    renderApp('/mesero/mesas/A1', 'mesero')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /cobrar mesa/i }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Caja')).toHaveValue('1')
    await user.click(within(dialog).getByRole('button', { name: /cobrar \$5\.00/i }))

    expect(await screen.findByText(/Mesa A1 cobrada/)).toBeInTheDocument()
    expect(await screen.findByText('Mesa sin cuentas')).toBeInTheDocument()
    expect(db.bills[0]).toMatchObject({ status: 'closed', cashRegisterId: 1 })
    expect(db.tables.find((t) => t.tableId === 'A1')?.status).toBe('disponible')
  })

  it('una cuenta cerrada no acepta productos', async () => {
    db.bills[0]!.status = 'closed'
    renderApp('/mesero/cuentas/1/orden', 'mesero')

    expect(await screen.findByText(/ya está cerrada/)).toBeInTheDocument()
  })
})
