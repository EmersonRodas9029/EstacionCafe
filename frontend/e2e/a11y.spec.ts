import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { login } from './support'

/** WCAG 2.1 AA: falla con cualquier violación seria o crítica. */
async function audit(page: Page, name: string) {
  await page.waitForLoadState('networkidle')
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const summary = serious.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  )
  expect(summary, `Violaciones en ${name}`).toEqual([])
}

test.describe('Accesibilidad (axe)', () => {
  test('login', async ({ page }) => {
    await page.goto('/login')
    await audit(page, 'login')
  })

  test('vistas del mesero', async ({ page }) => {
    await login(page, 'mesero.demo')
    for (const path of [
      '/mesero/mesas',
      '/mesero/mesas/M1',
      '/mesero/para-llevar',
      '/mesero/historial',
      '/mesero/perfil',
    ]) {
      await page.goto(path)
      await audit(page, path)
    }
  })

  test('vistas del admin', async ({ page }) => {
    await login(page, 'admin.demo')
    for (const path of [
      '/admin',
      '/admin/facturas',
      '/admin/reportes',
      '/admin/productos',
      '/admin/productos/nuevo',
      '/admin/inventario',
      '/admin/proveedores',
      '/admin/compras',
      '/admin/compras/nueva',
      '/admin/mesas',
      '/admin/cajas',
      '/admin/usuarios',
    ]) {
      await page.goto(path)
      await audit(page, path)
    }
  })

  test('diálogos', async ({ page }) => {
    await login(page, 'admin.demo')
    await page.goto('/admin/usuarios')
    await page.getByRole('button', { name: /nuevo usuario/i }).click()
    await audit(page, 'diálogo de usuario')
    await page.keyboard.press('Escape')
    await page.goto('/admin/productos')
    await page.getByRole('button', { name: /categorías/i }).click()
    await audit(page, 'diálogo de categorías')
  })

  test('@movil vistas del mesero en teléfono', async ({ page }) => {
    await login(page, 'mesero.demo')
    for (const path of ['/mesero/mesas', '/mesero/mesas/M1', '/mesero/para-llevar']) {
      await page.goto(path)
      await audit(page, `${path} (móvil)`)
    }
  })
})
