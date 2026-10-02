import type { Bill } from '@/api/generated/model/bill'
import type { CashRegister } from '@/api/generated/model/cashRegister'
import type { ProductType } from '@/api/generated/model/productType'
import type { Table } from '@/api/generated/model/table'
import { products, users } from './data'

type DetailRow = {
  billDetailId: number
  billId: number
  productId: number
  quantity: number
  unitPrice: number
}

/** Estado en memoria que imita la API (reglas principales de cuentas y mesas). */
const seed = () => ({
  tables: [
    { tableId: 'A1', zone: 'Interior', status: 'ocupada' },
    { tableId: 'A2', zone: 'Interior', status: 'disponible' },
    { tableId: 'T1', zone: 'Terraza', status: 'reservada' },
  ] as Table[],
  productTypes: [
    { productTypeId: 1, name: 'Café caliente' },
    { productTypeId: 2, name: 'Bebidas frías' },
    { productTypeId: 3, name: 'Panadería' },
  ] as ProductType[],
  cashRegisters: [{ cashRegisterId: 1, number: '001', active: true }] as CashRegister[],
  bills: [
    {
      billId: 1,
      waiterId: 2,
      cashRegisterId: null,
      tableId: 'A1',
      orderType: 'dine_in',
      customer: 'Ana',
      date: new Date(Date.now() - 25 * 60_000).toISOString(),
      total: 5,
      status: 'open',
    },
    {
      billId: 2,
      waiterId: 1,
      cashRegisterId: 1,
      tableId: null,
      orderType: 'takeaway',
      customer: 'Luis',
      date: new Date(Date.now() - 10 * 60_000).toISOString(),
      total: 4,
      status: 'closed',
    },
    {
      billId: 3,
      waiterId: 2,
      cashRegisterId: 1,
      tableId: 'A2',
      orderType: 'dine_in',
      customer: 'Marta',
      date: new Date(Date.now() - 5 * 60_000).toISOString(),
      total: 2.5,
      status: 'closed',
    },
  ] as Bill[],
  details: [
    { billDetailId: 1, billId: 1, productId: 1, quantity: 2, unitPrice: 2.5 },
    { billDetailId: 2, billId: 2, productId: 2, quantity: 1, unitPrice: 4 },
    { billDetailId: 3, billId: 3, productId: 1, quantity: 1, unitPrice: 2.5 },
  ] as DetailRow[],
  /** Unidades disponibles por producto (simula el stock de la receta). */
  stock: { 3: 2 } as Record<number, number>,
  nextBillId: 4,
  nextDetailId: 4,
})

export let db = seed()
export const resetDb = () => {
  db = seed()
}

const ACTIVE = ['open', 'draft']

export const withWaiter = (bill: Bill): Bill => ({
  ...bill,
  waiter: users.find((u) => u.userId === bill.waiterId),
  cashRegister: db.cashRegisters.find((c) => c.cashRegisterId === bill.cashRegisterId) ?? null,
})

export const recalcTotal = (billId: number) => {
  const bill = db.bills.find((b) => b.billId === billId)
  if (bill) {
    bill.total = db.details
      .filter((d) => d.billId === billId)
      .reduce((acc, d) => acc + d.quantity * d.unitPrice, 0)
  }
}

export const syncTable = (tableId: string | null | undefined) => {
  const table = db.tables.find((t) => t.tableId === tableId)
  if (!table) return
  const active = db.bills.some((b) => b.tableId === tableId && ACTIVE.includes(b.status))
  if (active) table.status = 'ocupada'
  else if (table.status === 'ocupada') table.status = 'disponible'
}

export const linesOf = (billId: number) =>
  db.details
    .filter((d) => d.billId === billId)
    .map((d) => ({
      billDetailId: d.billDetailId,
      productId: d.productId,
      name: products.find((p) => p.productId === d.productId)?.name ?? '',
      quantity: d.quantity,
      price: d.unitPrice,
      subTotal: d.quantity * d.unitPrice,
    }))

export const isActive = (bill: Bill) => ACTIVE.includes(bill.status)
