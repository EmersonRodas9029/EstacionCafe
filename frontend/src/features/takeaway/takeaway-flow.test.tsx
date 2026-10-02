import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db, resetDb } from '@/mocks/db'
import { useCartStore } from '@/features/orders/cart-store'
import { renderApp } from '@/test/render-app'

beforeEach(() => {
  // Mediodía en El Salvador: los filtros "de hoy" no dependen de la hora real
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-03-10T18:00:00Z'))
  resetDb()
  useCartStore.setState({ carts: {} })
})
afterEach(() => vi.useRealTimers())

describe('Para llevar, cobro, ticket e historial', () => {
  it('ciclo de una orden para llevar: preparar → cobrar → entregar', async () => {
    // El cajero toma la orden y la cobra directo en caja
    const router = renderApp('/mesero/para-llevar', 'cajero')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /nueva orden/i }))
    const dialog = await screen.findByRole('dialog')
    await user.clear(within(dialog).getByLabelText('Nombre de la cuenta'))
    await user.type(within(dialog).getByLabelText('Nombre de la cuenta'), 'Sofía')
    await user.click(within(dialog).getByRole('button', { name: /abrir y tomar orden/i }))

    await user.click(await screen.findByRole('button', { name: /Agregar Cappuccino/ }))
    await user.click(
      within(screen.getByRole('complementary', { name: 'Orden' })).getByRole('button', {
        name: /enviar/i,
      }),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/mesero/cuentas/4'))
    expect(db.bills.find((b) => b.billId === 4)).toMatchObject({
      orderType: 'takeaway',
      tableId: null,
    })

    await user.click(await screen.findByRole('button', { name: /cobrar cuenta/i }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: /cobrar \$4\.00/i }),
    )
    expect(await screen.findByText('Cuenta "Sofía" cobrada con efectivo')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: /marcar entregada/i }))
    await waitFor(() => expect(db.bills.find((b) => b.billId === 4)?.status).toBe('finished'))
  })

  it('la lista separa etapas y permite entregar desde "Por entregar"', async () => {
    // La orden de Luis la abrió otro usuario: el cajero la ve, el mesero no
    renderApp('/mesero/para-llevar', 'cajero')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /por entregar/i }))
    expect(await screen.findByText('Luis')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^entregar$/i }))

    expect(await screen.findByText('Orden de Luis entregada')).toBeInTheDocument()
    await waitFor(() => expect(db.bills.find((b) => b.billId === 2)?.status).toBe('finished'))
  })

  it('cobrar una cuenta de mesa calcula el cambio y vuelve a la mesa', async () => {
    const router = renderApp('/mesero/cuentas/1', 'cajero')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /cobrar cuenta/i }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/efectivo recibido/i), '20')
    expect(within(dialog).getByText('$15.00')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /cobrar \$5\.00/i }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/mesero/mesas/A1'))
    expect(db.bills[0]).toMatchObject({ status: 'closed', cashRegisterId: 1 })
  })

  it('la pre-cuenta muestra líneas y total y se puede imprimir', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    renderApp('/mesero/cuentas/1/ticket', 'mesero')
    const user = userEvent.setup()

    const ticket = await screen.findByRole('article', { name: 'Pre-cuenta' })
    expect(within(ticket).getByText(/2 × Espresso/)).toBeInTheDocument()
    expect(within(ticket).getByText('TOTAL').nextSibling).toHaveTextContent('$5.00')
    await user.click(screen.getByRole('button', { name: /imprimir/i }))
    expect(print).toHaveBeenCalled()
  })

  it('el historial del mesero muestra solo sus cuentas cobradas', async () => {
    renderApp('/mesero/historial', 'mesero')

    expect(await screen.findByText('Marta')).toBeInTheDocument()
    expect(screen.queryByText('Luis')).not.toBeInTheDocument()
    expect(screen.getByText('Cuentas cobradas').nextSibling).toHaveTextContent('1')
    // La API ya limita al mesero: no hay interruptor que mostrar
    expect(screen.queryByRole('checkbox', { name: /solo mis cuentas/i })).not.toBeInTheDocument()
  })

  it('el cajero ve todo el historial y puede filtrar las suyas', async () => {
    renderApp('/mesero/historial', 'cajero')
    const user = userEvent.setup()

    expect(await screen.findByText('Luis')).toBeInTheDocument()
    expect(screen.getByText('Marta')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /solo mis cuentas/i }))
    expect(await screen.findByText('Sin ventas')).toBeInTheDocument()
  })

  it('el cajero cobra desde "Por cobrar" lo que cerró el mesero', async () => {
    db.bills[0]!.status = 'pending_payment'
    renderApp('/mesero/cobros', 'cajero')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /cobrar Ana \$5\.00/i }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('radio', { name: 'Tarjeta' }))
    await user.click(within(dialog).getByRole('button', { name: /cobrar \$5\.00/i }))

    expect(await screen.findByText('Cuenta "Ana" cobrada con tarjeta')).toBeInTheDocument()
    expect(db.bills[0]).toMatchObject({ status: 'closed', paymentMethod: 'card' })
    expect(await screen.findByText('Nada por cobrar')).toBeInTheDocument()
  })

  it('el mesero no ve la cola de cobro', async () => {
    const router = renderApp('/mesero/cobros', 'mesero')
    await waitFor(() => expect(router.state.location.pathname).toBe('/403'))
    expect(screen.queryByRole('link', { name: 'Por cobrar' })).not.toBeInTheDocument()
  })
})
