import { Router } from "express";
import {
  getTables,
  getTableById,
  saveTable,
  updateTable,
  deleteTable,
  getTablesByZone,
  getTablesByStatus,
  getAvailableTables,
  updateTableStatus,
} from "../../controller/TableController";
import { adminOnly, anyRole, staff } from "../../infrastructure/security/rbacMiddleware";

export const tableRouter = Router();

tableRouter.get("/tables", anyRole, getTables);
tableRouter.get("/tables/available", anyRole, getAvailableTables);
tableRouter.get("/tables/zone/:zone", anyRole, getTablesByZone);
tableRouter.get("/tables/status/:status", anyRole, getTablesByStatus);
tableRouter.get("/tables/:id", anyRole, getTableById);
tableRouter.post("/tables", adminOnly, saveTable);
tableRouter.put("/tables/:id", adminOnly, updateTable);
tableRouter.patch("/tables/:id/status", staff, updateTableStatus);
tableRouter.delete("/tables/:id", adminOnly, deleteTable);
