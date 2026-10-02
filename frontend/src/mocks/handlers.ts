import { http, HttpResponse } from 'msw'
import type { Bill } from '@/api/generated/model/bill'
import { DEMO_PASSWORD, products, users } from './data'
import { db, isActive, linesOf, recalcTotal, syncTable, withWaiter } from './db'

const ok = <T>(data: T, message = 'OK', status = 200) =>
  HttpResponse.json({ status: 'success', message, data }, { status })
const fail = (status: number, message: string, type?: string) =>
  HttpResponse.json({ status: 'error', message, ...(type && { type }) }, { status })

// Token simulado: "mock-<userId>"
const userFromRequest = (request: Request) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  return users.find((u) => token === `mock-${u.userId}`)
}

const findBill = (id: string | readonly string[] | undefined) =>
  db.bills.find((b) => b.billId === Number(id))

export const handlers = [
  // ---------- Auth ----------
  http.post('*/api/users/login', async ({ request }) => {
    const { username, password } = (await request.json()) as Record<string, string>
    const user = users.find((u) => u.username === username)
    if (!user || password !== DEMO_PASSWORD) return fail(401, 'Usuario o contraseña incorrectos')
    return ok({ token: `mock-${user.userId}`, expiresIn: 43200 }, 'Inicio de sesión exitoso')
  }),
  http.post('*/api/users/logout', () => ok(null, 'Sesión cerrada')),
  http.get('*/api/users/me', ({ request }) => {
    const user = userFromRequest(request)
    return user ? ok(user, 'Usuario autenticado') : fail(401, 'Token inválido')
  }),

  // ---------- Catálogo ----------
  http.get('*/api/products', () => ok(products)),
  http.get('*/api/products/active', () => ok(products.filter((p) => p.active))),
  http.get('*/api/product-type', () => ok(db.productTypes)),
  http.get('*/api/cash-registers/active', () => ok(db.cashRegisters.filter((c) => c.active))),

  // ---------- Mesas ----------
  http.get('*/api/tables', () => ok(db.tables)),
  http.get('*/api/tables/:id', ({ params }) => {
    const table = db.tables.find((t) => t.tableId === params.id)
    return table ? ok(table) : fail(404, `Mesa con ID ${String(params.id)} no encontrada`)
  }),
  http.patch('*/api/tables/:id/status', async ({ params, request }) => {
    const table = db.tables.find((t) => t.tableId === params.id)
    if (!table) return fail(404, 'Mesa no encontrada')
    table.status = ((await request.json()) as { status: typeof table.status }).status
    return ok(table)
  }),

  // ---------- Cuentas ----------
  http.get('*/api/bills', ({ request }) => {
    const query = new URL(request.url).searchParams
    const status = query.get('status')
    const tableId = query.get('tableId')
    const orderType = query.get('orderType')
    const items = db.bills.filter(
      (b) =>
        (!status || b.status === status) &&
        (!tableId || b.tableId === tableId) &&
        (!orderType || b.orderType === orderType),
    )
    return ok(items.map(withWaiter))
  }),
  http.get('*/api/bills/:id', ({ params }) => {
    const bill = findBill(params.id)
    return bill ? ok(withWaiter(bill)) : fail(404, 'Factura no encontrada')
  }),
  http.post('*/api/bills', async ({ request }) => {
    const body = (await request.json()) as Partial<Bill>
    const user = userFromRequest(request)
    if (body.tableId && !db.tables.some((t) => t.tableId === body.tableId)) {
      return fail(400, `Mesa ${body.tableId} no encontrada`)
    }
    const bill: Bill = {
      billId: db.nextBillId++,
      waiterId: user?.userId ?? 2,
      cashRegisterId: null,
      tableId: body.tableId ?? null,
      orderType: body.tableId ? 'dine_in' : 'takeaway',
      customer: body.customer ?? '',
      date: new Date().toISOString(),
      total: 0,
      status: body.status ?? 'open',
    }
    db.bills.push(bill)
    syncTable(bill.tableId)
    return ok(withWaiter(bill), 'Factura creada correctamente', 201)
  }),
  http.put('*/api/bills/:id', async ({ params, request }) => {
    const bill = findBill(params.id)
    if (!bill) return fail(404, 'Factura no encontrada')
    const body = (await request.json()) as Partial<Bill>
    if (body.status === 'closed' && !(body.cashRegisterId ?? bill.cashRegisterId)) {
      return fail(400, 'Se requiere cashRegisterId para cerrar la cuenta')
    }
    const previousTable = bill.tableId
    Object.assign(bill, body)
    syncTable(previousTable)
    syncTable(bill.tableId)
    return ok(withWaiter(bill))
  }),
  http.post('*/api/bills/table/:tableId/close', async ({ params, request }) => {
    const { cashRegisterId } = (await request.json()) as { cashRegisterId?: number }
    if (!cashRegisterId) return fail(400, 'Datos inválidos: cashRegisterId requerido')
    const open = db.bills.filter((b) => b.tableId === params.tableId && isActive(b))
    for (const bill of open) Object.assign(bill, { status: 'closed', cashRegisterId })
    syncTable(String(params.tableId))
    return ok({ updated: open.length }, `Se cerraron ${open.length} facturas`)
  }),

  // ---------- Detalles ----------
  http.get('*/api/bill-details/bill/:billId', ({ params }) => ok(linesOf(Number(params.billId)))),
  http.post('*/api/bill-details', async ({ request }) => {
    const { billId, billDetails } = (await request.json()) as {
      billId: number
      billDetails: { productId: number; quantity: number }[]
    }
    const bill = findBill(String(billId))
    if (!bill) return fail(400, 'Bill no encontrado')
    if (!isActive(bill)) return fail(409, 'La cuenta no se puede modificar')
    for (const item of billDetails) {
      const available = db.stock[item.productId]
      if (available !== undefined && available < item.quantity) {
        const name = products.find((p) => p.productId === item.productId)?.name
        return fail(400, `Stock insuficiente para "${name}"`, 'stock_error')
      }
    }
    for (const item of billDetails) {
      if (db.stock[item.productId] !== undefined) db.stock[item.productId]! -= item.quantity
      const line = db.details.find((d) => d.billId === billId && d.productId === item.productId)
      if (line) line.quantity += item.quantity
      else
        db.details.push({
          billDetailId: db.nextDetailId++,
          billId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: products.find((p) => p.productId === item.productId)!.price,
        })
    }
    recalcTotal(billId)
    return ok([], 'Factura y detalles guardados correctamente', 201)
  }),
  http.patch('*/api/bill-details/:id', async ({ params, request }) => {
    const line = db.details.find((d) => d.billDetailId === Number(params.id))
    if (!line) return fail(404, 'Detalle no encontrado')
    line.quantity = ((await request.json()) as { quantity: number }).quantity
    recalcTotal(line.billId)
    return ok(line)
  }),
  http.delete('*/api/bill-details/:id', ({ params }) => {
    const line = db.details.find((d) => d.billDetailId === Number(params.id))
    if (!line) return fail(404, 'Detalle no encontrado')
    db.details = db.details.filter((d) => d !== line)
    recalcTotal(line.billId)
    return HttpResponse.json({ status: 'success', message: 'Detalle eliminado' }, { status: 202 })
  }),
]
