import { DataSource } from "typeorm";
import { closeTestDatabase, resetTables, setupTestDatabase } from "./db";
import { PurchaseService } from "../../application/services/PurchaseService";
import { Purchase } from "../../core/entities/Purchase";
import { Consumable } from "../../core/entities/Consumable";
import { ConsumableType } from "../../core/entities/ConsumableType";
import { Supplier } from "../../core/entities/Supplier";
import { UnitMeasurement } from "../../core/enums/UnitMeasurement";

let ds: DataSource;
let purchases: PurchaseService;
let supplier: Supplier;
let coffee: Consumable;

const stock = async () =>
  (await ds.getRepository(Consumable).findOneByOrFail({
    consumableId: coffee.consumableId,
  })).quantity;

beforeAll(async () => {
  ds = await setupTestDatabase();
  purchases = new PurchaseService(ds.getRepository(Purchase));
});
afterAll(closeTestDatabase);

beforeEach(async () => {
  await resetTables();
  supplier = await ds
    .getRepository(Supplier)
    .save({ name: "Proveedor", phone: "22223333", email: "p@test.com" });
  const type = await ds.getRepository(ConsumableType).save({ name: "Café" });
  coffee = await ds.getRepository(Consumable).save({
    name: "Café en grano",
    supplierId: supplier.supplierId,
    consumableTypeId: type.consumableTypeId,
    quantity: 100,
    unitMeasurement: UnitMeasurement.GRAM,
    cost: 0.05,
    active: true,
  });
});

describe("PurchaseService", () => {
  it("con detalles suma stock, actualiza costo y calcula total", async () => {
    const purchase = await purchases.save({
      date: new Date(),
      supplierId: supplier.supplierId,
      details: [
        { consumableId: coffee.consumableId, quantity: 1000, unitCost: 0.08 },
      ],
    });

    expect(purchase.total).toBe(80);
    expect(purchase.details).toHaveLength(1);
    expect(purchase.details[0]!.consumable.name).toBe("Café en grano");
    expect(await stock()).toBe(1100);
    const updated = await ds
      .getRepository(Consumable)
      .findOneByOrFail({ consumableId: coffee.consumableId });
    expect(updated.cost).toBe(0.08);
  });

  it("sin detalles registra un gasto con total explícito", async () => {
    const purchase = await purchases.save({
      date: new Date(),
      supplierId: supplier.supplierId,
      total: 25,
    });

    expect(purchase.total).toBe(25);
    expect(purchase.details).toHaveLength(0);
    expect(await stock()).toBe(100);
  });

  it("consumible inexistente revierte todo", async () => {
    await expect(
      purchases.save({
        date: new Date(),
        supplierId: supplier.supplierId,
        details: [{ consumableId: 999, quantity: 1, unitCost: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(await ds.getRepository(Purchase).count()).toBe(0);
  });

  it("eliminar la compra descuenta lo que había sumado", async () => {
    const purchase = await purchases.save({
      date: new Date(),
      supplierId: supplier.supplierId,
      details: [{ consumableId: coffee.consumableId, quantity: 50, unitCost: 0.1 }],
    });

    await purchases.delete(purchase.purchaseId!);

    expect(await stock()).toBe(100);
    expect(await ds.getRepository(Purchase).count()).toBe(0);
  });

  it("no elimina si el stock comprado ya se consumió", async () => {
    const purchase = await purchases.save({
      date: new Date(),
      supplierId: supplier.supplierId,
      details: [{ consumableId: coffee.consumableId, quantity: 50, unitCost: 0.1 }],
    });
    await ds
      .getRepository(Consumable)
      .update({ consumableId: coffee.consumableId }, { quantity: 10 });

    await expect(purchases.delete(purchase.purchaseId!)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("no permite cambiar el total de una compra con detalles", async () => {
    const purchase = await purchases.save({
      date: new Date(),
      supplierId: supplier.supplierId,
      details: [{ consumableId: coffee.consumableId, quantity: 1, unitCost: 1 }],
    });

    await expect(
      purchases.update({ purchaseId: purchase.purchaseId, total: 999 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
