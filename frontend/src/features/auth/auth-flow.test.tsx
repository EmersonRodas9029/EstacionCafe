import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/render-app'
import { useSessionStore } from './session-store'

const renderAt = (path: string) => renderApp(path)

async function login(username: string, password = 'AdminDemo123!') {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Usuario'), username)
  await user.type(screen.getByLabelText('Contraseña'), password)
  await user.click(screen.getByRole('button', { name: /ingresar/i }))
  return user
}

beforeEach(() => useSessionStore.getState().clear())

describe('Autenticación y navegación por rol', () => {
  it('sin sesión, una ruta protegida manda al login', async () => {
    const router = renderAt('/admin')
    expect(await screen.findByRole('heading', { name: 'Bienvenido' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('valida campos vacíos sin llamar a la API', async () => {
    renderAt('/login')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /ingresar/i }))

    expect(await screen.findByText('Ingresa tu usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('aria-invalid', 'true')
    expect(useSessionStore.getState().user).toBeNull()
  })

  it('credenciales inválidas muestran el error de la API', async () => {
    renderAt('/login')
    await login('mesero.demo', 'incorrecta')

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos')
    expect(useSessionStore.getState().user).toBeNull()
  })

  it('el mesero entra a su panel de mesas', async () => {
    const router = renderAt('/login')
    await login('mesero.demo')

    expect(await screen.findByRole('heading', { name: 'Mesas' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/mesero/mesas')
    expect(useSessionStore.getState().user?.role).toBe('mesero')
  })

  it('el admin vuelve a la ruta que pidió antes del login', async () => {
    const router = renderAt('/admin/productos')
    await login('admin.demo')

    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin/productos')
  })

  it('un mesero no puede abrir el panel admin (403)', async () => {
    renderAt('/login')
    await login('mesero.demo')
    await screen.findByRole('heading', { name: 'Mesas' })

    renderAt('/admin')
    expect(await screen.findByText('Sin acceso')).toBeInTheDocument()
  })

  it('cerrar sesión limpia la sesión y vuelve al login', async () => {
    renderAt('/login')
    const user = await login('mesero.demo')
    await screen.findByRole('heading', { name: 'Mesas' })

    await user.click(screen.getAllByRole('link', { name: /perfil/i })[0]!)
    await user.click(
      await within(await screen.findByRole('main')).findByRole('button', {
        name: /cerrar sesión/i,
      }),
    )

    expect(await screen.findByRole('heading', { name: 'Bienvenido' })).toBeInTheDocument()
    expect(useSessionStore.getState().user).toBeNull()
  })

  it('tras cerrar sesión, el siguiente usuario entra a su propio panel', async () => {
    const router = renderAt('/login')
    const user = await login('mesero.demo')
    await screen.findByRole('heading', { name: 'Mesas' })
    await user.click(screen.getAllByRole('link', { name: /perfil/i })[0]!)
    await user.click(
      await within(await screen.findByRole('main')).findByRole('button', {
        name: /cerrar sesión/i,
      }),
    )
    await screen.findByRole('heading', { name: 'Bienvenido' })

    await login('admin.demo')
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'))
  })

  it('una sesión guardada que la API ya no reconoce se descarta', async () => {
    // Usuario guardado pero sin sesión válida en la API (cookie vencida o revocada)
    useSessionStore.setState({
      user: { userId: 9, username: 'x', email: 'x@x.x', role: 'admin' },
    })
    renderAt('/admin')

    expect(await screen.findByRole('heading', { name: 'Bienvenido' })).toBeInTheDocument()
  })
})
