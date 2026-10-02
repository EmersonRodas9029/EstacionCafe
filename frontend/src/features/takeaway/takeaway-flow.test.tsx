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
    const router = renderApp('/mesero/para-llevar', 'mesero')
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
    expect(await screen.findByText('Cuenta "Sofía" cobrada')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: /marcar entregada/i }))
    await waitFor(() => expect(db.bills.find((b) => b.billId === 4)?.status).toBe('finished'))
  })

  it('la lista separa etapas y permite entregar desde "Por entregar"', async () => {
    renderApp('/mesero/para-llevar', 'mesero')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /por entregar/i }))
    expect(await screen.findByText('Luis')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^entregar$/i }))

    expect(await screen.findByText('Orden de Luis entregada')).toBeInTheDocument()
    await waitFor(() => expect(db.bills.find((b) => b.billId === 2)?.status).toBe('finished'))
  })

  it('cobrar una cuenta de mesa calcula el cambio y vuelve a la mesa', async () => {
    const router = renderApp('/mesero/cuentas/1', 'mesero')
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
    const user = userEvent.setup()

    expect(await screen.findByText('Marta')).toBeInTheDocument()
    expect(screen.queryByText('Luis')).not.toBeInTheDocument()
    expect(screen.getByText('Cuentas cobradas').nextSibling).toHaveTextContent('1')

    await user.click(screen.getByRole('checkbox', { name: /solo mis cuentas/i }))
    expect(await screen.findByText('Luis')).toBeInTheDocument()
  })
})
