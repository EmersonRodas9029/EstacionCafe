import { Router } from "express";
import {
  getCashRegisters,
  getCashRegisterById,
  saveCashRegister,
  updateCashRegister,
  deleteCashRegister,
  getActiveCashRegisters,
  getCashRegisterByNumber,
} from "../../controller/CashRegisterController";
import { adminOnly, anyRole } from "../../infrastructure/security/rbacMiddleware";

export const cashRegisterRouter = Router();

cashRegisterRouter.get("/cash-registers", adminOnly, getCashRegisters);
cashRegisterRouter.get("/cash-registers/active", anyRole, getActiveCashRegisters);
cashRegisterRouter.get("/cash-registers/number/:number", anyRole, getCashRegisterByNumber);
cashRegisterRouter.get("/cash-registers/:id", anyRole, getCashRegisterById);
cashRegisterRouter.post("/cash-registers", adminOnly, saveCashRegister);
cashRegisterRouter.put("/cash-registers/:id", adminOnly, updateCashRegister);
cashRegisterRouter.delete("/cash-registers/:id", adminOnly, deleteCashRegister);
