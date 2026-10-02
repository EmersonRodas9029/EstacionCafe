import express from "express";
import { authRouter } from "./AuthRoute";
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
import { reportRouter } from "./ReportRoute";
import { verifyToken } from "../../infrastructure/security/authMiddleware";
import { requireCsrfHeader } from "../../infrastructure/security/csrf";
import { deviceRouter } from "./DeviceRoute";

const mainRouter = express.Router();

// Toda petición que modifica datos con cookie de sesión debe traer el header anti-CSRF
mainRouter.use(requireCsrfHeader);

// Públicas: login (contraseña y PIN), logout y estado del dispositivo
mainRouter.use("/", authRouter);

// Todo lo demás requiere token; cada router define los roles permitidos
mainRouter.use(verifyToken);

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
mainRouter.use("/", reportRouter);
mainRouter.use("/", deviceRouter);

export default mainRouter;
