import { DataSource } from "typeorm";
import { closeTestDatabase, resetTables, setupTestDatabase } from "./db";
import { BillService } from "../../application/services/BillService";
import { BillDetailsService } from "../../application/services/BillDetailsService";
import { TableService } from "../../application/services/TableService";
import { Bill } from "../../core/entities/Bill";
import { BillDetails } from "../../core/entities/BillDetails";
import { CashRegister } from "../../core/entities/CashRegister";
import { Product } from "../../core/entities/Producto";
import { ProductType } from "../../core/entities/ProductType";
import { Table, TableStatus } from "../../core/entities/Table";
import { User } from "../../core/entities/User";
import { UserType } from "../../core/entities/UserType";
import { OrderType } from "../../core/enums/OrderType";
import { Role } from "../../core/enums/Role";
import { Status } from "../../core/enums/Status";
import { PaymentMethod } from "../../core/enums/PaymentMethod";
import { ReportService } from "../../application/services/ReportService";
import { Consumable } from "../../core/entities/Consumable";
import { ConsumableType } from "../../core/entities/ConsumableType";
import { Ingredient } from "../../core/entities/Ingredient";
import { Supplier } from "../../core/entities/Supplier";
import { UnitMeasurement } from "../../core/enums/UnitMeasurement";

let ds: DataSource;
let bills: BillService;
let details: BillDetailsService;
let tables: TableService;
let ana: { userId: number; role: Role };
let luis: { userId: number; role: Role };
let caja: { userId: number; role: Role };
let register: CashRegister;
let latte: Product;

const tableStatus = async (tableId: string) =>
  (await ds.getRepository(Table).findOneByOrFail({ tableId })).status;

const open = (who: { userId: number }, customer: string, tableId = "M1") =>
  bills.save({ customer, tableId, orderType: OrderType.DINE_IN, waiterId: who.userId });

beforeAll(async () => {
  ds = await setupTestDatabase();
  bills = new BillService(ds.getRepository(Bill));
  details = new BillDetailsService(ds.getRepository(BillDetails), bills);
  tables = new TableService(ds.getRepository(Table));
});
afterAll(closeTestDatabase);

beforeEach(async () => {
  await resetTables();
  const types = ds.getRepository(UserType);
  const [mesero, cajero] = await types.save([
    { name: "Mesero", permissionLevel: 3, role: Role.MESERO },
    { name: "Cajero", permissionLevel: 5, role: Role.CAJERO },
  ]);
  const users = await ds.getRepository(User).save([
    { username: "ana", password: "x", email: "a@t.sv", userTypeId: mesero!.userTypeId, active: true },
    { username: "luis", password: "x", email: "l@t.sv", userTypeId: mesero!.userTypeId, active: true },
    { username: "caja", password: "x", email: "c@t.sv", userTypeId: cajero!.userTypeId, active: true },
  ]);
  ana = { userId: users[0]!.userId, role: Role.MESERO };
  luis = { userId: users[1]!.userId, role: Role.MESERO };
  caja = { userId: users[2]!.userId, role: Role.CAJERO };
  register = await ds.getRepository(CashRegister).save({ number: "001", active: true });
  await ds.getRepository(Table).save([
    { tableId: "M1", zone: "Interior", status: TableStatus.DISPONIBLE },
    { tableId: "M2", zone: "Terraza", status: TableStatus.DISPONIBLE },
  ]);
  const type = await ds.getRepository(ProductType).save({ name: "Bebidas" });
  latte = await ds.getRepository(Product).save({
    name: "Latte",
    description: "Café con leche",
    price: 3.5,
    cost: 1,
    active: true,
    productTypeId: type.productTypeId,
  });
});

describe("Privacidad de cuentas", () => {
  it("cada mesero lista solo sus cuentas; el cajero ve todas", async () => {
    await open(ana, "Mesa de Ana");
    await open(luis, "Mesa de Luis", "M2");

    const forAna = await bills.find({}, ana);
    expect(forAna.items.map((b) => b.customer)).toEqual(["Mesa de Ana"]);
    // Pedir las de otro mesero no sirve: el filtro lo impone el rol
    expect((await bills.find({ waiterId: luis.userId }, ana)).items).toHaveLength(1);
    expect((await bills.find({ waiterId: luis.userId }, ana)).items[0]!.waiterId).toBe(ana.userId);
    expect((await bills.find({}, caja)).total).toBe(2);
    expect(await bills.getBillsByTable("M2", ana)).toHaveLength(0);
  });

  it("una cuenta ajena responde 404 al leerla, editarla o tocar sus líneas", async () => {
    const luisBill = await open(luis, "Luis");
    const [line] = await details.saveAll(
      { billId: luisBill.billId!, billDetails: [{ productId: latte.productId, quantity: 1 }] },
      luis,
    );

    await expect(bills.getById(luisBill.billId!, ana)).rejects.toMatchObject({ statusCode: 404 });
    await expect(bills.update({ billId: luisBill.billId, customer: "x" }, ana)).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(details.getById(luisBill.billId!, ana)).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      details.saveAll({ billId: luisBill.billId!, billDetails: [{ productId: latte.productId, quantity: 1 }] }, ana),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(details.update({ billDetailId: line!.billDetailId, quantity: 3 }, ana)).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(details.delete(line!.billDetailId, ana)).rejects.toMatchObject({ statusCode: 404 });

    // El cajero sí puede
    expect((await bills.getById(luisBill.billId!, caja)).customer).toBe("Luis");
    expect(await details.getById(luisBill.billId!, caja)).toHaveLength(1);
  });

  it("el mesero no cobra; el cajero cobra la mesa compartida y la libera", async () => {
    await open(ana, "Ana");
    await open(luis, "Luis");

    await expect(bills.closeBillsByTable("M1", register.cashRegisterId, ana)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(await tableStatus("M1")).toBe(TableStatus.OCUPADA);

    const result = await bills.closeBillsByTable("M1", register.cashRegisterId, caja);
    expect(result.updated).toBe(2);
    expect(await tableStatus("M1")).toBe(TableStatus.DISPONIBLE);
  });

  it("el mapa muestra quién atiende cada mesa, pero montos solo propios", async () => {
    const anaBill = await open(ana, "Ana");
    await details.saveAll(
      { billId: anaBill.billId!, billDetails: [{ productId: latte.productId, quantity: 2 }] },
      ana,
    );
    const luisBill = await open(luis, "Luis");
    await details.saveAll(
      { billId: luisBill.billId!, billDetails: [{ productId: latte.productId, quantity: 1 }] },
      luis,
    );

    const forLuis = (await tables.board(luis)).find((t) => t.tableId === "M1")!;
    expect(forLuis.attendedBy.map((w) => w.username)).toEqual(["ana", "luis"]);
    expect(forLuis.mine).toEqual({ bills: 1, total: 3.5 });
    expect(forLuis.all).toBeUndefined();

    const forCaja = (await tables.board(caja)).find((t) => t.tableId === "M1")!;
    expect(forCaja.mine).toEqual({ bills: 0, total: 0 });
    expect(forCaja.all).toEqual({ bills: 2, total: 10.5 });

    const free = (await tables.board(luis)).find((t) => t.tableId === "M2")!;
    expect(free).toMatchObject({ attendedBy: [], mine: { bills: 0, total: 0 } });
  });
});

describe("Cerrar (mesero) y cobrar (cajero)", () => {
  const withLatte = async (who: { userId: number; role: Role }, tableId = "M1") => {
    const bill = await open(who, "Cuenta", tableId);
    await details.saveAll(
      { billId: bill.billId!, billDetails: [{ productId: latte.productId, quantity: 1 }] },
      who,
    );
    return bill;
  };

  it("el mesero cierra su cuenta: queda por cobrar, sin productos nuevos, y puede reabrirla", async () => {
    const bill = await withLatte(ana);

    const closed = await bills.update({ billId: bill.billId, status: Status.PENDING_PAYMENT }, ana);
    expect(closed.status).toBe(Status.PENDING_PAYMENT);
    expect(await tableStatus("M1")).toBe(TableStatus.OCUPADA);
    await expect(
      details.saveAll({ billId: bill.billId!, billDetails: [{ productId: latte.productId, quantity: 1 }] }, ana),
    ).rejects.toMatchObject({ statusCode: 409 });

    const reopened = await bills.update({ billId: bill.billId, status: Status.OPEN }, ana);
    expect(reopened.status).toBe(Status.OPEN);
  });

  it("el filtro active trae abiertas y por cobrar, pero no cobradas", async () => {
    const a = await withLatte(ana);
    await bills.update({ billId: a.billId, status: Status.PENDING_PAYMENT }, ana);
    await withLatte(ana);
    const paid = await withLatte(caja, "M2");
    await bills.update(
      { billId: paid.billId, status: Status.CLOSED, cashRegisterId: register.cashRegisterId, paymentMethod: PaymentMethod.CASH },
      caja,
    );
    const { items } = await bills.find({ active: true }, caja);
    expect(items.map((b) => b.status).sort()).toEqual([Status.OPEN, Status.PENDING_PAYMENT]);
  });

  it("no se cierra una cuenta vacía", async () => {
    const bill = await open(ana, "Vacía");
    await expect(
      bills.update({ billId: bill.billId, status: Status.PENDING_PAYMENT }, ana),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("el mesero no puede cobrar ni fijar caja o método de pago", async () => {
    const bill = await withLatte(ana);
    await bills.update({ billId: bill.billId, status: Status.PENDING_PAYMENT }, ana);

    await expect(
      bills.update(
        { billId: bill.billId, status: Status.CLOSED, cashRegisterId: register.cashRegisterId, paymentMethod: PaymentMethod.CASH },
        ana,
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      bills.update({ billId: bill.billId, paymentMethod: PaymentMethod.CARD }, ana),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("el cajero cobra con método de pago obligatorio y libera la mesa", async () => {
    const bill = await withLatte(ana);
    await bills.update({ billId: bill.billId, status: Status.PENDING_PAYMENT }, ana);

    await expect(
      bills.update({ billId: bill.billId, status: Status.CLOSED, cashRegisterId: register.cashRegisterId }, caja),
    ).rejects.toMatchObject({ statusCode: 400 });

    const paid = await bills.update(
      { billId: bill.billId, status: Status.CLOSED, cashRegisterId: register.cashRegisterId, paymentMethod: PaymentMethod.CARD },
      caja,
    );
    expect(paid).toMatchObject({ status: Status.CLOSED, paymentMethod: PaymentMethod.CARD });
    expect(await tableStatus("M1")).toBe(TableStatus.DISPONIBLE);

    // Una vez cobrada ya no se reabre
    await expect(bills.update({ billId: bill.billId, status: Status.OPEN }, caja)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("una cuenta no puede nacer cobrada", async () => {
    await expect(
      bills.save({ customer: "Atajo", tableId: "M1", orderType: OrderType.DINE_IN, waiterId: ana.userId, status: Status.CLOSED } as any),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("para llevar: el mesero cierra, el cajero cobra y el mesero entrega", async () => {
    const order = await bills.save({ customer: "Lucía", orderType: OrderType.TAKEAWAY, waiterId: ana.userId });
    await details.saveAll({ billId: order.billId!, billDetails: [{ productId: latte.productId, quantity: 2 }] }, ana);

    await bills.update({ billId: order.billId, status: Status.PENDING_PAYMENT }, ana);
    await bills.update(
      { billId: order.billId, status: Status.CLOSED, cashRegisterId: register.cashRegisterId, paymentMethod: PaymentMethod.CASH },
      caja,
    );
    const delivered = await bills.update({ billId: order.billId, status: Status.FINISHED }, ana);
    expect(delivered.status).toBe(Status.FINISHED);
  });

  it("anular una cuenta por cobrar devuelve el stock", async () => {
    const supplier = await ds.getRepository(Supplier).save({ name: "P", phone: "22223333", email: "p@t.sv" });
    const type = await ds.getRepository(ConsumableType).save({ name: "Lácteos" });
    const milk = await ds.getRepository(Consumable).save({
      name: "Leche", supplierId: supplier.supplierId, consumableTypeId: type.consumableTypeId,
      quantity: 1, unitMeasurement: UnitMeasurement.LITER, cost: 1, active: true,
    });
    await ds.getRepository(Ingredient).save({ name: "Latte - leche", quantity: 0.25, productId: latte.productId, consumableId: milk.consumableId });
    const bill = await withLatte(ana);
    await bills.update({ billId: bill.billId, status: Status.PENDING_PAYMENT }, ana);

    await bills.void(bill.billId!);

    expect((await ds.getRepository(Consumable).findOneByOrFail({ consumableId: milk.consumableId })).quantity).toBeCloseTo(1);
    expect(await tableStatus("M1")).toBe(TableStatus.DISPONIBLE);
  });

  it("el reporte separa ventas por método de pago", async () => {
    for (const method of [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.CARD]) {
      const bill = await withLatte(caja, "M2");
      await bills.update(
        { billId: bill.billId, status: Status.CLOSED, cashRegisterId: register.cashRegisterId, paymentMethod: method },
        caja,
      );
    }
    const report = await new ReportService(ds).sales(new Date(Date.now() - 3600_000), new Date(Date.now() + 3600_000));
    expect(report.byPaymentMethod).toEqual([
      { paymentMethod: "card", bills: 2, total: 7 },
      { paymentMethod: "cash", bills: 1, total: 3.5 },
    ]);
  });
});

