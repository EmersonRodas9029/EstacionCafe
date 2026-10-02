import { DataSource } from "typeorm";
import { closeTestDatabase, resetTables, setupTestDatabase } from "./db";
import {
  DRAFT_TTL_HOURS,
  runCleanDraftBillsNow,
} from "../../infrastructure/jobs/cleanDraftBillsJob";
import { Bill } from "../../core/entities/Bill";
import { BillDetails } from "../../core/entities/BillDetails";
import { Product } from "../../core/entities/Producto";
import { User } from "../../core/entities/User";
import { UserType } from "../../core/entities/UserType";
import { OrderType } from "../../core/enums/OrderType";
import { Status } from "../../core/enums/Status";

let ds: DataSource;
let waiterId: number;

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

const createBill = async (status: Status, createdAt: Date) => {
  const bill = await ds.getRepository(Bill).save({
    customer: "X",
    orderType: OrderType.TAKEAWAY,
    waiterId,
    status,
    total: 0,
    date: createdAt,
  });
  await ds.query(`UPDATE bills SET created_at = $1 WHERE bill_id = $2`, [
    createdAt,
    bill.billId,
  ]);
  return bill;
};

beforeAll(async () => {
  ds = await setupTestDatabase();
});
afterAll(closeTestDatabase);

beforeEach(async () => {
  await resetTables();
  const type = await ds
    .getRepository(UserType)
    .save({ name: "Mesero", permissionLevel: 3 });
  waiterId = (
    await ds.getRepository(User).save({
      username: "m",
      password: "x",
      email: "m@t.com",
      userTypeId: type.userTypeId,
      active: true,
    })
  ).userId;
});

describe("runCleanDraftBillsNow", () => {
  it("borra solo drafts vacíos más viejos que el TTL", async () => {
    const abandoned = await createBill(Status.DRAFT, hoursAgo(DRAFT_TTL_HOURS + 1));
    const recent = await createBill(Status.DRAFT, hoursAgo(0.5));
    const open = await createBill(Status.OPEN, hoursAgo(DRAFT_TTL_HOURS + 1));

    const withItems = await createBill(Status.DRAFT, hoursAgo(DRAFT_TTL_HOURS + 1));
    const product = await ds.getRepository(Product).save({
      name: "P",
      description: "d",
      price: 2,
      cost: 1,
      active: true,
    });
    await ds.getRepository(BillDetails).save({
      billId: withItems.billId!,
      productId: product.productId,
      quantity: 1,
      unitPrice: 2,
      subTotal: 2,
    });

    const result = await runCleanDraftBillsNow();

    expect(result).toEqual({ deleted: 1 });
    const remaining = (await ds.getRepository(Bill).find()).map((b) => b.billId);
    expect(remaining).not.toContain(abandoned.billId);
    expect(remaining).toEqual(
      expect.arrayContaining([recent.billId, open.billId, withItems.billId]),
    );
  });
});
