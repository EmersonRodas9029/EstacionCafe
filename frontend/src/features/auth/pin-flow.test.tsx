import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/render-app'
import { useSessionStore } from './session-store'

const authorizeThisDevice = () => {
  db.devices.push({
    deviceId: 1,
    name: 'Tablet barra',
    active: true,
    createdBy: 1,
    createdAt: new Date().toISOString(),
    lastSeenAt: null,
  })
  db.thisDevice = 1
}

const typePin = async (user: ReturnType<typeof userEvent.setup>, pin: string) => {
  const pad = await screen.findByRole('group', { name: 'Teclado de PIN' })
  for (const digit of pin) await user.click(within(pad).getByRole('button', { name: digit }))
}

describe('Acceso con PIN', () => {
  it('en un equipo no autorizado se entra con usuario y contraseña', async () => {
    renderApp('/login')
    expect(await screen.findByLabelText('Usuario')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Teclado de PIN' })).not.toBeInTheDocument()
  })

  it('en un equipo autorizado el mesero entra con su PIN al 4.º dígito', async () => {
    authorizeThisDevice()
    const router = renderApp('/login')
    const user = userEvent.setup()

    expect(await screen.findByRole('heading', { name: 'Ingresa tu PIN' })).toBeInTheDocument()
    expect(screen.getByText('Equipo: Tablet barra')).toBeInTheDocument()
    await typePin(user, '1234')

    await waitFor(() => expect(router.state.location.pathname).toBe('/mesero/mesas'))
    expect(useSessionStore.getState().user?.username).toBe('mesero.demo')
  })

  it('un PIN incorrecto avisa, limpia y deja volver a intentar sin bloquear', async () => {
    authorizeThisDevice()
    const router = renderApp('/login')
    const user = userEvent.setup()

    await typePin(user, '9999')
    expect(await screen.findByText('PIN incorrecto')).toBeInTheDocument()
    await typePin(user, '0000')
    expect(await screen.findByText('PIN incorrecto')).toBeInTheDocument()
    await typePin(user, '5678')
    await waitFor(() => expect(router.state.location.pathname).toBe('/mesero/mesas'))
    expect(useSessionStore.getState().user?.username).toBe('cajero.demo')
  })

  it('el admin puede cambiar a usuario y contraseña en un equipo autorizado', async () => {
    authorizeThisDevice()
    renderApp('/login')
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole('button', { name: /entrar con usuario y contraseña/i }),
    )
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /entrar con pin/i }))
    expect(screen.getByRole('group', { name: 'Teclado de PIN' })).toBeInTheDocument()
  })
})

describe('Cierre por inactividad', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] }))
  afterEach(() => vi.useRealTimers())

  const idle = (ms: number) => act(() => vi.advanceTimersByTime(ms))

  it('avisa en los últimos 5 s y un toque cancela el cierre', async () => {
    renderApp('/mesero/mesas', 'mesero')
    await screen.findByRole('heading', { name: 'Mesas' })

    idle(10_500)
    expect(await screen.findByRole('alertdialog', { name: /se cerrará/i })).toHaveTextContent('5 s')

    fireEvent.pointerDown(document.body)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    idle(10_000)
    expect(useSessionStore.getState().user).not.toBeNull()
  })

  it('a los 15 s cierra la sesión y el mismo mesero retoma donde estaba', async () => {
    const router = renderApp('/mesero/cuentas/1/orden', 'mesero')
    await screen.findByRole('heading', { name: 'Tomar orden' })

    idle(15_500)
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(useSessionStore.getState().user).toBeNull()
    expect(db.sessionUserId).toBeNull()
    expect(await screen.findByText('Sesión cerrada por inactividad')).toBeInTheDocument()

    vi.useRealTimers()
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Usuario'), 'mesero.demo')
    await user.type(screen.getByLabelText('Contraseña'), 'AdminDemo123!')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/mesero/cuentas/1/orden'))
  })

  it('otro usuario que entra después no hereda la página del anterior', async () => {
    const router = renderApp('/mesero/cuentas/1/orden', 'mesero')
    await screen.findByRole('heading', { name: 'Tomar orden' })
    idle(15_500)
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))

    vi.useRealTimers()
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Usuario'), 'cajero.demo')
    await user.type(screen.getByLabelText('Contraseña'), 'AdminDemo123!')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/mesero/mesas'))
  })

  it('el panel admin espera 15 minutos', async () => {
    renderApp('/admin/productos', 'admin')
    await screen.findByRole('heading', { name: 'Productos' })
    idle(60_000)
    expect(useSessionStore.getState().user).not.toBeNull()
    idle(14 * 60_000)
    await waitFor(() => expect(useSessionStore.getState().user).toBeNull())
  })
})
