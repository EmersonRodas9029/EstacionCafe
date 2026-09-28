"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDependencies = void 0;
const Connection_1 = require("../infrastructure/db/Connection");
//SetServices Methods
const BillController_1 = require("../controller/BillController");
const ProductController_1 = require("../controller/ProductController");
const BillDetailsController_1 = require("../controller/BillDetailsController");
const UserController_1 = require("../controller/UserController");
const UserTypeController_1 = require("../controller/UserTypeController");
const ConsumableController_1 = require("../controller/ConsumableController");
const ConsumableTypeController_1 = require("../controller/ConsumableTypeController");
const IngredientController_1 = require("../controller/IngredientController");
const SupplierController_1 = require("../controller/SupplierController");
const PurchaseController_1 = require("../controller/PurchaseController");
const TableController_1 = require("../controller/TableController");
const ProductTypeController_1 = require("../controller/ProductTypeController");
//Initialize Middleware
const authMiddleware_1 = require("../infrastructure/security/authMiddleware");
//Services
const BillService_1 = require("../application/services/BillService");
const ProductService_1 = require("../application/services/ProductService");
const BillDetailsService_1 = require("../application/services/BillDetailsService");
const UserService_1 = require("../application/services/UserService");
const UserTypeService_1 = require("../application/services/UserTypeService");
const ConsumableService_1 = require("../application/services/ConsumableService");
const ConsumableTypeService_1 = require("../application/services/ConsumableTypeService");
const SupplierService_1 = require("../application/services/SupplierService");
const IngredientService_1 = require("../application/services/IngredientService");
const PurchaseService_1 = require("../application/services/PurchaseService");
const TokenService_1 = require("../infrastructure/security/TokenService");
const TableService_1 = require("../application/services/TableService");
const ProductTypeService_1 = require("../application/services/ProductTypeService");
//Entitys
const Bill_1 = require("./entities/Bill");
const BillDetails_1 = require("./entities/BillDetails");
const Producto_1 = require("./entities/Producto");
const User_1 = require("./entities/User");
const UserType_1 = require("./entities/UserType");
const Consumable_1 = require("./entities/Consumable");
const ConsumableType_1 = require("./entities/ConsumableType");
const Ingredient_1 = require("./entities/Ingredient");
const Supplier_1 = require("./entities/Supplier");
const Purchase_1 = require("./entities/Purchase");
const Table_1 = require("./entities/Table");
const ProductType_1 = require("./entities/ProductType");
const initializeDependencies = async () => {
    const AppDataSource = (0, Connection_1.getDataSource)();
    try {
        await AppDataSource.initialize();
        console.log("Conexión exitosa a la base de datos");
        //Repositories
        const billRepository = AppDataSource.getRepository(Bill_1.Bill);
        const productRepository = AppDataSource.getRepository(Producto_1.Product);
        const billDetailsRepository = AppDataSource.getRepository(BillDetails_1.BillDetails);
        const userRepositoy = AppDataSource.getRepository(User_1.User);
        const userTypeRepository = AppDataSource.getRepository(UserType_1.UserType);
        const consumableRepository = AppDataSource.getRepository(Consumable_1.Consumable);
        const consumableTypeRepository = AppDataSource.getRepository(ConsumableType_1.ConsumableType);
        const supplierRepository = AppDataSource.getRepository(Supplier_1.Supplier);
        const ingredientRepository = AppDataSource.getRepository(Ingredient_1.Ingredient);
        const purchaseRepository = AppDataSource.getRepository(Purchase_1.Purchase);
        const tableRepository = AppDataSource.getRepository(Table_1.Table);
        const productTypeRepository = AppDataSource.getRepository(ProductType_1.ProductType);
        //Services
        const billService = new BillService_1.BillService(billRepository);
        const productService = new ProductService_1.ProductService(productRepository);
        const billDetailsService = new BillDetailsService_1.BillDetailsService(billDetailsRepository, billService);
        const userService = new UserService_1.UserService(userRepositoy);
        const userTypeService = new UserTypeService_1.UserTypeService(userTypeRepository);
        const consumableService = new ConsumableService_1.ConsumableService(consumableRepository);
        const consumableTypeService = new ConsumableTypeService_1.ConsumableTypeService(consumableTypeRepository);
        const supplierService = new SupplierService_1.SupplierService(supplierRepository);
        const purchaseService = new PurchaseService_1.PurchaseService(purchaseRepository);
        const ingredientService = new IngredientService_1.IngredientService(ingredientRepository);
        const tokenService = new TokenService_1.TokenService(userService);
        const tableService = new TableService_1.TableService(tableRepository);
        const productTypeService = new ProductTypeService_1.ProductTypeService(productTypeRepository);
        //Set Services to Controllers
        (0, BillController_1.setService)(billService);
        (0, ProductController_1.setService)(productService);
        (0, BillDetailsController_1.setService)(billDetailsService);
        (0, UserController_1.setServices)(userService, tokenService);
        (0, UserTypeController_1.setService)(userTypeService);
        (0, ConsumableController_1.setService)(consumableService);
        (0, ConsumableTypeController_1.setService)(consumableTypeService);
        (0, IngredientController_1.setService)(ingredientService);
        (0, SupplierController_1.setService)(supplierService);
        (0, PurchaseController_1.setService)(purchaseService);
        (0, TableController_1.setService)(tableService);
        (0, ProductTypeController_1.setService)(productTypeService);
        // Inicializar middleware con el servicio de tokens
        (0, authMiddleware_1.initializeAuthMiddleware)(tokenService);
        console.log("Dependencias inicializadas correctamente");
    }
    catch (error) {
        console.error("Error al inicializar la base de datos:", error.message);
        console.error("Detalles del error:", error);
        throw error;
    }
};
exports.initializeDependencies = initializeDependencies;
module.exports = { initializeDependencies: exports.initializeDependencies };
