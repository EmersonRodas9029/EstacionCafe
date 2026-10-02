import { expect, test, type Page } from '@playwright/test'
import { api, login } from './support'

const sendOrder = async (page: Page) => {
  const isMobile = (page.viewportSize()?.width ?? 1280) < 1024
  if (isMobile) {
    await page.getByRole('button', { name: /ver orden/i }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /enviar/i })
      .click()
  } else {
    await page
      .getByRole('complementary', { name: 'Orden' })
      .getByRole('button', { name: /enviar/i })
      .click()
  }
  await expect(page).toHaveURL(/\/mesero\/cuentas\/\d+$/)
}

test.describe('Mesero', () => {
  test('mesa con dos cuentas: ordenar, cobrar la mesa y liberarla', async ({ page, request }) => {
    const admin = await api(request)
    const stockBefore = (await admin.get('/consumable')).find(
      (c: { name: string }) => c.name === 'Café en grano',
    ).quantity

    await login(page, 'mesero.demo')
    await page.getByRole('link', { name: /Mesa M2/ }).click()

    for (const [customer, product] of [
      ['Ana', 'Café Americano'],
      ['Luis', 'Café Latte'],
    ] as const) {
      await page
        .getByRole('button', { name: /nueva cuenta/i })
        .first()
        .click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Nombre de la cuenta').fill(customer)
      await dialog.getByRole('button', { name: /abrir y tomar orden/i }).click()
      await page.getByRole('button', { name: new RegExp(`Agregar ${product}`) }).click()
      await page.getByRole('button', { name: new RegExp(`Agregar ${product}`) }).click()
      await sendOrder(page)
      await page.goto('/mesero/mesas/M2')
    }

    await expect(page.getByText('Ana')).toBeVisible()
    await expect(page.getByText('Luis')).toBeVisible()
    await expect(page.getByText('Ocupada')).toBeVisible()

    await page.getByRole('button', { name: /cobrar mesa/i }).click()
    const charge = page.getByRole('dialog')
    await charge.getByLabel(/efectivo recibido/i).fill('20')
    await expect(charge.getByText(/cambio/i)).toBeVisible()
    await charge.getByRole('button', { name: /cobrar \$/i }).click()
    await expect(page.getByText(/cobrad/i).first()).toBeVisible()

    await page.goto('/mesero/mesas')
    await expect(page.getByRole('link', { name: /Mesa M2/ })).toContainText('Disponible')

    // Las recetas descontaron café del inventario
    const stockAfter = (await admin.get('/consumable')).find(
      (c: { name: string }) => c.name === 'Café en grano',
    ).quantity
    expect(stockAfter).toBeLessThan(stockBefore)
  })

  test('para llevar: preparar, cobrar, entregar y verla en el historial', async ({ page }) => {
    await login(page, 'cajero.demo')
    await page.goto('/mesero/para-llevar')
    await page.getByRole('button', { name: /nueva orden/i }).click()
    await page.getByRole('dialog').getByLabel('Nombre de la cuenta').fill('Sofía e2e')
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /abrir y tomar orden/i })
      .click()
    await page.getByRole('button', { name: /Agregar Croissant/ }).click()
    await sendOrder(page)

    await page.getByRole('button', { name: /cobrar cuenta/i }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /cobrar \$/i })
      .click()
    await expect(page.getByText('Cuenta "Sofía e2e" cobrada')).toBeVisible()
    await page.getByRole('button', { name: /marcar entregada/i }).click()
    await expect(page.getByText(/entregada/i).first()).toBeVisible()

    await page.goto('/mesero/historial')
    await expect(page.getByText('Sofía e2e')).toBeVisible()
  })

  test('ticket imprimible de una cuenta cobrada', async ({ page }) => {
    await login(page, 'cajero.demo')
    await page.goto('/mesero/historial')
    await page
      .getByRole('link', { name: /Ticket de/ })
      .first()
      .click()
    await expect(page.getByText('TICKET DE VENTA')).toBeVisible()
    await expect(page.getByRole('button', { name: /imprimir/i })).toBeVisible()
  })

  test('@movil el mesero ordena desde el teléfono', async ({ page }) => {
    await login(page, 'mesero.demo')
    await page.getByRole('link', { name: /Mesa M1/ }).click()
    await page
      .getByRole('button', { name: /nueva cuenta/i })
      .first()
      .click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /abrir y tomar orden/i })
      .click()
    await page.getByRole('button', { name: /Agregar Café Americano/ }).click()
    await sendOrder(page)
    await expect(page.getByText('Café Americano')).toBeVisible()
  })

  test('privacidad: la cuenta de otro se ve como "Atiende …" y no se puede abrir', async ({
    page,
    request,
  }) => {
    const cashier = await api(request, 'cajero.demo')
    const bill = await cashier.post('/bills', { customer: 'Cuenta privada e2e', tableId: 'M2' })

    await login(page, 'mesero.demo')
    const m2 = page.getByRole('link', { name: /Mesa M2/ })
    await expect(m2).toContainText('Atiende cajero.demo')
    await expect(m2).not.toContainText('$')

    await m2.click()
    await expect(page.getByText(/También atiende esta mesa/)).toContainText('cajero.demo')
    await expect(page.getByText('Cuenta privada e2e')).toHaveCount(0)

    await page.goto(`/mesero/cuentas/${bill.billId}`)
    await expect(page.getByText('No encontramos la cuenta.')).toBeVisible()

    // Deja la mesa como estaba para las demás pruebas
    const admin = await api(request)
    await admin.post(`/bills/${bill.billId}/void`, {})
  })
})
