import * as bcrypt from "bcrypt";
import { DataSource, EntityManager } from "typeorm";
import { Bill } from "../../../core/entities/Bill";
import { BillDetails } from "../../../core/entities/BillDetails";
import { CashRegister } from "../../../core/entities/CashRegister";
import { Consumable } from "../../../core/entities/Consumable";
import { ConsumableType } from "../../../core/entities/ConsumableType";
import { Ingredient } from "../../../core/entities/Ingredient";
import { Product } from "../../../core/entities/Producto";
import { ProductType } from "../../../core/entities/ProductType";
import { Purchase } from "../../../core/entities/Purchase";
import { PurchaseDetail } from "../../../core/entities/PurchaseDetail";
import { Supplier } from "../../../core/entities/Supplier";
import { Table, TableStatus } from "../../../core/entities/Table";
import { User } from "../../../core/entities/User";
import { UserType } from "../../../core/entities/UserType";
import { OrderType } from "../../../core/enums/OrderType";
import { Role } from "../../../core/enums/Role";
import { Status } from "../../../core/enums/Status";
import { hashPin } from "../../security/pin";
import {
  CASH_REGISTERS,
  CONSUMABLE_TYPES,
  CONSUMABLES,
  CUSTOMER_NAMES,
  DEMO_PASSWORD,
  ENDS_LOW,
  INACTIVE_SUPPLIER,
  PRODUCT_TYPES,
  PRODUCTS,
  STAFF,
  SUPPLIERS,
  TABLES,
  USER_TYPES,
} from "./demoData";

export const DEMO_DAYS = 30;
const SEED = 20261002;

/** PRNG determinista (mulberry32): mismos datos en cada corrida para el mismo "hoy". */
const createRandom = (seed: number) => {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]!;
  const weighted = <T>(items: readonly T[], weight: (item: T) => number) => {
    const total = items.reduce((acc, item) => acc + weight(item), 0);
    let roll = next() * total;
    for (const item of items) {
      roll -= weight(item);
      if (roll <= 0) return item;
    }
    return items[items.length - 1]!;
  };
  return { next, int, pick, weighted };
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Día local de El Salvador (UTC-6, sin horario de verano). */
const svDay = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" }).format(date);
const shiftDay = (day: string, delta: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};
const at = (day: string, minutes: number) =>
  new Date(
    `${day}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00-06:00`,
  );

/** Horas pico de una cafetería: desayuno, almuerzo y café de la tarde. */
const HOUR_WEIGHTS: [number, number][] = [
  [7, 6], [8, 9], [9, 7], [10, 5], [11, 5], [12, 8], [13, 8],
  [14, 5], [15, 6], [16, 7], [17, 6], [18, 4], [19, 3],
];

type DraftBill = {
  waiterId: number;
  tableId: string | null;
  orderType: OrderType;
  customer: string;
  date: Date;
  status: Status;
  cashRegisterId: number | null;
  lines: { productId: number; quantity: number; unitPrice: number }[];
};

export type DemoSummary = {
  days: number;
  bills: number;
  byStatus: Record<string, number>;
  purchases: number;
  lowStock: string[];
  pins: { username: string; pin: string }[];
};

/**
 * Regenera la BD con 30 días de operación que terminan `now`. Borra todo antes.
 * El stock final es coherente: inicial + compras − consumo por receta.
 */
export async function runDemoSeed(ds: DataSource, now = new Date()): Promise<DemoSummary> {
  const rnd = createRandom(SEED);
  const today = svDay(now);
  const nowMinutes = (() => {
    const [h, m] = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/El_Salvador",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .format(now)
      .split(":")
      .map(Number);
    return h! * 60 + m!;
  })();

  const tables = ds.entityMetadatas.map((m) => `"${m.tableName}"`).join(", ");
  await ds.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);

  return ds.transaction(async (em) => {
    // ---------- Accesos ----------
    const types = await em.save(UserType, USER_TYPES.map((t) => em.create(UserType, t)));
    const typeOf = (role: Role) => types.find((t) => t.role === role)!.userTypeId;
    const password = await bcrypt.hash(DEMO_PASSWORD, 10);
    const users = await em.save(
      User,
      STAFF.map((s) =>
        em.create(User, {
          username: s.username,
          email: `${s.username}@estacioncafe.test`,
          password,
          userTypeId: typeOf(s.role),
          active: s.untilDaysAgo === undefined,
          pinHash: s.pin ? hashPin(s.pin) : null,
        }),
      ),
    );
    const userId = (username: string) => users.find((u) => u.username === username)!.userId;
    const staffOf = (role: Role) => STAFF.filter((s) => s.role === role);

    const registers = await em.save(CashRegister, CASH_REGISTERS.map((r) => em.create(CashRegister, r)));
    const activeRegisters = registers.filter((r) => r.active);

    // ---------- Inventario ----------
    const suppliers = await em.save(
      Supplier,
      [...SUPPLIERS.map((s) => ({ ...s, active: true })), { ...INACTIVE_SUPPLIER, active: false }].map(
        ({ name, phone, email, active }) => em.create(Supplier, { name, phone, email, active }),
      ),
    );
    const supplierId = (key: string) =>
      suppliers.find((s) => s.name === SUPPLIERS.find((x) => x.key === key)!.name)!.supplierId;
    const consumableTypes = await em.save(
      ConsumableType,
      CONSUMABLE_TYPES.map((name) => em.create(ConsumableType, { name })),
    );
    const consumables = await em.save(
      Consumable,
      CONSUMABLES.map((c) =>
        em.create(Consumable, {
          name: c.name,
          supplierId: supplierId(c.supplier),
          consumableTypeId: consumableTypes.find((t) => t.name === c.type)!.consumableTypeId,
          unitMeasurement: c.unit,
          cost: c.cost,
          minStock: c.minStock,
          quantity: 0,
          active: true,
        }),
      ),
    );
    const consumableId = (key: string) =>
      consumables[CONSUMABLES.findIndex((c) => c.key === key)]!.consumableId;
    const defOf = (id: number) => CONSUMABLES[consumables.findIndex((c) => c.consumableId === id)]!;

    // ---------- Catálogo ----------
    const productTypes = await em.save(
      ProductType,
      PRODUCT_TYPES.map((name) => em.create(ProductType, { name })),
    );
    const products = await em.save(
      Product,
      PRODUCTS.map((p) => {
        const recipeCost = p.recipe.reduce(
          (acc, [key, qty]) => acc + qty * CONSUMABLES.find((c) => c.key === key)!.cost,
          0,
        );
        return em.create(Product, {
          name: p.name,
          description: p.description,
          price: p.price,
          // Receta + merma y gastos menores
          cost: round2(recipeCost * 1.08 + 0.05),
          active: p.active ?? true,
          productTypeId: productTypes.find((t) => t.name === p.type)!.productTypeId,
        });
      }),
    );
    const recipes = new Map<number, { consumableId: number; quantity: number }[]>();
    const ingredients: Ingredient[] = [];
    PRODUCTS.forEach((def, i) => {
      const product = products[i]!;
      const lines = def.recipe.map(([key, quantity]) => ({ consumableId: consumableId(key), quantity }));
      recipes.set(product.productId, lines);
      for (const line of lines) {
        ingredients.push(
          em.create(Ingredient, {
            name: `${product.name} - ${defOf(line.consumableId).name}`,
            productId: product.productId,
            consumableId: line.consumableId,
            quantity: line.quantity,
          }),
        );
      }
    });
    await em.save(Ingredient, ingredients);
    const sellable = PRODUCTS.map((def, i) => ({ def, product: products[i]! })).filter(
      (p) => p.def.popularity > 0,
    );

    await em.save(Table, TABLES.map((t) => em.create(Table, { ...t, status: TableStatus.DISPONIBLE })));

    // ---------- Ventas ----------
    const lines = () => {
      const count = rnd.weighted([1, 2, 3, 4], (n) => [5, 4, 2, 1][n - 1]!);
      const chosen = new Map<number, number>();
      while (chosen.size < count) {
        const { product } = rnd.weighted(sellable, (p) => p.def.popularity);
        chosen.set(product.productId, rnd.weighted([1, 2, 3], (q) => [8, 3, 1][q - 1]!));
      }
      return [...chosen].map(([productId, quantity]) => ({
        productId,
        quantity,
        unitPrice: products.find((p) => p.productId === productId)!.price,
      }));
    };
    const waitersOn = (daysAgo: number) =>
      staffOf(Role.MESERO).filter((s) => s.untilDaysAgo === undefined || daysAgo >= s.untilDaysAgo);
    const customer = (orderType: OrderType) =>
      orderType === OrderType.TAKEAWAY || rnd.next() < 0.5 ? rnd.pick(CUSTOMER_NAMES) : "Cuenta 1";

    const drafts: DraftBill[] = [];
    for (let daysAgo = DEMO_DAYS - 1; daysAgo >= 0; daysAgo--) {
      const day = shiftDay(today, -daysAgo);
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      const factor = weekday === 0 || weekday === 6 ? 1.35 : weekday === 5 ? 1.15 : 1;
      const count = Math.round(48 * factor * (0.85 + rnd.next() * 0.3));
      const waiters = waitersOn(daysAgo);
      const onShift = waiters.filter(() => rnd.next() < 0.8);
      const team = onShift.length ? onShift : waiters;

      for (let i = 0; i < count; i++) {
        const hour = rnd.weighted(HOUR_WEIGHTS, ([, w]) => w)[0];
        const minutes = hour * 60 + rnd.int(0, 59);
        // Hoy: lo cerrado termina hace al menos una hora; lo activo se agrega aparte
        if (daysAgo === 0 && minutes > nowMinutes - 60) continue;
        const takeaway = rnd.next() < 0.3;
        const orderType = takeaway ? OrderType.TAKEAWAY : OrderType.DINE_IN;
        const waiter = takeaway && rnd.next() < 0.7 ? rnd.pick(staffOf(Role.CAJERO)) : rnd.pick(team);
        const voided = rnd.next() < 0.02;
        drafts.push({
          waiterId: userId(waiter.username),
          tableId: takeaway ? null : rnd.pick(TABLES).tableId,
          orderType,
          customer: customer(orderType),
          date: at(day, minutes),
          status: voided ? Status.VOID : takeaway ? Status.FINISHED : Status.CLOSED,
          cashRegisterId: rnd.pick(activeRegisters).cashRegisterId,
          lines: lines(),
        });
      }
    }

    // Hoy en curso: varias mesas atendidas (una compartida), borradores y para llevar en cada etapa
    const recent = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000);
    const live: Omit<DraftBill, "lines" | "orderType" | "cashRegisterId">[] = [
      { waiterId: userId("mesero.demo"), tableId: "I1", customer: "Familia Rivas", date: recent(48), status: Status.OPEN },
      { waiterId: userId("mesero.demo"), tableId: "I2", customer: "Cuenta 1", date: recent(35), status: Status.OPEN },
      { waiterId: userId("ana.lopez"), tableId: "I2", customer: "Cuenta 2", date: recent(30), status: Status.OPEN },
      { waiterId: userId("ana.lopez"), tableId: "T1", customer: "Marta", date: recent(25), status: Status.OPEN },
      { waiterId: userId("luis.martinez"), tableId: "T3", customer: "Reunión de equipo", date: recent(40), status: Status.OPEN },
      { waiterId: userId("sofia.ramirez"), tableId: "B1", customer: "Jorge", date: recent(12), status: Status.OPEN },
      { waiterId: userId("diego.hernandez"), tableId: "I4", customer: "Cuenta 1", date: recent(6), status: Status.DRAFT },
    ];
    for (const bill of live) {
      drafts.push({ ...bill, orderType: OrderType.DINE_IN, cashRegisterId: null, lines: lines() });
    }
    const takeawayToday: [Status, string, number, number | null][] = [
      [Status.DRAFT, "Valeria", 4, null],
      [Status.OPEN, "Andrés", 9, null],
      [Status.OPEN, "Lucía", 15, null],
      [Status.CLOSED, "Ricardo", 7, activeRegisters[0]!.cashRegisterId],
      [Status.CLOSED, "Camila", 3, activeRegisters[1]!.cashRegisterId],
    ];
    for (const [status, name, minutesAgo, registerId] of takeawayToday) {
      drafts.push({
        waiterId: userId(rnd.pick(staffOf(Role.CAJERO)).username),
        tableId: null,
        orderType: OrderType.TAKEAWAY,
        customer: name,
        date: recent(minutesAgo),
        status,
        cashRegisterId: registerId,
        lines: lines(),
      });
    }
    drafts.sort((a, b) => a.date.getTime() - b.date.getTime());

    await insertBills(em, drafts);
    // TypeORM ignora valores propios en CreateDateColumn al insertar: se alinean con la fecha
    await em.query(`UPDATE bills SET created_at = date, updated_at = date`);

    // Mesas ocupadas según sus cuentas activas; una reservada para la noche
    const occupied = new Set(
      drafts.filter((b) => b.tableId && (b.status === Status.OPEN || b.status === Status.DRAFT)).map((b) => b.tableId!),
    );
    for (const tableId of occupied) await em.update(Table, { tableId }, { status: TableStatus.OCUPADA });
    await em.update(Table, { tableId: "T5" }, { status: TableStatus.RESERVADA });

    // ---------- Compras y stock ----------
    const usageByDay = new Map<string, Map<number, number>>();
    for (const bill of drafts) {
      const day = svDay(bill.date);
      const usage = usageByDay.get(day) ?? new Map<number, number>();
      for (const line of bill.lines) {
        for (const ing of recipes.get(line.productId) ?? []) {
          usage.set(ing.consumableId, (usage.get(ing.consumableId) ?? 0) + ing.quantity * line.quantity);
        }
      }
      usageByDay.set(day, usage);
    }
    const usageBetween = (fromDaysAgo: number, toDaysAgo: number, id: number) => {
      let total = 0;
      for (let d = fromDaysAgo; d >= toDaysAgo; d--) total += usageByDay.get(shiftDay(today, -d))?.get(id) ?? 0;
      return total;
    };

    const avgDaily = (id: number) => usageBetween(DEMO_DAYS - 1, 0, id) / DEMO_DAYS;
    const stock = new Map(consumables.map((c) => [c.consumableId, Math.ceil(c.minStock * 1.5)]));
    const cost = new Map(consumables.map((c) => [c.consumableId, c.cost]));
    const purchases: { date: Date; supplierId: number; cashRegisterId: number | null; details: { consumableId: number; quantity: number; unitCost: number }[] }[] = [];
    const buy = (date: Date, supplier: number, items: { consumableId: number; quantity: number }[]) => {
      if (items.length === 0) return;
      const details = items.map(({ consumableId: id, quantity }) => {
        const base = CONSUMABLES[consumables.findIndex((c) => c.consumableId === id)]!.cost;
        const unitCost = Math.round(base * (0.95 + rnd.next() * 0.12) * 10000) / 10000;
        stock.set(id, round3(stock.get(id)! + quantity));
        cost.set(id, unitCost);
        return { consumableId: id, quantity, unitCost };
      });
      purchases.push({
        date,
        supplierId: supplier,
        cashRegisterId: rnd.next() < 0.5 ? rnd.pick(activeRegisters).cashRegisterId : null,
        details,
      });
    };
    // Compras semanales: hace 29, 22, 15, 8 y 1 días; la última es la que "se olvida" en ENDS_LOW
    const LAST_WEEKLY = (DEMO_DAYS - 1) % 7;

    for (let daysAgo = DEMO_DAYS - 1; daysAgo >= 0; daysAgo--) {
      const day = shiftDay(today, -daysAgo);
      const weekly = (DEMO_DAYS - 1 - daysAgo) % 7 === 0;
      for (const supplier of SUPPLIERS) {
        const items: { consumableId: number; quantity: number }[] = [];
        for (const c of consumables) {
          const def = defOf(c.consumableId);
          if (def.supplier !== supplier.key) continue;
          const isLast = daysAgo === LAST_WEEKLY;
          // Se compra para la semana completa (consumo promedio), aunque el mes termine antes
          const windowUse = usageBetween(daysAgo, Math.max(daysAgo - 6, 0), c.consumableId);
          const need = Math.max(windowUse, avgDaily(c.consumableId) * 7);
          const dayUse = usageByDay.get(day)?.get(c.consumableId) ?? 0;
          if (weekly && !(isLast && ENDS_LOW.includes(def.key))) {
            // Antes de la compra "olvidada", los de ENDS_LOW se piden sin colchón
            const lean = ENDS_LOW.includes(def.key) && daysAgo === LAST_WEEKLY + 7;
            const target = lean ? windowUse : need * 1.15 + c.minStock * 1.2;
            const quantity = Math.ceil(target - stock.get(c.consumableId)!);
            if (quantity > 0) items.push({ consumableId: c.consumableId, quantity });
          } else if (stock.get(c.consumableId)! < dayUse) {
            // Compra de emergencia: solo lo justo para no quedar en negativo
            items.push({ consumableId: c.consumableId, quantity: Math.ceil(dayUse - stock.get(c.consumableId)!) + 1 });
          }
        }
        buy(at(day, 6 * 60 + 30), supplierId(supplier.key), items);
      }
      for (const [id, used] of usageByDay.get(day) ?? []) stock.set(id, round3(stock.get(id)! - used));
    }

    // Gastos sin inventario (mantenimiento, servicios)
    const expenses: [number, string, number][] = [
      [20, "cafe", 45],
      [12, "empaques", 18.5],
      [4, "cafe", 32.75],
    ];

    for (const p of purchases) {
      const saved = await em.save(
        Purchase,
        em.create(Purchase, {
          date: p.date,
          supplierId: p.supplierId,
          cashRegisterId: p.cashRegisterId,
          total: round2(p.details.reduce((acc, d) => acc + d.quantity * d.unitCost, 0)),
        }),
      );
      await em.insert(
        PurchaseDetail,
        p.details.map((d) => ({
          purchaseId: saved.purchaseId!,
          consumableId: d.consumableId,
          quantity: d.quantity,
          unitCost: d.unitCost,
          subTotal: round2(d.quantity * d.unitCost),
        })),
      );
    }
    for (const [daysAgo, key, total] of expenses) {
      await em.save(
        Purchase,
        em.create(Purchase, { date: at(shiftDay(today, -daysAgo), 10 * 60), supplierId: supplierId(key), cashRegisterId: null, total }),
      );
    }

    for (const c of consumables) {
      await em.update(Consumable, { consumableId: c.consumableId }, { quantity: stock.get(c.consumableId)!, cost: cost.get(c.consumableId)! });
    }

    const byStatus: Record<string, number> = {};
    for (const b of drafts) byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;

    return {
      days: DEMO_DAYS,
      bills: drafts.length,
      byStatus,
      purchases: purchases.length + expenses.length,
      lowStock: consumables.filter((c) => stock.get(c.consumableId)! <= c.minStock).map((c) => c.name),
      pins: STAFF.filter((s) => s.pin && s.untilDaysAgo === undefined).map((s) => ({ username: s.username, pin: s.pin! })),
    };
  });
}

/** Inserta cuentas y líneas en lote. */
async function insertBills(em: EntityManager, drafts: DraftBill[]) {
  const CHUNK = 400;
  for (let i = 0; i < drafts.length; i += CHUNK) {
    const chunk = drafts.slice(i, i + CHUNK);
    const result = await em.insert(
      Bill,
      chunk.map((b) => ({
        waiterId: b.waiterId,
        tableId: b.tableId,
        orderType: b.orderType,
        customer: b.customer,
        date: b.date,
        status: b.status,
        cashRegisterId: b.cashRegisterId,
        total: round2(b.lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0)),
      })),
    );
    const details = chunk.flatMap((b, j) =>
      b.lines.map((l) => ({
        billId: result.identifiers[j]!.billId as number,
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        subTotal: round2(l.quantity * l.unitPrice),
      })),
    );
    await em.insert(BillDetails, details);
  }
}
