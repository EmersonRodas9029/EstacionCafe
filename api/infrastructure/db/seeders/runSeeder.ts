import "../../config/env";
import * as bcrypt from "bcrypt";
import { AppDataSource } from "../Connection";
import { Bill } from "../../../core/entities/Bill";
import { BillDetails } from "../../../core/entities/BillDetails";
import { Consumable } from "../../../core/entities/Consumable";
import { ConsumableType } from "../../../core/entities/ConsumableType";
import { Ingredient } from "../../../core/entities/Ingredient";
import { Product } from "../../../core/entities/Producto";
import { ProductType } from "../../../core/entities/ProductType";
import { Purchase } from "../../../core/entities/Purchase";
import { Supplier } from "../../../core/entities/Supplier";
import { Table, TableStatus } from "../../../core/entities/Table";
import { User } from "../../../core/entities/User";
import { UserType } from "../../../core/entities/UserType";
import { Status } from "../../../core/enums/Status";
import { UnitMeasurement } from "../../../core/enums/UnitMeasurement";
import { Role } from "../../../core/enums/Role";
import { OrderType } from "../../../core/enums/OrderType";
import { CashRegister } from "../../../core/entities/CashRegister";

const DEMO_CUSTOMER = "Cliente demo EstacionCafe";
const DEMO_USERNAME = "admin.demo";
const DEMO_PASSWORD = "AdminDemo123!";
const DEMO_STAFF = [
  { username: "mesero.demo", email: "mesero.demo@estacioncafe.test", role: Role.MESERO },
  { username: "cajero.demo", email: "cajero.demo@estacioncafe.test", role: Role.CAJERO },
];

const seed = async () => {
  await AppDataSource.initialize();

  try {
    const userTypeRepository = AppDataSource.getRepository(UserType);
    const supplierRepository = AppDataSource.getRepository(Supplier);
    const consumableTypeRepository = AppDataSource.getRepository(ConsumableType);
    const productTypeRepository = AppDataSource.getRepository(ProductType);
    const tableRepository = AppDataSource.getRepository(Table);
    const userRepository = AppDataSource.getRepository(User);
    const consumableRepository = AppDataSource.getRepository(Consumable);
    const productRepository = AppDataSource.getRepository(Product);
    const ingredientRepository = AppDataSource.getRepository(Ingredient);
    const purchaseRepository = AppDataSource.getRepository(Purchase);
    const billRepository = AppDataSource.getRepository(Bill);
    const billDetailsRepository = AppDataSource.getRepository(BillDetails);
    const cashRegisterRepository = AppDataSource.getRepository(CashRegister);

    const register = await findOrCreate<CashRegister>(cashRegisterRepository, { number: "001" }, {
      number: "001",
      active: true,
    });

    const adminType = await findOrCreate<UserType>(userTypeRepository, { name: "Administrador" }, {
      name: "Administrador",
      permissionLevel: 10,
      role: Role.ADMIN,
    });
    const staffTypes = {
      [Role.MESERO]: await findOrCreate<UserType>(userTypeRepository, { name: "Mesero" }, {
        name: "Mesero",
        permissionLevel: 3,
        role: Role.MESERO,
      }),
      [Role.CAJERO]: await findOrCreate<UserType>(userTypeRepository, { name: "Cajero" }, {
        name: "Cajero",
        permissionLevel: 5,
        role: Role.CAJERO,
      }),
    };

    const supplier = await findOrCreate<Supplier>(supplierRepository, { email: "proveedor.demo@estacioncafe.test" }, {
      name: "Proveedor Demo",
      phone: "3000000000",
      email: "proveedor.demo@estacioncafe.test",
      active: true,
    });

    const coffeeType = await findOrCreate<ConsumableType>(consumableTypeRepository, { name: "Café" }, {
      name: "Café",
    });
    const milkType = await findOrCreate<ConsumableType>(consumableTypeRepository, { name: "Lácteos" }, {
      name: "Lácteos",
    });

    const beverageType = await findOrCreate<ProductType>(productTypeRepository, { name: "Bebidas" }, {
      name: "Bebidas",
    });
    const bakeryType = await findOrCreate<ProductType>(productTypeRepository, { name: "Panadería" }, {
      name: "Panadería",
    });

    await findOrCreate<Table>(tableRepository, { tableId: "M1" }, {
      tableId: "M1",
      zone: "Interior",
      status: TableStatus.DISPONIBLE,
    });
    await findOrCreate<Table>(tableRepository, { tableId: "M2" }, {
      tableId: "M2",
      zone: "Terraza",
      status: TableStatus.DISPONIBLE,
    });

    const password = await bcrypt.hash(DEMO_PASSWORD, 10);
    const user = await findOrCreate<User>(userRepository, { username: DEMO_USERNAME }, {
      username: DEMO_USERNAME,
      userTypeId: adminType.userTypeId,
      password,
      email: "admin.demo@estacioncafe.test",
      active: true,
    });
    for (const staff of DEMO_STAFF) {
      await findOrCreate<User>(userRepository, { username: staff.username }, {
        username: staff.username,
        userTypeId: staffTypes[staff.role as Role.MESERO | Role.CAJERO].userTypeId,
        password,
        email: staff.email,
        active: true,
      });
    }

    const coffee = await findOrCreate<Consumable>(consumableRepository, { name: "Café en grano" }, {
      supplierId: supplier.supplierId,
      name: "Café en grano",
      cosumableTypeId: coffeeType.consumableTypeId,
      quantity: 5000,
      unitMeasurement: UnitMeasurement.GRAM,
      cost: 0.08,
      active: true,
    });
    const milk = await findOrCreate<Consumable>(consumableRepository, { name: "Leche entera" }, {
      supplierId: supplier.supplierId,
      name: "Leche entera",
      cosumableTypeId: milkType.consumableTypeId,
      quantity: 20,
      unitMeasurement: UnitMeasurement.LITER,
      cost: 1.2,
      active: true,
    });

    const americano = await findOrCreate<Product>(productRepository, { name: "Café Americano" }, {
      name: "Café Americano",
      description: "Café filtrado de la casa",
      price: 2.5,
      cost: 0.6,
      active: true,
      productTypeId: beverageType.productTypeId,
    });
    const latte = await findOrCreate<Product>(productRepository, { name: "Café Latte" }, {
      name: "Café Latte",
      description: "Espresso con leche vaporizada",
      price: 3.5,
      cost: 1.1,
      active: true,
      productTypeId: beverageType.productTypeId,
    });
    await findOrCreate<Product>(productRepository, { name: "Croissant de mantequilla" }, {
      name: "Croissant de mantequilla",
      description: "Croissant horneado del día",
      price: 2.75,
      cost: 1.0,
      active: true,
      productTypeId: bakeryType.productTypeId,
    });

    await findOrCreate<Ingredient>(ingredientRepository, { name: "Café Americano - café" }, {
      consumableId: coffee.consumableId,
      name: "Café Americano - café",
      quantity: 18,
      productId: americano.productId,
    });
    await findOrCreate<Ingredient>(ingredientRepository, { name: "Café Latte - café" }, {
      consumableId: coffee.consumableId,
      name: "Café Latte - café",
      quantity: 18,
      productId: latte.productId,
    });
    await findOrCreate<Ingredient>(ingredientRepository, { name: "Café Latte - leche" }, {
      consumableId: milk.consumableId,
      name: "Café Latte - leche",
      quantity: 0.2,
      productId: latte.productId,
    });

    await findOrCreate<Purchase>(purchaseRepository, { total: 640 }, {
      date: new Date(),
      cashRegister: register.cashRegisterId,
      supplierId: supplier.supplierId,
      total: 640,
    });

    let bill = await billRepository.findOneBy({ customer: DEMO_CUSTOMER });
    if (!bill) {
      bill = await billRepository.save({
        waiterId: user.userId,
        cashRegisterId: register.cashRegisterId,
        tableId: "M1",
        orderType: OrderType.DINE_IN,
        customer: DEMO_CUSTOMER,
        date: new Date(),
        total: americano.price + latte.price,
        status: Status.CLOSED,
      });
      await billDetailsRepository.save([
        {
          billId: bill.billId,
          productId: americano.productId,
          quantity: 1,
          unitPrice: americano.price,
          subTotal: americano.price,
        },
        {
          billId: bill.billId,
          productId: latte.productId,
          quantity: 1,
          unitPrice: latte.price,
          subTotal: latte.price,
        },
      ]);
    }

    console.log("Seeder ejecutado correctamente");
    console.log(
      `Usuarios demo (contraseña ${DEMO_PASSWORD}): ${[DEMO_USERNAME, ...DEMO_STAFF.map((u) => u.username)].join(", ")}`,
    );
  } finally {
    await AppDataSource.destroy();
  }
};

const revert = async () => {
  await AppDataSource.initialize();

  try {
    const billRepository = AppDataSource.getRepository(Bill);
    const billDetailsRepository = AppDataSource.getRepository(BillDetails);
    const ingredientRepository = AppDataSource.getRepository(Ingredient);
    const purchaseRepository = AppDataSource.getRepository(Purchase);
    const productRepository = AppDataSource.getRepository(Product);
    const consumableRepository = AppDataSource.getRepository(Consumable);
    const userRepository = AppDataSource.getRepository(User);
    const tableRepository = AppDataSource.getRepository(Table);
    const supplierRepository = AppDataSource.getRepository(Supplier);
    const productTypeRepository = AppDataSource.getRepository(ProductType);
    const consumableTypeRepository = AppDataSource.getRepository(ConsumableType);
    const userTypeRepository = AppDataSource.getRepository(UserType);

    const demoBills = await billRepository.findBy({ customer: DEMO_CUSTOMER });
    for (const bill of demoBills) {
      await billDetailsRepository.delete({ billId: bill.billId });
    }
    await billRepository.delete({ customer: DEMO_CUSTOMER });
    await ingredientRepository.delete([
      { name: "Café Americano - café" },
      { name: "Café Latte - café" },
      { name: "Café Latte - leche" },
    ]);
    await purchaseRepository.delete({ total: 640 });
    await productRepository.delete([
      { name: "Café Americano" },
      { name: "Café Latte" },
      { name: "Croissant de mantequilla" },
    ]);
    await consumableRepository.delete([
      { name: "Café en grano" },
      { name: "Leche entera" },
    ]);
    await userRepository.delete({ username: DEMO_USERNAME });
    for (const staff of DEMO_STAFF) {
      await userRepository.delete({ username: staff.username });
    }
    await tableRepository.delete([{ tableId: "M1" }, { tableId: "M2" }]);
    await supplierRepository.delete({ email: "proveedor.demo@estacioncafe.test" });
    await productTypeRepository.delete([{ name: "Bebidas" }, { name: "Panadería" }]);
    await consumableTypeRepository.delete([{ name: "Café" }, { name: "Lácteos" }]);
    await userTypeRepository.delete({ name: "Administrador" });
    await userTypeRepository.delete({ name: "Cajero" });
    await userTypeRepository.delete({ name: "Mesero" });

    console.log("Datos demo eliminados correctamente");
  } finally {
    await AppDataSource.destroy();
  }
};

const findOrCreate = async <T extends object>(
  repository: import("typeorm").Repository<T>,
  where: import("typeorm").FindOptionsWhere<T>,
  values: import("typeorm").DeepPartial<T>,
): Promise<T> => {
  const existing = await repository.findOneBy(where);
  if (existing) {
    return existing;
  }

  const created = repository.create(values);
  return (await repository.save(created)) as T;
};

(process.argv[2] === "revert" ? revert : seed)().catch((error: Error) => {
  console.error("Error ejecutando seeder:", error.message);
  process.exitCode = 1;
});
