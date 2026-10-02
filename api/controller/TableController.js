"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTableStatus = exports.getAvailableTables = exports.getTablesByStatus = exports.getTablesByZone = exports.deleteTable = exports.updateTable = exports.saveTable = exports.getTableById = exports.getTables = exports.setService = void 0;
const TableValidations_1 = require("../application/validations/TableValidations");
const Table_1 = require("../core/entities/Table");
let service = null;
const setService = (tableService) => {
    service = tableService;
};
exports.setService = setService;
const getService = () => {
    if (!service) {
        throw new Error("Table service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getTables = async (req, res) => {
    try {
        const data = await service.getAll();
        console.log("Mesas obtenidas correctamente");
        return res.status(200).send({
            status: "success",
            message: "Mesas obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las mesas: ${error.message}`,
        });
    }
};
exports.getTables = getTables;
const getTableById = async (req, res) => {
    try {
        const { id } = TableValidations_1.tableIdSchema.parse(req.params);
        const tableService = getService();
        const data = await tableService.getById(id);
        console.log("Mesa obtenida correctamente");
        return res.status(200).send({
            status: "success",
            message: "Mesa obtenida correctamente",
            data: data,
        });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).send({
                status: "error",
                message: "ID inválido: " + error.issues[0].message,
            });
        }
        if (error.message.includes("no encontrada")) {
            return res.status(404).send({
                status: "error",
                message: error.message,
            });
        }
        return res.status(500).send({
            status: "error",
            message: `Error al obtener la mesa: ${error.message}`,
        });
    }
};
exports.getTableById = getTableById;
const saveTable = async (req, res) => {
    try {
        const tableData = req.body;
        const result = await service.save(TableValidations_1.createTableSchema.parse(tableData));
        console.log("Mesa creada correctamente");
        return res.status(201).send({
            status: "success",
            message: "Mesa creada correctamente",
            data: result,
        });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).send({
                status: "error",
                message: "Datos inválidos: " + error.issues[0].message,
                campo: error.issues[0].path,
                error: error.issues[0].code,
            });
        }
        if (error.message.includes("ya existe")) {
            return res.status(409).send({
                status: "error",
                message: error.message,
            });
        }
        console.error("Error al crear mesa:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.saveTable = saveTable;
const updateTable = async (req, res) => {
    try {
        const { id } = TableValidations_1.tableIdSchema.parse(req.params);
        const updateData = TableValidations_1.updateTableSchema.parse(req.body);
        const tableService = getService();
        const result = await tableService.update({
            tableId: id,
            ...updateData,
        });
        console.log("Mesa actualizada correctamente");
        return res.status(200).send({
            status: "success",
            message: "Mesa actualizada correctamente",
            data: result,
        });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).send({
                status: "error",
                message: "Datos inválidos: " + error.issues[0].message,
                campo: error.issues[0].path,
            });
        }
        if (error.message.includes("no encontrada")) {
            return res.status(404).send({
                status: "error",
                message: error.message,
            });
        }
        console.error("Error al actualizar mesa:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateTable = updateTable;
const deleteTable = async (req, res) => {
    try {
        const { id } = TableValidations_1.tableIdSchema.parse(req.params);
        const tableService = getService();
        const result = await tableService.delete(id);
        console.log("Mesa eliminada correctamente");
        return res.status(200).send({
            status: "success",
            message: "Mesa eliminada correctamente",
            data: result,
        });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).send({
                status: "error",
                message: "ID inválido: " + error.issues[0].message,
            });
        }
        if (error.message.includes("no encontrada")) {
            return res.status(404).send({
                status: "error",
                message: error.message,
            });
        }
        console.error("Error al eliminar mesa:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteTable = deleteTable;
const getTablesByZone = async (req, res) => {
    try {
        const { zone } = req.params;
        const tableService = getService();
        const data = await tableService.getByZone(zone);
        return res.status(200).send({
            status: "success",
            message: "Mesas de la zona obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las mesas de la zona: ${error.message}`,
        });
    }
};
exports.getTablesByZone = getTablesByZone;
const getTablesByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        if (!Object.values(Table_1.TableStatus).includes(status)) {
            return res.status(400).send({
                status: "error",
                message: `Estado inválido. Debe ser uno de: ${Object.values(Table_1.TableStatus).join(", ")}`,
            });
        }
        const tableService = getService();
        const data = await tableService.getByStatus(status);
        return res.status(200).send({
            status: "success",
            message: `Mesas con estado ${status} obtenidas correctamente`,
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las mesas por estado: ${error.message}`,
        });
    }
};
exports.getTablesByStatus = getTablesByStatus;
const getAvailableTables = async (req, res) => {
    try {
        const tableService = getService();
        const data = await tableService.getAvailableTables();
        return res.status(200).send({
            status: "success",
            message: "Mesas disponibles obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las mesas disponibles: ${error.message}`,
        });
    }
};
exports.getAvailableTables = getAvailableTables;
const updateTableStatus = async (req, res) => {
    try {
        const { id } = TableValidations_1.tableIdSchema.parse(req.params);
        const { status } = req.body;
        if (!status ||
            !Object.values(Table_1.TableStatus).includes(status)) {
            return res.status(400).send({
                status: "error",
                message: `Estado inválido. Debe ser uno de: ${Object.values(Table_1.TableStatus).join(", ")}`,
            });
        }
        const tableService = getService();
        const result = await tableService.updateTableStatus(id, status);
        console.log("Estado de mesa actualizado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Estado de mesa actualizado correctamente",
            data: result,
        });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).send({
                status: "error",
                message: "ID inválido: " + error.issues[0].message,
            });
        }
        if (error.message.includes("no encontrada")) {
            return res.status(404).send({
                status: "error",
                message: error.message,
            });
        }
        console.error("Error al actualizar estado de mesa:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateTableStatus = updateTableStatus;
