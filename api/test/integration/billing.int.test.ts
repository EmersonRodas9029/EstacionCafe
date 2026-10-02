import { DataSource } from "typeorm";
import { closeTestDatabase, resetTables, setupTestDatabase } from "./db";
import { BillService } from "../../application/services/BillService";
import { BillDetailsService } from "../../application/services/BillDetailsService";
import { Bill } from "../../core/entities/Bill";
import { BillDetails } from "../../core/entities/BillDetails";
import { CashRegister } from "../../core/entities/CashRegister";
import { Consumable } from "../../core/entities/Consumable";
import { ConsumableType } from "../../core/entities/ConsumableType";
import { Ingredient } from "../../core/entities/Ingredient";
import { Product } from "../../core/entities/Producto";
import { ProductType } from "../../core/entities/ProductType";
import { Supplier } from "../../core/entities/Supplier";
import { Table, TableStatus } from "../../core/entities/Table";
import { User } from "../../core/entities/User";
import { UserType } from "../../core/entities/UserType";
import { OrderType } from "../../core/enums/OrderType";
import { Role } from "../../core/enums/Role";
import { Status } from "../../core/enums/Status";
import { UnitMeasurement } from "../../core/enums/UnitMeasurement";

let ds: DataSource;
let bills: BillService;
let details: BillDetailsService;

// Datos base de cada prueba
let waiter: User;
let register: CashRegister;
let latte: Product;
let croissant: Product;
let milk: Consumable;

const stockOf = async (consumable: Consumable) =>
  (await ds.getRepository(Consumable).findOneByOrFail({
    consumableId: consumable.consumableId,
  })).quantity;

const reload = (billId: number) =>
  ds.getRepository(Bill).findOneByOrFail({ billId });

const tableStatus = async (tableId: string) =>
  (await ds.getRepository(Table).findOneByOrFail({ tableId })).status;

const openTableBill = (tableId = "M1", customer = "Cuenta 1") =>
  bills.save({
    customer,
    tableId,
    orderType: OrderType.DINE_IN,
    waiterId: waiter.userId,
  });

beforeAll(async () => {
  ds = await setupTestDatabase();
  bills = new BillService(ds.getRepository(Bill));
  details = new BillDetailsService(ds.getRepository(BillDetails), bills);
});

afterAll(closeTestDatabase);

beforeEach(async () => {
  await resetTables();

  const type = await ds
    .getRepository(UserType)
    .save({ name: "Mesero", permissionLevel: 3, role: Role.MESERO });
  waiter = await ds.getRepository(User).save({
    username: "mesero",
    password: "x",
    email: "m@test.com",
    userTypeId: type.userTypeId,
    active: true,
  });
  register = await ds
    .getRepository(CashRegister)
    .save({ number: "001", active: true });
  await ds.getRepository(Table).save([
    { tableId: "M1", zone: "Interior", status: TableStatus.DISPONIBLE },
    { tableId: "M2", zone: "Terraza", status: TableStatus.DISPONIBLE },
  ]);

  const supplier = await ds
    .getRepository(Supplier)
    .save({ name: "Proveedor", phone: "22223333", email: "p@test.com" });
  const consumableType = await ds
    .getRepository(ConsumableType)
    .save({ name: "Lácteos" });
  milk = await ds.getRepository(Consumable).save({
    name: "Leche",
    supplierId: supplier.supplierId,
    consumableTypeId: consumableType.consumableTypeId,
    quantity: 1,
    unitMeasurement: UnitMeasurement.LITER,
    cost: 1,
    active: true,
  });

  const productType = await ds
    .getRepository(ProductType)
    .save({ name: "Bebidas" });
  [latte, croissant] = await ds.getRepository(Product).save([
    {
      name: "Latte",
      description: "Café con leche",
      price: 3.5,
      cost: 1,
      active: true,
      productTypeId: productType.productTypeId,
    },
    {
      name: "Croissant",
      description: "Pan",
      price: 2.25,
      cost: 1,
      active: true,
      productTypeId: productType.productTypeId,
    },
  ]);
  // 0.25 L de leche por latte → alcanza para 4
  await ds.getRepository(Ingredient).save({
    name: "Latte - leche",
    quantity: 0.25,
    productId: latte.productId,
    consumableId: milk.consumableId,
  });
});

describe("Cuentas (BillService)", () => {
  it("abrir una cuenta en mesa la ocupa y guarda al mesero", async () => {
    const bill = await openTableBill();

    expect(bill.waiterId).toBe(waiter.userId);
    expect(bill.status).toBe(Status.OPEN);
    expect(bill.total).toBe(0);
    expect(await tableStatus("M1")).toBe(TableStatus.OCUPADA);
  });

  it("varias cuentas en la misma mesa; la mesa se libera al cerrar todas", async () => {
    await openTableBill("M1", "Ana");
    await openTableBill("M1", "Luis");

    const result = await bills.closeBillsByTable("M1", register.cashRegisterId);

    expect(result.updated).toBe(2);
    const closed = await bills.getBillsByTable("M1");
    expect(closed.every((b) => b.status === Status.CLOSED)).toBe(true);
    expect(closed.every((b) => b.cashRegisterId === register.cashRegisterId)).toBe(true);
    expect(await tableStatus("M1")).toBe(TableStatus.DISPONIBLE);
  });

  it("no se puede cerrar una cuenta sin caja", async () => {
    const bill = await openTableBill();

    await expect(
      bills.update({ billId: bill.billId, status: Status.CLOSED }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("cerrar una de dos cuentas mantiene la mesa ocupada", async () => {
    const a = await openTableBill("M1", "Ana");
    await openTableBill("M1", "Luis");

    await bills.update({
      billId: a.billId,
      status: Status.CLOSED,
      cashRegisterId: register.cashRegisterId,
    });

    expect(await tableStatus("M1")).toBe(TableStatus.OCUPADA);
  });

  it("mover la cuenta a otra mesa libera la anterior", async () => {
    const bill = await openTableBill("M1");

    await bills.update({ billId: bill.billId, tableId: "M2" });

    expect(await tableStatus("M1")).toBe(TableStatus.DISPONIBLE);
    expect(await tableStatus("M2")).toBe(TableStatus.OCUPADA);
  });

  it("orden para llevar no ocupa mesa y se filtra por tipo", async () => {
    await bills.save({
      customer: "Para llevar",
      orderType: OrderType.TAKEAWAY,
      waiterId: waiter.userId,
    });
    await openTableBill();

    const { items, total } = await bills.find({
      orderType: OrderType.TAKEAWAY,
    });

    expect(total).toBe(1);
    expect(items[0]!.tableId).toBeNull();
    expect(items[0]!.waiter.username).toBe("mesero");
    expect((items[0]!.waiter as any).password).toBeUndefined();
  });

  it("pagina resultados", async () => {
    for (let i = 0; i < 5; i++) await openTableBill("M1", `C${i}`);

    const page = await bills.find({ page: 2, limit: 2 });

    expect(page.total).toBe(5);
    expect(page.items).toHaveLength(2);
  });

  it("rechaza mesa inexistente o caja inactiva", async () => {
    await expect(openTableBill("Z9")).rejects.toMatchObject({ statusCode: 400 });

    await ds
      .getRepository(CashRegister)
      .update({ cashRegisterId: register.cashRegisterId }, { active: false });
    const bill = await openTableBill();
    await expect(
      bills.update({
        billId: bill.billId,
        cashRegisterId: register.cashRegisterId,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("anular una cuenta abierta devuelve el stock", async () => {
    const bill = await openTableBill();
    await details.saveAll({
      billId: bill.billId!,
      billDetails: [{ productId: latte.productId, quantity: 2 }],
    });
    expect(await stockOf(milk)).toBeCloseTo(0.5);

    await bills.delete(bill.billId!);

    expect(await stockOf(milk)).toBeCloseTo(1);
    expect(await tableStatus("M1")).toBe(TableStatus.DISPONIBLE);
  });
});

describe("Anulación", () => {
  it("anular una cuenta abierta devuelve stock, libera la mesa y conserva las líneas", async () => {
    const bill = await openTableBill();
    await details.saveAll({
      billId: bill.billId!,
      billDetails: [{ productId: latte.productId, quantity: 2 }],
    });

    const voided = await bills.void(bill.billId!);

    expect(voided.status).toBe(Status.VOID);
    expect(await stockOf(milk)).toBeCloseTo(1);
    expect(await tableStatus("M1")).toBe(TableStatus.DISPONIBLE);
    expect(await details.getById(bill.billId!)).toHaveLength(1);
  });

  it("anular una cuenta cobrada no devuelve stock y no se puede repetir ni editar", async () => {
    const bill = await openTableBill();
    await details.saveAll({
      billId: bill.billId!,
      billDetails: [{ productId: latte.productId, quantity: 2 }],
    });
    await bills.closeBillsByTable("M1", register.cashRegisterId);

    await bills.void(bill.billId!);

    expect(await stockOf(milk)).toBeCloseTo(0.5);
    await expect(bills.void(bill.billId!)).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      bills.update({ billId: bill.billId, customer: "Otro" }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("no se puede anular con PUT ni eliminar una cuenta cobrada", async () => {
    const bill = await openTableBill();
    await expect(
      bills.update({ billId: bill.billId, status: Status.VOID }),
    ).rejects.toMatchObject({ statusCode: 400 });

    await bills.closeBillsByTable("M1", register.cashRegisterId);
    await expect(bills.delete(bill.billId!)).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("Detalles (BillDetailsService)", () => {
  it("agrega productos con precio del servidor, descuenta stock y calcula total", async () => {
    const bill = await openTableBill();

    const saved = await details.saveAll({
      billId: bill.billId!,
      billDetails: [
        { productId: latte.productId, quantity: 2 },
        { productId: croissant.productId, quantity: 1 },
      ],
    });

    expect(saved).toHaveLength(2);
    expect(saved.find((d) => d.productId === latte.productId)).toMatchObject({
      unitPrice: 3.5,
      subTotal: 7,
    });
    expect((await reload(bill.billId!)).total).toBe(9.25);
    expect(await stockOf(milk)).toBeCloseTo(0.5);
  });

  it("agregar el mismo producto suma a la línea existente", async () => {
    const bill = await openTableBill();
    const input = {
      billId: bill.billId!,
      billDetails: [{ productId: latte.productId, quantity: 1 }],
    };

    await details.saveAll(input);
    await details.saveAll(input);

    const lines = await details.getById(bill.billId!);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.quantity).toBe(2);
    expect((await reload(bill.billId!)).total).toBe(7);
  });

  it("conserva el precio de venta aunque cambie el producto", async () => {
    const bill = await openTableBill();
    await details.saveAll({
      billId: bill.billId!,
      billDetails: [{ productId: latte.productId, quantity: 1 }],
    });

    await ds
      .getRepository(Product)
      .update({ productId: latte.productId }, { price: 9 });

    const [line] = await details.getById(bill.billId!);
    expect(line!.unitPrice).toBe(3.5);
  });

  it("stock insuficiente: error tipado y no guarda nada", async () => {
    const bill = await openTableBill();

    await expect(
      details.saveAll({
        billId: bill.billId!,
        billDetails: [{ productId: latte.productId, quantity: 5 }],
      }),
    ).rejects.toMatchObject({ statusCode: 400, type: "stock_error" });

    expect(await details.getById(bill.billId!)).toHaveLength(0);
    expect(await stockOf(milk)).toBeCloseTo(1);
  });

  it("PATCH cambia la cantidad y ajusta stock y total por la diferencia", async () => {
    const bill = await openTableBill();
    const [line] = await details.saveAll({
      billId: bill.billId!,
      billDetails: [{ productId: latte.productId, quantity: 3 }],
    });

    await details.update({ billDetailId: line!.billDetailId, quantity: 1 });

    expect(await stockOf(milk)).toBeCloseTo(0.75);
    expect((await reload(bill.billId!)).total).toBe(3.5);
  });

  it("eliminar una línea devuelve stock y recalcula total", async () => {
    const bill = await openTableBill();
    const saved = await details.saveAll({
      billId: bill.billId!,
      billDetails: [
        { productId: latte.productId, quantity: 2 },
        { productId: croissant.productId, quantity: 1 },
      ],
    });
    const latteLine = saved.find((d) => d.productId === latte.productId)!;

    await details.delete(latteLine.billDetailId);

    expect(await stockOf(milk)).toBeCloseTo(1);
    expect((await reload(bill.billId!)).total).toBe(2.25);
  });

  it("no permite modificar una cuenta cerrada", async () => {
    const bill = await openTableBill();
    await bills.update({
      billId: bill.billId,
      status: Status.CLOSED,
      cashRegisterId: register.cashRegisterId,
    });

    await expect(
      details.saveAll({
        billId: bill.billId!,
        billDetails: [{ productId: croissant.productId, quantity: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rechaza productos inactivos", async () => {
    const bill = await openTableBill();
    await ds
      .getRepository(Product)
      .update({ productId: croissant.productId }, { active: false });

    await expect(
      details.saveAll({
        billId: bill.billId!,
        billDetails: [{ productId: croissant.productId, quantity: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
