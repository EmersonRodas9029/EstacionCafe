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

  it("en mesa compartida el mesero cobra solo lo suyo y la mesa sigue ocupada", async () => {
    await open(ana, "Ana");
    await open(luis, "Luis");

    const result = await bills.closeBillsByTable("M1", register.cashRegisterId, ana);

    expect(result.updated).toBe(1);
    expect(await tableStatus("M1")).toBe(TableStatus.OCUPADA);
    const luisBills = (await bills.find({}, luis)).items;
    expect(luisBills[0]!.status).toBe(Status.OPEN);

    await bills.closeBillsByTable("M1", register.cashRegisterId, caja);
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
