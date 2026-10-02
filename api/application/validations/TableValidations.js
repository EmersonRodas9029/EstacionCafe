"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableSchema = exports.tableIdSchema = exports.updateTableSchema = exports.createTableSchema = void 0;
const zod_1 = require("zod");
const Table_1 = require("../../core/entities/Table");
exports.createTableSchema = zod_1.z.object({
    tableId: zod_1.z
        .string()
        .min(1, "El ID de la mesa es requerido")
        .max(10, "El ID de la mesa no puede tener más de 10 caracteres")
        .regex(/^[A-Z0-9]+$/, "El ID de la mesa debe contener solo letras mayúsculas y números")
        .trim(),
    zone: zod_1.z
        .string()
        .min(1, "La zona es requerida")
        .max(50, "La zona no puede tener más de 50 caracteres")
        .trim(),
    status: zod_1.z.nativeEnum(Table_1.TableStatus).optional().default(Table_1.TableStatus.DISPONIBLE),
});
exports.updateTableSchema = zod_1.z.object({
    zone: zod_1.z
        .string()
        .min(1, "La zona es requerida")
        .max(50, "La zona no puede tener más de 50 caracteres")
        .trim()
        .optional(),
    status: zod_1.z.nativeEnum(Table_1.TableStatus).optional(),
});
exports.tableIdSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .min(1, "El ID de la mesa es requerido")
        .max(10, "El ID de la mesa no puede tener más de 10 caracteres")
        .trim(),
});
exports.tableSchema = exports.createTableSchema;
