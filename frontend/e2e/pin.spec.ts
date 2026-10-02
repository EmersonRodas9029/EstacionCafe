import { expect, test } from '@playwright/test'
import { api, login } from './support'

test.describe('Acceso con PIN e inactividad', () => {
  test('autorizar la tablet, entrar con PIN y cerrar a los 15 s sin uso', async ({
    page,
    request,
  }) => {
    const admin = await api(request)
    const users = await admin.get('/users')
    const mesero = users.find((u: { username: string }) => u.username === 'mesero.demo')
    const { pin } = await admin.put(`/users/${mesero.userId}/pin`, {})

    // El admin autoriza esta "tablet" desde el propio navegador
    await login(page, 'admin.demo')
    await page.goto('/admin/dispositivos')
    await page.getByLabel('Nombre del equipo').fill('Tablet e2e')
    await page.getByRole('button', { name: /autorizar este equipo/i }).click()
    await expect(page.getByText(/Autorizado como/)).toContainText('Tablet e2e')
    await page.getByRole('button', { name: 'Cerrar sesión' }).first().click()

    // Ahora la pantalla de entrada es el teclado
    await expect(page.getByRole('heading', { name: 'Ingresa tu PIN' })).toBeVisible()
    await page.clock.install()
    for (const digit of '0000')
      await page
        .getByRole('group', { name: 'Teclado de PIN' })
        .getByRole('button', { name: digit, exact: true })
        .click()
    await expect(page.getByText('PIN incorrecto')).toBeVisible()
    for (const digit of pin as string)
      await page
        .getByRole('group', { name: 'Teclado de PIN' })
        .getByRole('button', { name: digit, exact: true })
        .click()
    await expect(page).toHaveURL(/\/mesero\/mesas$/)

    // 10 s sin tocar: aviso; 5 s más: fuera, y la sesión ya no sirve en la API
    await page.clock.runFor(10_500)
    await expect(page.getByRole('alertdialog')).toContainText('¿Sigues ahí?')
    await page.clock.runFor(5_000)
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText('Sesión cerrada por inactividad')).toBeVisible()
    const me = await page.request.get('/api/users/me')
    expect(me.status()).toBe(401)
  })
})
