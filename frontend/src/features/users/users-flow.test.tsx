import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/render-app'

describe('Usuarios y roles', () => {
  it('crea un usuario y no permite nombres repetidos', async () => {
    renderApp('/admin/usuarios', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /nuevo usuario/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo usuario' })
    await user.type(within(dialog).getByLabelText('Usuario'), 'mesero.demo')
    await user.type(within(dialog).getByLabelText('Correo'), 'nuevo@cafe.sv')
    await user.selectOptions(within(dialog).getByLabelText('Rol'), 'Mesero · Mesero')
    await user.type(within(dialog).getByLabelText('Contraseña'), 'secreto1')
    await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }))
    expect(await within(dialog).findByText('Ese usuario ya existe')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Usuario'))
    await user.type(within(dialog).getByLabelText('Usuario'), 'sofia')
    await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }))
    expect(await screen.findByText('sofia creado')).toBeInTheDocument()
    expect(db.users.at(-1)).toMatchObject({ username: 'sofia', role: 'mesero', active: true })
  })

  it('desactiva y reactiva a otros, pero no a sí mismo', async () => {
    renderApp('/admin/usuarios', 'admin')
    const user = userEvent.setup()

    expect(await screen.findByText('Tu usuario')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar admin.demo' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Desactivar cajero.demo' }))
    expect(await screen.findByText('cajero.demo desactivado')).toBeInTheDocument()
    expect(db.users.find((u) => u.username === 'cajero.demo')?.active).toBe(false)

    await user.click(screen.getByRole('button', { name: /inactivos/i }))
    await user.click(await screen.findByRole('button', { name: 'Activar mesero.baja' }))
    await waitFor(() =>
      expect(db.users.find((u) => u.username === 'mesero.baja')?.active).toBe(true),
    )
  })

  it('al editarse, el admin no puede elegir roles sin acceso de admin', async () => {
    renderApp('/admin/usuarios', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Editar admin.demo' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar admin.demo' })
    expect(within(dialog).getByRole('option', { name: 'Mesero · Mesero' })).toBeDisabled()
    expect(within(dialog).getByLabelText('Nueva contraseña')).toHaveValue('')
  })

  it('administra roles: crea uno y no elimina los que tienen usuarios', async () => {
    renderApp('/admin/usuarios', 'admin')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /roles/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Roles' })
    expect(within(dialog).getByRole('button', { name: 'Eliminar rol Mesero' })).toBeDisabled()

    await user.click(within(dialog).getByRole('button', { name: 'Editar rol Administrador' }))
    expect(within(dialog).getByLabelText('Acceso')).toBeDisabled()
    await user.click(within(dialog).getByRole('button', { name: 'Roles' }))

    await user.click(within(dialog).getByRole('button', { name: /nuevo rol/i }))
    await user.type(within(dialog).getByLabelText('Nombre'), 'Barista')
    await user.selectOptions(within(dialog).getByLabelText('Acceso'), 'Cajero')
    await user.type(within(dialog).getByLabelText('Nivel de permisos'), '4')
    await user.click(within(dialog).getByRole('button', { name: 'Crear rol' }))

    expect(await within(dialog).findByText('Barista')).toBeInTheDocument()
    expect(db.userTypes.at(-1)).toMatchObject({
      name: 'Barista',
      role: 'cajero',
      permissionLevel: 4,
    })
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar rol Barista' }))
    await waitFor(() => expect(db.userTypes.map((t) => t.name)).not.toContain('Barista'))
  })
})
