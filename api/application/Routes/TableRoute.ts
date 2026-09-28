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
import { verifyToken } from "../../infrastructure/security/authMiddleware";
import { authorize } from "../../infrastructure/security/rbacMiddleware";

export const tableRouter = Router();

tableRouter.get("/tables", getTables);
tableRouter.get("/tables/available", getAvailableTables);
tableRouter.get("/tables/zone/:zone", getTablesByZone);
tableRouter.get("/tables/status/:status", getTablesByStatus);
tableRouter.get("/tables/:id", getTableById);
tableRouter.post("/tables", saveTable);
tableRouter.put("/tables/:id", updateTable);
tableRouter.patch("/tables/:id/status", updateTableStatus);
tableRouter.delete(
  "/tables/:id",
  verifyToken,
  authorize(["admin", "mesero", "cajero"]),
  deleteTable,
);
