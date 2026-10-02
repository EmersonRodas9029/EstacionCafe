import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/render-app'

describe('Mesas y zonas (admin)', () => {
  it('crea una mesa en mayúsculas y señala IDs repetidos', async () => {
    renderApp('/admin/mesas', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Agregar mesa en Terraza' }))
    let dialog = await screen.findByRole('dialog', { name: 'Nueva mesa' })
    expect(within(dialog).getByLabelText('Zona')).toHaveValue('Terraza')
    await user.type(within(dialog).getByLabelText('Identificador'), 't2')
    await user.click(within(dialog).getByRole('button', { name: 'Crear mesa' }))

    expect(await screen.findByText('Mesa T2 creada')).toBeInTheDocument()
    expect(db.tables.find((t) => t.tableId === 'T2')).toMatchObject({ zone: 'Terraza' })

    await user.click(screen.getByRole('button', { name: /nueva mesa/i }))
    dialog = await screen.findByRole('dialog', { name: 'Nueva mesa' })
    await user.type(within(dialog).getByLabelText('Identificador'), 'A1')
    await user.type(within(dialog).getByLabelText('Zona'), 'Interior')
    await user.click(within(dialog).getByRole('button', { name: 'Crear mesa' }))
    expect(await within(dialog).findByText('Ya existe una mesa con ese ID')).toBeInTheDocument()
  })

  it('no elimina mesas ocupadas ni con historial, y renombra zonas', async () => {
    renderApp('/admin/mesas', 'admin')
    const user = userEvent.setup()

    expect(await screen.findByRole('button', { name: 'Eliminar mesa A1' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Eliminar mesa A2' }))
    await user.click(
      within(await screen.findByRole('dialog', { name: /eliminar la mesa A2/i })).getByRole(
        'button',
        { name: 'Eliminar' },
      ),
    )
    expect(await screen.findByText(/A2 tiene 1 factura asociada/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Renombrar zona Interior' }))
    const dialog = await screen.findByRole('dialog', { name: /renombrar zona interior/i })
    await user.clear(within(dialog).getByLabelText('Nuevo nombre'))
    await user.type(within(dialog).getByLabelText('Nuevo nombre'), 'Salón')
    await user.click(within(dialog).getByRole('button', { name: 'Renombrar' }))

    await waitFor(() =>
      expect(db.tables.filter((t) => t.zone === 'Salón').map((t) => t.tableId)).toEqual([
        'A1',
        'A2',
      ]),
    )
    expect(await screen.findByRole('heading', { name: 'Salón' })).toBeInTheDocument()
  })
})
