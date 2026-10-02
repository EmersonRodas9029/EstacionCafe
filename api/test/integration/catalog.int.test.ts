import { DataSource } from "typeorm";
import { closeTestDatabase, resetTables, setupTestDatabase } from "./db";
import { ProductService } from "../../application/services/ProductService";
import { ProductTypeService } from "../../application/services/ProductTypeService";
import { Product } from "../../core/entities/Producto";
import { ProductType } from "../../core/entities/ProductType";

let ds: DataSource;
let products: ProductService;
let categories: ProductTypeService;
let drinks: ProductType;

beforeAll(async () => {
  ds = await setupTestDatabase();
  products = new ProductService(ds.getRepository(Product));
  categories = new ProductTypeService(ds.getRepository(ProductType));
});
afterAll(closeTestDatabase);

beforeEach(async () => {
  await resetTables();
  drinks = await categories.save({ name: "Bebidas" });
});

describe("Catálogo", () => {
  it("no elimina una categoría con productos", async () => {
    await products.save({
      name: "Latte",
      description: "Café con leche",
      price: 3.5,
      cost: 1,
      productTypeId: drinks.productTypeId,
    });

    await expect(categories.delete(drinks.productTypeId)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("elimina una categoría vacía", async () => {
    await categories.delete(drinks.productTypeId);

    expect(await ds.getRepository(ProductType).count()).toBe(0);
  });

  it("eliminar un producto solo lo desactiva", async () => {
    const latte = await products.save({
      name: "Latte",
      description: "Café con leche",
      price: 3.5,
      cost: 1,
      productTypeId: drinks.productTypeId,
    });

    await products.delete(latte.productId);

    expect((await products.getById(latte.productId)).active).toBe(false);
  });

  it("al editar, el precio debe seguir siendo mayor al costo", async () => {
    const latte = await products.save({
      name: "Latte",
      description: "Café con leche",
      price: 3.5,
      cost: 1,
      productTypeId: drinks.productTypeId,
    });

    await expect(
      products.update({ productId: latte.productId, cost: 4 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
