import { http, HttpResponse } from 'msw'
import type { Bill } from '@/api/generated/model/bill'
import type { CurrentUser } from '@/api/generated/model/currentUser'
import type { UserType } from '@/api/generated/model/userType'
import type { Ingredient } from '@/api/generated/model/ingredient'
import type { IngredientInput } from '@/api/generated/model/ingredientInput'
import type { IngredientUpdate } from '@/api/generated/model/ingredientUpdate'
import type { Product } from '@/api/generated/model/product'
import type { ProductInput } from '@/api/generated/model/productInput'
import type { ProductUpdate } from '@/api/generated/model/productUpdate'
import { DEMO_PASSWORD } from './data'
import {
  consumableView,
  db,
  isActive,
  purchaseView,
  linesOf,
  recalcTotal,
  syncTable,
  withWaiter,
} from './db'

const ok = <T>(data: T, message = 'OK', status = 200) =>
  HttpResponse.json({ status: 'success', message, data }, { status })
const fail = (status: number, message: string, type?: string) =>
  HttpResponse.json({ status: 'error', message, ...(type && { type }) }, { status })

// Token simulado: "mock-<userId>"
const userFromRequest = (request: Request) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  return db.users.find((u) => token === `mock-${u.userId}`)
}

/** Como la API: sin contraseña y con su tipo de usuario. */
const publicUser = ({ role: _role, ...user }: CurrentUser) => ({
  ...user,
  userType: db.userTypes.find((t) => t.userTypeId === user.userTypeId),
})

const applyUserType = (user: CurrentUser, typeId: number) => {
  const type = db.userTypes.find((t) => t.userTypeId === typeId)!
  Object.assign(user, { userTypeId: typeId, userType: type, role: type.role })
}

const SV_PHONE = /^(\+503)?[2-9]\d{3}-?\d{4}$/

const findProduct = (id: string | readonly string[] | undefined) =>
  db.products.find((p) => p.productId === Number(id))

const findBill = (id: string | readonly string[] | undefined) =>
  db.bills.find((b) => b.billId === Number(id))

export const handlers = [
  // ---------- Auth ----------
  http.post('*/api/users/login', async ({ request }) => {
    const { username, password } = (await request.json()) as Record<string, string>
    const user = db.users.find((u) => u.username === username)
    if (!user || !user.active || password !== DEMO_PASSWORD)
      return fail(401, 'Usuario o contraseña incorrectos')
    return ok({ token: `mock-${user.userId}`, expiresIn: 43200 }, 'Inicio de sesión exitoso')
  }),
  http.post('*/api/users/logout', () => ok(null, 'Sesión cerrada')),
  http.get('*/api/users/me', ({ request }) => {
    const user = userFromRequest(request)
    return user ? ok(user, 'Usuario autenticado') : fail(401, 'Token inválido')
  }),

  // ---------- Catálogo ----------
  http.get('*/api/products', () => ok(db.products)),
  http.get('*/api/products/active', () => ok(db.products.filter((p) => p.active))),
  http.get('*/api/products/:id', ({ params }) => {
    const product = findProduct(params.id)
    return product ? ok(product) : fail(404, `Producto con ID ${params.id} no encontrado`)
  }),
  http.post('*/api/products', async ({ request }) => {
    const body = (await request.json()) as ProductInput
    const product: Product = {
      productId: db.nextProductId++,
      name: body.name,
      description: body.description,
      price: Number(body.price),
      cost: Number(body.cost),
      productTypeId: Number(body.productTypeId),
      active: true,
    }
    if (product.price <= product.cost) return fail(400, 'El precio debe ser mayor al costo')
    db.products.push(product)
    return ok(product, 'El producto se guardó correctamente', 201)
  }),
  http.put('*/api/products/:id', async ({ params, request }) => {
    const product = findProduct(params.id)
    if (!product) return fail(404, `Producto con ID ${params.id} no encontrado`)
    const body = (await request.json()) as ProductUpdate
    const next = {
      ...product,
      ...body,
      price: Number(body.price ?? product.price),
      cost: Number(body.cost ?? product.cost),
      productTypeId: Number(body.productTypeId ?? product.productTypeId),
    }
    if (next.price <= next.cost) return fail(400, 'El precio debe ser mayor al costo')
    Object.assign(product, next)
    return ok(product, 'Producto actualizado correctamente')
  }),
  http.delete('*/api/products/:id', ({ params }) => {
    const product = findProduct(params.id)
    if (!product) return fail(404, `Producto con ID ${params.id} no encontrado`)
    product.active = false
    return ok({ message: 'Producto desactivado correctamente', id: product.productId })
  }),

  http.get('*/api/product-type', () => ok(db.productTypes)),
  http.post('*/api/product-type', async ({ request }) => {
    const { name } = (await request.json()) as { name: string }
    const productType = { productTypeId: db.nextProductTypeId++, name }
    db.productTypes.push(productType)
    return ok(productType, 'El tipo de producto se guardó correctamente', 201)
  }),
  http.put('*/api/product-type/:id', async ({ params, request }) => {
    const productType = db.productTypes.find((t) => t.productTypeId === Number(params.id))
    if (!productType) return fail(404, 'Tipo de producto no encontrado')
    Object.assign(productType, (await request.json()) as { name: string })
    return ok(productType)
  }),
  http.delete('*/api/product-type/:id', ({ params }) => {
    const id = Number(params.id)
    const count = db.products.filter((p) => p.productTypeId === id).length
    if (count > 0)
      return fail(
        409,
        `La categoría tiene ${count} ${count === 1 ? 'producto asociado' : 'productos asociados'} y no se puede eliminar`,
      )
    db.productTypes = db.productTypes.filter((t) => t.productTypeId !== id)
    return ok({ message: 'Tipo de producto eliminado correctamente', id })
  }),

  // ---------- Inventario ----------
  http.get('*/api/consumable', () => ok(db.consumables.map(consumableView))),
  http.get('*/api/consumable/low-stock', () =>
    ok(db.consumables.filter((c) => c.active && c.quantity <= c.minStock).map(consumableView)),
  ),
  http.get('*/api/consumable/supplier/:supplierId', ({ params }) =>
    ok(
      db.consumables.filter((c) => c.supplierId === Number(params.supplierId)).map(consumableView),
    ),
  ),
  http.post('*/api/consumable', async ({ request }) => {
    const body = (await request.json()) as Record<string, string | number>
    const consumable = {
      consumableId: db.nextConsumableId++,
      name: String(body.name),
      supplierId: Number(body.supplierId),
      consumableTypeId: Number(body.consumableTypeId),
      quantity: Number(body.quantity),
      unitMeasurement: body.unitMeasurement as (typeof db.consumables)[number]['unitMeasurement'],
      cost: Number(body.cost),
      minStock: Number(body.minStock ?? 0),
      lowStock: false,
      active: true,
    }
    db.consumables.push(consumable)
    return ok(consumableView(consumable), 'Consumible guardado', 201)
  }),
  http.put('*/api/consumable/:id', async ({ params, request }) => {
    const consumable = db.consumables.find((c) => c.consumableId === Number(params.id))
    if (!consumable) return fail(404, 'Consumible no encontrado')
    const body = (await request.json()) as Record<string, unknown>
    for (const key of ['quantity', 'cost', 'minStock', 'supplierId', 'consumableTypeId'])
      if (body[key] !== undefined) body[key] = Number(body[key])
    if (typeof body.quantity === 'number' && body.quantity < 0)
      return fail(400, 'Datos inválidos: La cantidad no puede ser negativa')
    Object.assign(consumable, body)
    return ok(consumableView(consumable))
  }),
  http.delete('*/api/consumable/:id', ({ params }) => {
    const consumable = db.consumables.find((c) => c.consumableId === Number(params.id))
    if (!consumable) return fail(404, 'Consumible no encontrado')
    consumable.active = false
    return ok({ message: 'Consumible desactivado correctamente', id: consumable.consumableId })
  }),
  http.get('*/api/consumable-type', () => ok(db.consumableTypes)),
  http.post('*/api/consumable-type', async ({ request }) => {
    const { name } = (await request.json()) as { name: string }
    const type = { consumableTypeId: db.nextConsumableTypeId++, name }
    db.consumableTypes.push(type)
    return ok(type, 'Tipo de consumible guardado', 201)
  }),
  http.put('*/api/consumable-type/:id', async ({ params, request }) => {
    const type = db.consumableTypes.find((t) => t.consumableTypeId === Number(params.id))
    if (!type) return fail(404, 'Tipo de consumible no encontrado')
    Object.assign(type, (await request.json()) as { name: string })
    return ok(type)
  }),
  http.delete('*/api/consumable-type/:id', ({ params }) => {
    const id = Number(params.id)
    const count = db.consumables.filter((c) => c.consumableTypeId === id).length
    if (count > 0)
      return fail(409, `El tipo tiene ${count} consumibles asociados y no se puede eliminar`)
    db.consumableTypes = db.consumableTypes.filter((t) => t.consumableTypeId !== id)
    return ok({ message: 'Tipo eliminado', id })
  }),

  // ---------- Proveedores ----------
  http.get('*/api/suppliers', () => ok(db.suppliers)),
  http.get('*/api/suppliers/active', () => ok(db.suppliers.filter((s) => s.active))),
  http.get('*/api/suppliers/:id', ({ params }) => {
    const supplier = db.suppliers.find((s) => s.supplierId === Number(params.id))
    return supplier ? ok(supplier) : fail(404, `Proveedor con ID ${params.id} no encontrado`)
  }),
  http.post('*/api/suppliers', async ({ request }) => {
    const body = (await request.json()) as { name: string; phone: string; email: string }
    if (!SV_PHONE.test(body.phone))
      return fail(400, 'Datos inválidos: El teléfono debe tener formato válido')
    const supplier = {
      supplierId: db.nextSupplierId++,
      ...body,
      phone: body.phone.replace(/\s|-/g, ''),
      active: true,
    }
    db.suppliers.push(supplier)
    return ok(supplier, 'Proveedor creado', 201)
  }),
  http.put('*/api/suppliers/:id', async ({ params, request }) => {
    const supplier = db.suppliers.find((s) => s.supplierId === Number(params.id))
    if (!supplier) return fail(404, `Proveedor con ID ${params.id} no encontrado`)
    const body = (await request.json()) as Partial<typeof supplier>
    if (body.phone !== undefined) {
      if (!SV_PHONE.test(body.phone))
        return fail(400, 'Datos inválidos: El teléfono debe tener formato válido')
      body.phone = body.phone.replace(/\s|-/g, '')
    }
    Object.assign(supplier, body)
    return ok(supplier)
  }),
  http.delete('*/api/suppliers/:id', ({ params }) => {
    const supplier = db.suppliers.find((s) => s.supplierId === Number(params.id))
    if (!supplier) return fail(404, `Proveedor con ID ${params.id} no encontrado`)
    supplier.active = false
    return ok({ message: 'Proveedor desactivado correctamente', id: supplier.supplierId })
  }),

  // ---------- Compras ----------
  http.get('*/api/purchases', () =>
    ok(db.purchases.map(({ details: _details, ...p }) => purchaseView(p))),
  ),
  http.get('*/api/purchases/supplier/:supplierId', ({ params }) =>
    ok(
      db.purchases
        .filter((p) => p.supplierId === Number(params.supplierId))
        .map(({ details: _details, ...p }) => purchaseView(p)),
    ),
  ),
  http.get('*/api/purchases/:id', ({ params }) => {
    const purchase = db.purchases.find((p) => p.purchaseId === Number(params.id))
    return purchase
      ? ok(purchaseView(purchase))
      : fail(404, `Compra con ID ${params.id} no encontrada`)
  }),
  http.post('*/api/purchases', async ({ request }) => {
    const body = (await request.json()) as {
      date: string
      supplierId: number
      cashRegisterId?: number
      total?: number
      details?: { consumableId: number; quantity: number; unitCost: number }[]
    }
    const purchaseId = db.nextPurchaseId++
    const details = (body.details ?? []).map((d) => {
      const consumable = db.consumables.find((c) => c.consumableId === Number(d.consumableId))!
      consumable.quantity += Number(d.quantity)
      consumable.cost = Number(d.unitCost)
      return {
        purchaseDetailId: db.nextPurchaseDetailId++,
        purchaseId,
        consumableId: Number(d.consumableId),
        quantity: Number(d.quantity),
        unitCost: Number(d.unitCost),
        subTotal: Math.round(Number(d.quantity) * Number(d.unitCost) * 100) / 100,
      }
    })
    const purchase = {
      purchaseId,
      date: body.date,
      supplierId: Number(body.supplierId),
      cashRegisterId: body.cashRegisterId ? Number(body.cashRegisterId) : null,
      total: body.details ? details.reduce((acc, d) => acc + d.subTotal, 0) : Number(body.total),
      details,
    }
    db.purchases.push(purchase)
    return ok(purchaseView(purchase), 'Compra registrada', 201)
  }),
  http.delete('*/api/purchases/:id', ({ params }) => {
    const purchase = db.purchases.find((p) => p.purchaseId === Number(params.id))
    if (!purchase) return fail(404, `Compra con ID ${params.id} no encontrada`)
    for (const d of purchase.details ?? []) {
      const consumable = db.consumables.find((c) => c.consumableId === d.consumableId)
      if (consumable && consumable.quantity - d.quantity < 0)
        return fail(
          409,
          `No se puede eliminar: "${consumable.name}" ya se consumió (stock ${consumable.quantity})`,
        )
    }
    for (const d of purchase.details ?? []) {
      const consumable = db.consumables.find((c) => c.consumableId === d.consumableId)
      if (consumable) consumable.quantity -= d.quantity
    }
    db.purchases = db.purchases.filter((p) => p !== purchase)
    return ok({ message: 'Compra eliminada correctamente', id: purchase.purchaseId })
  }),

  // ---------- Recetas ----------
  http.get('*/api/ingredient/product/:productId', ({ params }) =>
    ok(
      db.ingredients
        .filter((i) => i.productId === Number(params.productId))
        .map((i) => ({
          ...i,
          consumable: consumableView(
            db.consumables.find((c) => c.consumableId === i.consumableId)!,
          ),
        })),
    ),
  ),
  http.post('*/api/ingredient', async ({ request }) => {
    const body = (await request.json()) as IngredientInput
    const ingredient: Ingredient = {
      ingredientId: db.nextIngredientId++,
      name: body.name,
      quantity: Number(body.quantity),
      productId: Number(body.productId),
      consumableId: Number(body.consumableId),
    }
    db.ingredients.push(ingredient)
    return ok(ingredient, 'Ingrediente guardado correctamente', 201)
  }),
  http.put('*/api/ingredient/:id', async ({ params, request }) => {
    const ingredient = db.ingredients.find((i) => i.ingredientId === Number(params.id))
    if (!ingredient) return fail(404, `Ingrediente con ID ${params.id} no encontrado`)
    const body = (await request.json()) as IngredientUpdate
    Object.assign(
      ingredient,
      body,
      body.quantity !== undefined && { quantity: Number(body.quantity) },
    )
    return ok(ingredient)
  }),
  http.delete('*/api/ingredient/:id', ({ params }) => {
    const id = Number(params.id)
    if (!db.ingredients.some((i) => i.ingredientId === id))
      return fail(404, `Ingrediente con ID ${id} no encontrado`)
    db.ingredients = db.ingredients.filter((i) => i.ingredientId !== id)
    return ok({ message: 'Ingrediente eliminado correctamente', id })
  }),

  // ---------- Usuarios y roles ----------
  http.get('*/api/users', () => ok(db.users.map(publicUser))),
  http.post('*/api/users', async ({ request }) => {
    const body = (await request.json()) as { username: string; email: string; typeId: number }
    if (db.users.some((u) => u.username === body.username))
      return fail(409, `El usuario ${body.username} ya existe`)
    if (!db.userTypes.some((t) => t.userTypeId === Number(body.typeId)))
      return fail(400, `El rol ${body.typeId} no existe`)
    const user = {
      userId: db.nextUserId++,
      username: body.username,
      email: body.email,
      active: true,
    } as CurrentUser
    applyUserType(user, Number(body.typeId))
    db.users.push(user)
    return ok(publicUser(user), 'Usuario creado correctamente', 201)
  }),
  http.put('*/api/users/:id', async ({ params, request }) => {
    const user = db.users.find((u) => u.userId === Number(params.id))
    if (!user) return fail(404, `Usuario con ID ${params.id} no encontrado`)
    const actor = userFromRequest(request)
    const body = (await request.json()) as {
      username?: string
      email?: string
      typeId?: number
      active?: boolean
    }
    if (
      body.username &&
      body.username !== user.username &&
      db.users.some((u) => u.username === body.username)
    )
      return fail(409, `El usuario ${body.username} ya existe`)
    if (actor?.userId === user.userId) {
      if (body.active === false) return fail(409, 'No puedes desactivar tu propio usuario')
      const type = db.userTypes.find((t) => t.userTypeId === Number(body.typeId))
      if (type && type.role !== 'admin')
        return fail(409, 'No puedes quitarte el rol de administrador')
    }
    if (body.username) user.username = body.username
    if (body.email) user.email = body.email
    if (body.active !== undefined) user.active = body.active
    if (body.typeId) applyUserType(user, Number(body.typeId))
    return ok(publicUser(user), 'Usuario actualizado correctamente')
  }),
  http.delete('*/api/users/:id', ({ params, request }) => {
    const user = db.users.find((u) => u.userId === Number(params.id))
    if (!user) return fail(404, `Usuario con ID ${params.id} no encontrado`)
    if (userFromRequest(request)?.userId === user.userId)
      return fail(409, 'No puedes desactivar tu propio usuario')
    user.active = false
    return ok({ message: 'Usuario desactivado correctamente', id: user.userId })
  }),
  http.get('*/api/user-types', () => ok(db.userTypes)),
  http.post('*/api/user-types', async ({ request }) => {
    const body = (await request.json()) as Omit<UserType, 'userTypeId'>
    const type: UserType = { ...body, role: body.role ?? 'mesero', userTypeId: db.nextUserTypeId++ }
    db.userTypes.push(type)
    return ok(type, 'Tipo de usuario creado', 201)
  }),
  http.put('*/api/user-types/:id', async ({ params, request }) => {
    const type = db.userTypes.find((t) => t.userTypeId === Number(params.id))
    if (!type) return fail(404, 'Tipo de usuario no encontrado')
    const body = (await request.json()) as Partial<UserType>
    const actor = userFromRequest(request)
    if (body.role && body.role !== 'admin' && actor?.userTypeId === type.userTypeId)
      return fail(409, 'No puedes quitar el rol de administrador a tu propio tipo de usuario')
    Object.assign(type, body)
    for (const user of db.users.filter((u) => u.userTypeId === type.userTypeId))
      applyUserType(user, type.userTypeId)
    return ok(type, 'Tipo de usuario actualizado')
  }),
  http.delete('*/api/user-types/:id', ({ params }) => {
    const id = Number(params.id)
    const count = db.users.filter((u) => u.userTypeId === id).length
    if (count > 0)
      return fail(
        409,
        `El rol tiene ${count} ${count === 1 ? 'usuario asignado' : 'usuarios asignados'} y no se puede eliminar`,
      )
    db.userTypes = db.userTypes.filter((t) => t.userTypeId !== id)
    return ok({ message: 'Tipo de usuario eliminado correctamente', id })
  }),

  // ---------- Cajas ----------
  http.get('*/api/cash-registers', () => ok(db.cashRegisters)),
  http.post('*/api/cash-registers', async ({ request }) => {
    const { number } = (await request.json()) as { number: string }
    if (db.cashRegisters.some((c) => c.number === String(number)))
      return fail(409, `Ya existe la caja registradora ${number}`)
    const register = {
      cashRegisterId: db.nextCashRegisterId++,
      number: String(number),
      active: true,
    }
    db.cashRegisters.push(register)
    return ok(register, 'Caja registradora creada', 201)
  }),
  http.put('*/api/cash-registers/:id', async ({ params, request }) => {
    const register = db.cashRegisters.find((c) => c.cashRegisterId === Number(params.id))
    if (!register) return fail(404, 'Caja registradora no encontrada')
    const body = (await request.json()) as { number?: string; active?: boolean }
    if (
      body.number !== undefined &&
      body.number !== register.number &&
      db.cashRegisters.some((c) => c.number === String(body.number))
    )
      return fail(409, `Ya existe la caja registradora ${body.number}`)
    Object.assign(register, body)
    return ok(register)
  }),
  http.get('*/api/cash-registers/active', () => ok(db.cashRegisters.filter((c) => c.active))),

  // ---------- Mesas ----------
  http.get('*/api/tables', () => ok(db.tables)),
  http.get('*/api/tables/:id', ({ params }) => {
    const table = db.tables.find((t) => t.tableId === params.id)
    return table ? ok(table) : fail(404, `Mesa con ID ${String(params.id)} no encontrada`)
  }),
  http.post('*/api/tables', async ({ request }) => {
    const body = (await request.json()) as { tableId: string; zone: string }
    if (db.tables.some((t) => t.tableId === body.tableId))
      return fail(409, `La mesa con ID ${body.tableId} ya existe`)
    const table = { tableId: body.tableId, zone: body.zone, status: 'disponible' as const }
    db.tables.push(table)
    return ok(table, 'Mesa creada correctamente', 201)
  }),
  http.put('*/api/tables/:id', async ({ params, request }) => {
    const table = db.tables.find((t) => t.tableId === params.id)
    if (!table) return fail(404, `Mesa con ID ${String(params.id)} no encontrada`)
    Object.assign(table, (await request.json()) as { zone?: string })
    return ok(table)
  }),
  http.delete('*/api/tables/:id', ({ params }) => {
    const count = db.bills.filter((b) => b.tableId === params.id).length
    if (count > 0)
      return fail(
        409,
        `La mesa ${String(params.id)} tiene ${count} ${count === 1 ? 'factura asociada' : 'facturas asociadas'} y no se puede eliminar`,
      )
    db.tables = db.tables.filter((t) => t.tableId !== params.id)
    return ok({ message: 'Mesa eliminada correctamente', id: params.id })
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
    const from = query.get('from')
    const to = query.get('to')
    const mine = query.get('mine') === 'true' ? userFromRequest(request)?.userId : undefined
    const items = db.bills.filter(
      (b) =>
        (!status || b.status === status) &&
        (!tableId || b.tableId === tableId) &&
        (!orderType || b.orderType === orderType) &&
        (!from || new Date(b.date) >= new Date(from)) &&
        (!to || new Date(b.date) <= new Date(to)) &&
        (mine === undefined || b.waiterId === mine),
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
  http.post('*/api/bills/:id/void', ({ params }) => {
    const bill = findBill(params.id)
    if (!bill) return fail(404, 'Factura no encontrada')
    if (bill.status === 'void') return fail(409, `La factura ${bill.billId} ya está anulada`)
    bill.status = 'void'
    syncTable(bill.tableId)
    return ok(withWaiter(bill), 'Factura anulada correctamente')
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
        const name = db.products.find((p) => p.productId === item.productId)?.name
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
          unitPrice: db.products.find((p) => p.productId === item.productId)!.price,
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
