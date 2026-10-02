import { expect, test } from '@playwright/test'
import { login, PASSWORD } from './support'

test.describe('Autenticación y roles', () => {
  test('credenciales incorrectas muestran el error de la API', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Usuario', { exact: true }).fill('mesero.demo')
    await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta')
    await page.getByRole('button', { name: /ingresar/i }).click()
    await expect(page.getByRole('alert')).toContainText(/incorrect/i)
    await expect(page).toHaveURL(/\/login/)
  })

  test('cada rol entra a su panel y el mesero no puede abrir el admin', async ({ page }) => {
    await login(page, 'mesero.demo')
    await expect(page).toHaveURL(/\/mesero\/mesas$/)
    await page.goto('/admin/productos')
    await expect(page).not.toHaveURL(/\/admin/)

    // Botón rápido junto al nombre (también para mesero y cajero)
    await page.goto('/mesero/mesas')
    await page.getByRole('button', { name: 'Cerrar sesión' }).first().click()
    await expect(page).toHaveURL(/\/login/)

    await login(page, 'admin.demo')
    await expect(page).toHaveURL(/\/admin$/)
  })

  test('un enlace protegido vuelve a su destino tras iniciar sesión', async ({ page }) => {
    await page.goto('/admin/usuarios')
    await expect(page).toHaveURL(/\/login/)
    await page.getByLabel('Usuario', { exact: true }).fill('admin.demo')
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: /ingresar/i }).click()
    await expect(page).toHaveURL(/\/admin\/usuarios$/)
    await expect(page.getByRole('heading', { name: 'Usuarios y roles' })).toBeVisible()
  })

  test('la sesión sobrevive a recargar la página', async ({ page }) => {
    await login(page, 'cajero.demo')
    await page.reload()
    await expect(page).toHaveURL(/\/mesero\/mesas$/)
    await expect(
      page.getByRole('navigation', { name: 'Principal' }).getByText('cajero.demo'),
    ).toBeVisible()
  })
})
