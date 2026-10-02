import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/render-app'
import { THEME_KEY, useThemeStore } from './theme-store'

afterEach(() => {
  useThemeStore.setState({ theme: 'system' })
  document.documentElement.classList.remove('dark')
})

describe('Modo oscuro', () => {
  it('se elige en Perfil, se guarda en el dispositivo y aplica la clase', async () => {
    renderApp('/mesero/perfil', 'mesero')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('radio', { name: /oscuro/i }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')

    await user.click(screen.getByRole('radio', { name: /claro/i }))
    expect(document.documentElement).not.toHaveClass('dark')

    await user.click(screen.getByRole('radio', { name: /sistema/i }))
    expect(localStorage.getItem(THEME_KEY)).toBeNull()
    expect(screen.getByRole('radio', { name: /sistema/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('el botón rápido de la barra alterna claro y oscuro', async () => {
    renderApp('/admin/productos', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Cambiar a modo oscuro' }))
    expect(document.documentElement).toHaveClass('dark')
    await user.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }))
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
