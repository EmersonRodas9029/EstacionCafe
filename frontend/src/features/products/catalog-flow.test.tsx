import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/render-app'

const row = (name: string) => screen.getByRole('link', { name }).closest('tr')!

describe('Catálogo del admin', () => {
  it('lista con filtros y activa/desactiva productos', async () => {
    renderApp('/admin/productos', 'admin')
    const user = userEvent.setup()

    expect(await screen.findByRole('link', { name: 'Espresso' })).toBeInTheDocument()
    // Croissant está inactivo: no sale con el filtro por defecto
    expect(screen.queryByRole('link', { name: 'Croissant' })).not.toBeInTheDocument()
    expect(within(row('Cappuccino')).getByText('60%')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Buscar producto' }), 'frappe')
    expect(screen.queryByRole('link', { name: 'Espresso' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Frappé de caramelo' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Desactivar Frappé de caramelo' }))
    expect(await screen.findByText('Frappé de caramelo desactivado')).toBeInTheDocument()
    expect(db.products.find((p) => p.productId === 3)?.active).toBe(false)

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar producto' }))
    await user.click(screen.getByRole('button', { name: /inactivos/i }))
    expect(await screen.findByRole('link', { name: 'Croissant' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Activar Croissant' }))
    await waitFor(() => expect(db.products.find((p) => p.productId === 4)?.active).toBe(true))
  })

  it('crea un producto con receta y usa el costo calculado', async () => {
    const router = renderApp('/admin/productos/nuevo', 'admin')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Nombre'), 'Latte')
    await user.type(screen.getByLabelText('Descripción'), 'Espresso con leche')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Café caliente')
    await user.type(screen.getByLabelText('Precio de venta'), '3.50')

    await user.click(screen.getByRole('button', { name: /agregar ingrediente/i }))
    await user.selectOptions(
      screen.getByLabelText('Consumible del ingrediente 1'),
      'Café en grano (g)',
    )
    await user.type(screen.getByLabelText('Cantidad del ingrediente 1'), '18')
    await user.click(screen.getByRole('button', { name: /agregar ingrediente/i }))
    await user.selectOptions(
      screen.getByLabelText('Consumible del ingrediente 2'),
      'Leche entera (ml)',
    )
    await user.type(screen.getByLabelText('Cantidad del ingrediente 2'), '200')

    // 18 g × $0.02 + 200 ml × $0.002 = $0.76
    expect(screen.getByText('$0.76')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /usar como costo/i }))
    expect(screen.getByLabelText('Costo')).toHaveValue(0.76)
    expect(screen.getByText(/margen/i)).toHaveTextContent('78%')

    await user.click(screen.getByRole('button', { name: 'Crear producto' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/productos'))
    expect(await screen.findByText('Latte creado')).toBeInTheDocument()
    expect(db.products.at(-1)).toMatchObject({ productId: 5, name: 'Latte', cost: 0.76 })
    expect(db.ingredients.filter((i) => i.productId === 5)).toMatchObject([
      { consumableId: 1, quantity: 18, name: 'Latte - Café en grano' },
      { consumableId: 2, quantity: 200, name: 'Latte - Leche entera' },
    ])
  })

  it('al editar solo envía los cambios de la receta', async () => {
    renderApp('/admin/productos/2', 'admin')
    const user = userEvent.setup()

    const quantity = await screen.findByLabelText('Cantidad del ingrediente 2')
    expect(quantity).toHaveValue(150)
    await user.clear(quantity)
    await user.type(quantity, '120')
    await user.click(screen.getByRole('button', { name: 'Quitar ingrediente 1' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Cappuccino actualizado')).toBeInTheDocument()
    expect(db.ingredients.filter((i) => i.productId === 2)).toMatchObject([
      { ingredientId: 3, consumableId: 2, quantity: 120 },
    ])
    // La receta de otros productos no se toca
    expect(db.ingredients.find((i) => i.ingredientId === 1)).toBeDefined()
  })

  it('valida precio contra costo y consumibles repetidos sin llamar a la API', async () => {
    renderApp('/admin/productos/1', 'admin')
    const user = userEvent.setup()

    const price = await screen.findByLabelText('Precio de venta')
    await user.clear(price)
    await user.type(price, '0.50')
    expect(screen.getByText('El precio no cubre el costo.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /agregar ingrediente/i }))
    await user.selectOptions(
      screen.getByLabelText('Consumible del ingrediente 2'),
      'Café en grano (g)',
    )
    await user.type(screen.getByLabelText('Cantidad del ingrediente 2'), '1')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('El precio debe ser mayor al costo')).toBeInTheDocument()
    expect(screen.getByText('Este consumible ya está en la receta')).toBeInTheDocument()
    expect(db.products.find((p) => p.productId === 1)?.price).toBe(2.5)
  })

  it('pide confirmación antes de salir con cambios sin guardar', async () => {
    const router = renderApp('/admin/productos/1', 'admin')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Nombre'), ' doble')
    await user.click(screen.getByRole('link', { name: 'Cancelar' }))

    const dialog = await screen.findByRole('dialog', { name: '¿Descartar cambios?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(router.state.location.pathname).toBe('/admin/productos/1')

    await user.click(screen.getByRole('link', { name: 'Cancelar' }))
    await user.click(
      within(await screen.findByRole('dialog', { name: '¿Descartar cambios?' })).getByRole(
        'button',
        { name: 'Descartar' },
      ),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/productos'))
  })

  it('muestra "no encontrado" para un producto inexistente', async () => {
    renderApp('/admin/productos/999', 'admin')
    expect(await screen.findByText('Producto no encontrado')).toBeInTheDocument()
  })

  it('administra categorías y no elimina las que tienen productos', async () => {
    renderApp('/admin/productos', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /categorías/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Categorías' })

    expect(within(dialog).getByRole('button', { name: 'Eliminar Panadería' })).toBeDisabled()

    await user.type(within(dialog).getByLabelText('Nueva categoría'), 'panadería')
    await user.click(within(dialog).getByRole('button', { name: /agregar/i }))
    expect(within(dialog).getByText('Ya existe una categoría con ese nombre')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Nueva categoría'))
    await user.type(within(dialog).getByLabelText('Nueva categoría'), 'Postres')
    await user.click(within(dialog).getByRole('button', { name: /agregar/i }))
    expect(await within(dialog).findByText('Postres')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Renombrar Postres' }))
    const input = within(dialog).getByLabelText('Nuevo nombre de Postres')
    await user.clear(input)
    await user.type(input, 'Repostería')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar nombre' }))
    expect(await within(dialog).findByText('Repostería')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar Repostería' }))
    await waitFor(() => expect(db.productTypes.map((t) => t.name)).not.toContain('Repostería'))
  })
})
