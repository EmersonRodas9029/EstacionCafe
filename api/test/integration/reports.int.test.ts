import { DataSource } from "typeorm";
import { closeTestDatabase, resetTables, setupTestDatabase } from "./db";
import { ReportService } from "../../application/services/ReportService";
import { Bill } from "../../core/entities/Bill";
import { BillDetails } from "../../core/entities/BillDetails";
import { Product } from "../../core/entities/Producto";
import { ProductType } from "../../core/entities/ProductType";
import { Purchase } from "../../core/entities/Purchase";
import { Supplier } from "../../core/entities/Supplier";
import { User } from "../../core/entities/User";
import { UserType } from "../../core/entities/UserType";
import { OrderType } from "../../core/enums/OrderType";
import { Status } from "../../core/enums/Status";

let ds: DataSource;
let reports: ReportService;

const from = new Date("2026-03-01T06:00:00Z"); // 1 mar 00:00 El Salvador
const to = new Date("2026-03-03T05:59:59Z");

beforeAll(async () => {
  ds = await setupTestDatabase();
  reports = new ReportService(ds);
});
afterAll(closeTestDatabase);

beforeEach(async () => {
  await resetTables();
  const type = await ds
    .getRepository(UserType)
    .save({ name: "Mesero", permissionLevel: 3 });
  const waiter = await ds.getRepository(User).save({
    username: "ana",
    password: "x",
    email: "a@t.com",
    userTypeId: type.userTypeId,
    active: true,
  });
  const drinks = await ds.getRepository(ProductType).save({ name: "Bebidas" });
  const [latte, croissant] = await ds.getRepository(Product).save([
    { name: "Latte", description: "d", price: 3.5, cost: 1, active: true, productTypeId: drinks.productTypeId },
    { name: "Croissant", description: "d", price: 2, cost: 0.5, active: true },
  ]);

  const bill = (status: Status, date: string, orderType = OrderType.DINE_IN) =>
    ds.getRepository(Bill).save({
      customer: "c",
      waiterId: waiter.userId,
      orderType,
      status,
      date: new Date(date),
      total: 0,
    });
  const line = async (b: Bill, p: Product, quantity: number) => {
    await ds.getRepository(BillDetails).save({
      billId: b.billId!,
      productId: p.productId,
      quantity,
      unitPrice: p.price,
      subTotal: quantity * p.price,
    });
    await ds.query(
      `UPDATE bills SET total = total + $1 WHERE bill_id = $2`,
      [quantity * p.price, b.billId],
    );
  };

  // 1 mar (hora local 20:00) y 2 mar
  const b1 = await bill(Status.CLOSED, "2026-03-02T02:00:00Z");
  await line(b1, latte!, 2); // 7
  const b2 = await bill(Status.FINISHED, "2026-03-02T15:00:00Z", OrderType.TAKEAWAY);
  await line(b2, croissant!, 1); // 2
  // No cuentan: abierta y fuera de rango
  const open = await bill(Status.OPEN, "2026-03-02T15:00:00Z");
  await line(open, latte!, 5);
  const old = await bill(Status.CLOSED, "2026-02-10T15:00:00Z");
  await line(old, latte!, 5);

  const supplier = await ds
    .getRepository(Supplier)
    .save({ name: "P", phone: "22223333", email: "p@t.com" });
  await ds.getRepository(Purchase).save({
    date: new Date("2026-03-02T12:00:00Z"),
    supplierId: supplier.supplierId,
    total: 40,
  });
});

describe("ReportService.sales", () => {
  it("resume ventas cobradas del rango", async () => {
    const report = await reports.sales(from, to);

    expect(report.summary).toEqual({
      totalSales: 9,
      billsCount: 2,
      averageTicket: 4.5,
      costOfGoods: 2.5,
      grossProfit: 6.5,
      purchasesTotal: 40,
    });
  });

  it("agrupa por día local, producto, categoría, mesero y tipo", async () => {
    const report = await reports.sales(from, to);

    expect(report.byDay).toEqual([
      { date: "2026-03-01", total: 7, bills: 1 },
      { date: "2026-03-02", total: 2, bills: 1 },
    ]);
    expect(report.topProducts[0]).toMatchObject({ name: "Latte", quantity: 2, total: 7 });
    expect(report.byProductType).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Bebidas", total: 7 }),
        expect.objectContaining({ name: "Sin categoría", total: 2 }),
      ]),
    );
    expect(report.byWaiter).toEqual([
      expect.objectContaining({ username: "ana", bills: 2, total: 9 }),
    ]);
    expect(report.byOrderType).toEqual(
      expect.arrayContaining([
        { orderType: "dine_in", bills: 1, total: 7 },
        { orderType: "takeaway", bills: 1, total: 2 },
      ]),
    );
  });

  it("rango sin ventas devuelve ceros", async () => {
    const report = await reports.sales(
      new Date("2025-01-01"),
      new Date("2025-01-02"),
    );
    expect(report.summary.totalSales).toBe(0);
    expect(report.summary.averageTicket).toBe(0);
    expect(report.byDay).toEqual([]);
  });
});
