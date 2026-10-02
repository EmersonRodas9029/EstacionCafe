import { expect, test } from '@playwright/test'
import { api, login, unique } from './support'

test.describe('Administración', () => {
  test('producto nuevo con receta aparece en el menú del mesero', async ({ page, browser }) => {
    const name = unique('Mocha')
    await login(page, 'admin.demo')
    await page.goto('/admin/productos/nuevo')
    await page.getByLabel('Nombre').fill(name)
    await page.getByLabel('Descripción').fill('Espresso, chocolate y leche')
    await page.getByLabel('Categoría').selectOption({ label: 'Bebidas' })
    await page.getByLabel('Precio de venta').fill('4.25')
    await page.getByRole('button', { name: /agregar ingrediente/i }).click()
    await page
      .getByLabel('Consumible del ingrediente 1')
      .selectOption({ label: 'Café en grano (g)' })
    await page.getByLabel('Cantidad del ingrediente 1').fill('18')
    await page.getByRole('button', { name: /usar como costo/i }).click()
    await page.getByRole('button', { name: 'Crear producto' }).click()
    await expect(page).toHaveURL(/\/admin\/productos$/)
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible()

    const waiter = await browser.newPage()
    await login(waiter, 'mesero.demo')
    await waiter.getByRole('link', { name: /Mesa M1/ }).click()
    await waiter
      .getByRole('button', { name: /nueva cuenta/i })
      .first()
      .click()
    await waiter
      .getByRole('dialog')
      .getByRole('button', { name: /abrir y tomar orden/i })
      .click()
    await expect(waiter.getByRole('button', { name: new RegExp(`Agregar ${name}`) })).toBeVisible()
    await waiter.close()
  })

  test('una compra suma inventario y eliminarla lo revierte', async ({ page, request }) => {
    const admin = await api(request)
    const coffee = () =>
      admin
        .get('/consumable')
        .then((list) => list.find((c: { name: string }) => c.name === 'Café en grano'))
    const before = (await coffee()).quantity

    await login(page, 'admin.demo')
    await page.goto('/admin/compras/nueva')
    await page.getByLabel('Proveedor').selectOption({ label: 'Proveedor Demo' })
    await page.getByLabel('Consumible de la línea 1').selectOption({ label: 'Café en grano (g)' })
    await page.getByLabel('Cantidad de la línea 1').fill('1000')
    await page.getByLabel('Costo unitario de la línea 1').fill('0.0275')
    await page.getByRole('button', { name: 'Registrar compra' }).click()
    await expect(page).toHaveURL(/\/admin\/compras\/\d+$/)
    expect(await coffee()).toMatchObject({ quantity: before + 1000, cost: 0.0275 })

    await page.goto('/admin/inventario')
    await expect(page.getByText('$0.0275/g')).toBeVisible()

    await page.goBack()
    await page.getByRole('button', { name: /eliminar/i }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar compra' }).click()
    await expect(page).toHaveURL(/\/admin\/compras$/)
    expect((await coffee()).quantity).toBe(before)
  })

  test('anular una factura cobrada la saca de las ventas', async ({ page, request }) => {
    const waiter = await api(request, 'mesero.demo')
    const bill = await waiter.post('/bills', { customer: 'Anular e2e' })
    const products = await waiter.get('/products/active')
    await waiter.post('/bill-details', {
      billId: bill.billId,
      billDetails: [{ productId: products[0].productId, quantity: 1 }],
    })
    const cashier = await api(request, 'cajero.demo')
    const [register] = await cashier.get('/cash-registers/active')
    // Cobro vía API: la UI de cobro ya se cubre en waiter.spec
    await cashier.put(`/bills/${bill.billId}`, {
      status: 'closed',
      cashRegisterId: register.cashRegisterId,
    })

    await login(page, 'admin.demo')
    await page.goto(`/admin/facturas/${bill.billId}`)
    await expect(page.getByText('Cobrada')).toBeVisible()
    await page.getByRole('button', { name: /anular/i }).click()
    await expect(page.getByRole('dialog')).toContainText('El inventario no se devuelve')
    await page.getByRole('dialog').getByRole('button', { name: 'Anular factura' }).click()
    await expect(page.getByText(/no cuenta en ventas/i)).toBeVisible()

    const admin = await api(request)
    expect((await admin.get(`/bills/${bill.billId}`)).status).toBe('void')
  })

  test('usuarios: crear un mesero que puede iniciar sesión, y desactivarlo', async ({
    page,
    browser,
  }) => {
    const username = unique('e2e').replace(' ', '.')
    await login(page, 'admin.demo')
    await page.goto('/admin/usuarios')
    await page.getByRole('button', { name: /nuevo usuario/i }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Usuario').fill(username)
    await dialog.getByLabel('Correo').fill(`${username}@test.sv`)
    await dialog.getByLabel('Rol').selectOption({ label: 'Mesero · Mesero' })
    await dialog.getByLabel('Contraseña').fill('Secreto123')
    await dialog.getByRole('button', { name: 'Crear usuario' }).click()
    await expect(page.getByText(`${username} creado`)).toBeVisible()

    const other = await browser.newPage()
    await other.goto('/login')
    await other.getByLabel('Usuario', { exact: true }).fill(username)
    await other.getByLabel('Contraseña', { exact: true }).fill('Secreto123')
    await other.getByRole('button', { name: /ingresar/i }).click()
    await expect(other).toHaveURL(/\/mesero\/mesas$/)
    await other.close()

    await page.getByRole('button', { name: `Desactivar ${username}` }).click()
    await expect(page.getByText(`${username} desactivado`)).toBeVisible()
    await expect(page.getByText('Tu usuario')).toBeVisible()
  })

  test('mesas: crear y eliminar una mesa sin historial', async ({ page }) => {
    await login(page, 'admin.demo')
    await page.goto('/admin/mesas')
    await page.getByRole('button', { name: /nueva mesa/i }).click()
    await page.getByRole('dialog').getByLabel('Identificador').fill('e9')
    await page.getByRole('dialog').getByLabel('Zona').fill('Pruebas')
    await page.getByRole('dialog').getByRole('button', { name: 'Crear mesa' }).click()
    await expect(page.getByRole('heading', { name: 'Pruebas' })).toBeVisible()
    await page.getByRole('button', { name: 'Eliminar mesa E9' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()
    await expect(page.getByText('Mesa E9 eliminada')).toBeVisible()
  })
})

test.describe('Dashboard y reportes', () => {
  test('las cifras cuadran con el reporte de la API', async ({ page, request }) => {
    const waiter = await api(request, 'mesero.demo')
    const cashier = await api(request, 'cajero.demo')
    const bill = await waiter.post('/bills', { customer: 'Reporte e2e' })
    const [product] = await waiter.get('/products/active')
    await waiter.post('/bill-details', {
      billId: bill.billId,
      billDetails: [{ productId: product.productId, quantity: 2 }],
    })
    const [register] = await cashier.get('/cash-registers/active')
    await cashier.put(`/bills/${bill.billId}`, {
      status: 'closed',
      cashRegisterId: register.cashRegisterId,
    })

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador' }).format(
      new Date(),
    )
    const admin = await api(request)
    const report = await admin.get(
      `/reports/sales?from=${today}T00:00:00-06:00&to=${today}T23:59:59.999-06:00`,
    )
    expect(report.summary.totalSales).toBeGreaterThan(0)
    const money = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' })

    await login(page, 'admin.demo')
    const todayCard = page.getByText('Ventas de hoy', { exact: true }).locator('..')
    await expect(todayCard).toContainText(money.format(report.summary.totalSales))
    await expect(todayCard).toContainText(`${report.summary.billsCount} cuentas`)

    await page.goto('/admin/reportes')
    await page.getByRole('button', { name: 'Hoy' }).click()
    const sales = page.getByRole('main').getByText('Ventas', { exact: true }).locator('..')
    await expect(sales).toContainText(money.format(report.summary.totalSales))
    await expect(page.getByRole('heading', { name: 'Productos más vendidos' })).toBeVisible()
    await expect(page.getByText(product.name).first()).toBeVisible()
  })
})
