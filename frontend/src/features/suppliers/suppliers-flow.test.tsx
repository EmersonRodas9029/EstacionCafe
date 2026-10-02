import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/render-app'

describe('Proveedores', () => {
  it('crea con validación de teléfono SV y busca por teléfono', async () => {
    renderApp('/admin/proveedores', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /nuevo proveedor/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo proveedor' })
    await user.type(within(dialog).getByLabelText('Nombre'), 'Empaques SV')
    await user.type(within(dialog).getByLabelText('Teléfono'), '1234-5678')
    await user.type(within(dialog).getByLabelText('Correo'), 'hola@empaques.sv')
    await user.click(within(dialog).getByRole('button', { name: 'Crear proveedor' }))
    expect(within(dialog).getByText(/Formato: 2222-3333/)).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Teléfono'))
    await user.type(within(dialog).getByLabelText('Teléfono'), '+503 7123-4567')
    await user.click(within(dialog).getByRole('button', { name: 'Crear proveedor' }))
    expect(await screen.findByText('Empaques SV creado')).toBeInTheDocument()
    expect(db.suppliers.at(-1)).toMatchObject({ phone: '+50371234567' })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar proveedor' }), '7123')
    expect(await screen.findByRole('link', { name: 'Empaques SV' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Café de Altura' })).not.toBeInTheDocument()
  })

  it('detalle con consumibles, historial y reactivación', async () => {
    renderApp('/admin/proveedores/1', 'admin')
    const user = userEvent.setup()

    expect(await screen.findByRole('heading', { name: 'Café de Altura' })).toBeInTheDocument()
    expect(screen.getByText('2222-3333')).toBeInTheDocument()
    expect(await screen.findByText('Compra #1')).toBeInTheDocument()
    expect(screen.getByText('Total comprado').parentElement).toHaveTextContent('$40.00')
    expect(screen.getByRole('link', { name: /registrar compra/i })).toHaveAttribute(
      'href',
      '/admin/compras/nueva?proveedor=1',
    )

    await user.click(screen.getByRole('button', { name: 'Desactivar Café de Altura' }))
    await waitFor(() => expect(db.suppliers[0]!.active).toBe(false))
    await user.click(await screen.findByRole('button', { name: 'Activar Café de Altura' }))
    await waitFor(() => expect(db.suppliers[0]!.active).toBe(true))
  })
})
