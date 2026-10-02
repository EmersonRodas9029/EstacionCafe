import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/render-app'

describe('Dispositivos y PIN (admin)', () => {
  it('autoriza este equipo, lo renombra y lo revoca', async () => {
    renderApp('/admin/dispositivos', 'admin')
    const user = userEvent.setup()

    expect(await screen.findByText(/No autorizado/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre del equipo'), 'Tablet terraza')
    await user.click(screen.getByRole('button', { name: /autorizar este equipo/i }))

    expect(await screen.findByText(/Autorizado como/)).toHaveTextContent('Tablet terraza')
    expect(db.thisDevice).toBe(1)

    await user.click(await screen.findByRole('button', { name: 'Revocar Tablet terraza' }))
    await user.click(
      within(await screen.findByRole('dialog', { name: /revocar tablet terraza/i })).getByRole(
        'button',
        { name: 'Revocar' },
      ),
    )
    await waitFor(() => expect(db.devices[0]?.active).toBe(false))
    expect(await screen.findByText('Revocado')).toBeInTheDocument()
  })

  it('genera un PIN, lo muestra una vez y rechaza uno repetido', async () => {
    renderApp('/admin/usuarios', 'admin')
    const user = userEvent.setup()

    // El admin no usa PIN: no tiene el botón
    expect(await screen.findByRole('button', { name: 'PIN de cajero.demo' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'PIN de admin.demo' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'PIN de cajero.demo' }))
    let dialog = await screen.findByRole('dialog', { name: 'PIN de cajero.demo' })
    await user.type(within(dialog).getByLabelText('O escribe uno'), '1234')
    await user.click(within(dialog).getByRole('button', { name: 'Asignar este PIN' }))
    expect(await within(dialog).findByText('Ese PIN ya lo usa otra persona')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: /generar pin/i }))
    const shown = await within(dialog).findByLabelText(/PIN asignado/)
    expect(shown.textContent).toMatch(/^\d{4}$/)
    expect(db.pins[3]).toBe(shown.textContent)
    await user.click(within(dialog).getByRole('button', { name: 'Listo' }))

    await user.click(screen.getByRole('button', { name: 'PIN de mesero.demo' }))
    dialog = await screen.findByRole('dialog', { name: 'PIN de mesero.demo' })
    await user.click(within(dialog).getByRole('button', { name: 'Quitar PIN' }))
    await waitFor(() => expect(db.pins[2]).toBeUndefined())
  })
})
