import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/render-app'

describe('Cajas registradoras', () => {
  it('crea, evita números repetidos y activa cajas', async () => {
    renderApp('/admin/cajas', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /nueva caja/i }))
    let dialog = await screen.findByRole('dialog', { name: 'Nueva caja' })
    await user.type(within(dialog).getByLabelText('Número'), '001')
    await user.click(within(dialog).getByRole('button', { name: 'Crear caja' }))
    expect(await within(dialog).findByText('Ya existe una caja con ese número')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Número'))
    await user.type(within(dialog).getByLabelText('Número'), '003')
    await user.click(within(dialog).getByRole('button', { name: 'Crear caja' }))
    expect(await screen.findByText('Caja 003 creada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Activar caja 002' }))
    await waitFor(() => expect(db.cashRegisters.find((c) => c.number === '002')?.active).toBe(true))

    await user.click(screen.getByRole('button', { name: 'Editar caja 003' }))
    dialog = await screen.findByRole('dialog', { name: 'Caja 003' })
    await user.clear(within(dialog).getByLabelText('Número'))
    await user.type(within(dialog).getByLabelText('Número'), '010')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Caja 010')).toBeInTheDocument()
  })
})
