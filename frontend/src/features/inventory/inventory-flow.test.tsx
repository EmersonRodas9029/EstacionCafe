import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/render-app'

const stockOf = (id: number) => db.consumables.find((c) => c.consumableId === id)!.quantity

describe('Inventario', () => {
  it('avisa stock bajo y filtra por él', async () => {
    renderApp('/admin/inventario', 'admin')
    const user = userEvent.setup()

    const alert = await screen.findByRole('button', { name: /1 consumible.*caramelo/i })
    expect(screen.getByText('Bajo')).toBeInTheDocument()
    await user.click(alert)
    expect(screen.getByRole('button', { name: /stock bajo/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.queryByText('Café en grano')).not.toBeInTheDocument()
    expect(screen.getByText('Caramelo')).toBeInTheDocument()
  })

  it('ajusta stock: resta merma sin pasar de cero y fija un conteo', async () => {
    renderApp('/admin/inventario', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Ajustar stock de Leche entera' }))
    let dialog = await screen.findByRole('dialog', { name: 'Ajustar Leche entera' })
    await user.type(within(dialog).getByLabelText('Cantidad (ml)'), '20000')
    expect(within(dialog).getByText('—')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Guardar ajuste' }))
    expect(within(dialog).getByText('No puedes restar más de lo que hay')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Cantidad (ml)'))
    await user.type(within(dialog).getByLabelText('Cantidad (ml)'), '250')
    expect(within(dialog).getByText('9,750 ml')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Guardar ajuste' }))
    await waitFor(() => expect(stockOf(2)).toBe(9750))

    await user.click(await screen.findByRole('button', { name: 'Ajustar stock de Caramelo' }))
    dialog = await screen.findByRole('dialog', { name: 'Ajustar Caramelo' })
    await user.click(within(dialog).getByRole('button', { name: 'Conteo físico' }))
    await user.type(within(dialog).getByLabelText('Cantidad contada (ml)'), '1500')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar ajuste' }))
    await waitFor(() => expect(stockOf(3)).toBe(1500))
  })

  it('crea un consumible con costo por ml y lo desactiva', async () => {
    renderApp('/admin/inventario', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /nuevo consumible/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo consumible' })
    await user.type(within(dialog).getByLabelText('Nombre'), 'Jarabe de vainilla')
    await user.selectOptions(within(dialog).getByLabelText('Tipo'), 'Jarabes')
    await user.selectOptions(within(dialog).getByLabelText('Unidad'), 'ml')
    await user.selectOptions(within(dialog).getByLabelText('Proveedor'), 'Dulces del Valle')
    // Lácteos Antiguos está inactivo: no se ofrece
    expect(within(dialog).queryByRole('option', { name: /Lácteos Antiguos/ })).toBeNull()
    await user.type(within(dialog).getByLabelText('Costo por unidad'), '0.0125')
    await user.clear(within(dialog).getByLabelText('Stock mínimo'))
    await user.type(within(dialog).getByLabelText('Stock mínimo'), '500')
    await user.clear(within(dialog).getByLabelText('Stock inicial'))
    await user.type(within(dialog).getByLabelText('Stock inicial'), '2000')
    await user.click(within(dialog).getByRole('button', { name: 'Crear consumible' }))

    expect(await screen.findByText('Jarabe de vainilla creado')).toBeInTheDocument()
    expect(db.consumables.at(-1)).toMatchObject({
      name: 'Jarabe de vainilla',
      cost: 0.0125,
      minStock: 500,
      quantity: 2000,
      supplierId: 2,
    })
    expect(await screen.findByText('$0.0125/ml')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Desactivar Jarabe de vainilla' }))
    await waitFor(() => expect(db.consumables.at(-1)?.active).toBe(false))
  })

  it('no elimina tipos con consumibles', async () => {
    renderApp('/admin/inventario', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /tipos/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Tipos de consumible' })
    expect(within(dialog).getByRole('button', { name: 'Eliminar Café' })).toBeDisabled()
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar Empaques' }))
    await waitFor(() => expect(db.consumableTypes.map((t) => t.name)).not.toContain('Empaques'))
  })
})
