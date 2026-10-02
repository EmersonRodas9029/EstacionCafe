import express from "express";
import { billRouter } from "./BillRoute";
import { productRouter } from "./ProductRoute";
import { billDetailsRouter } from "./BillDetailsRoute";
import { userRouter } from "./UserRoutes";
import { userTypeRouter } from "./UserTypesRoute";
import { consumableRouter } from "./ConsumableRoute";
import { consumableTypeRouter } from "./ConsumableTypeRoute";
import { supplierRouter } from "./SupplierRoute";
import { ingredientRouter } from "./IngredientRoute";
import { purchaseRouter } from "./PurchaseRoute";
import { cashRegisterRouter } from "./CashRegisterRoutes";
import { tableRouter } from "./TableRoute";
import { productTypeRouter } from "./ProductTypeRoute";

const mainRouter = express.Router();

// Usar las rutas de facturas
mainRouter.use("/", billRouter);
mainRouter.use("/", productRouter);
mainRouter.use("/", billDetailsRouter);
mainRouter.use("/", userRouter);
mainRouter.use("/", userTypeRouter);
mainRouter.use("/", consumableRouter);
mainRouter.use("/", consumableTypeRouter);
mainRouter.use("/", supplierRouter);
mainRouter.use("/", ingredientRouter);
mainRouter.use("/", purchaseRouter);
mainRouter.use("/", cashRegisterRouter);
mainRouter.use("/", tableRouter);
mainRouter.use("/", productTypeRouter);

export default mainRouter;
