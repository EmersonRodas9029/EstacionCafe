"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeBillsByTable = exports.getBillsByTable = exports.getBillsByCustomer = exports.getBillsByDateRange = exports.deleteBill = exports.updateBill = exports.saveBill = exports.getBillById = exports.getBills = exports.setService = void 0;
const BillValidations_1 = require("../application/validations/BillValidations");
let service = null;
const setService = (billService) => {
    service = billService;
};
exports.setService = setService;
const getService = () => {
    if (!service) {
        throw new Error("Bill service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getBills = async (req, res) => {
    try {
        const data = await service.getAll();
        console.log("Facturas obtenidas correctamente");
        return res.status(200).send({
            status: "success",
            message: "Facturas obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las facturas: ${error.message}`,
        });
    }
};
exports.getBills = getBills;
const getBillById = async (req, res) => {
    try {
        const { id } = BillValidations_1.billIdSchema.parse(req.params);
        const billService = getService();
        const data = await billService.getById(id);
        console.log("Factura obtenida correctamente");
        return res.status(200).send({
            status: "success",
            message: "Factura obtenida correctamente",
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
            message: `Error al obtener la factura: ${error.message}`,
        });
    }
};
exports.getBillById = getBillById;
const saveBill = async (req, res) => {
    try {
        const billData = req.body;
        const result = await service.save(BillValidations_1.createBillSchema.parse(billData));
        console.log("Factura creada correctamente");
        return res.status(201).send({
            status: "success",
            message: "Factura creada correctamente",
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
        console.error("Error al crear factura:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.saveBill = saveBill;
const updateBill = async (req, res) => {
    try {
        const { id } = BillValidations_1.billIdSchema.parse(req.params);
        const updateData = BillValidations_1.updateBillSchema.parse(req.body);
        const billService = getService();
        const result = await billService.update({
            billId: id,
            ...updateData,
        });
        console.log("Factura actualizada correctamente");
        return res.status(200).send({
            status: "success",
            message: "Factura actualizada correctamente",
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
        console.error("Error al actualizar factura:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateBill = updateBill;
const deleteBill = async (req, res) => {
    try {
        const { id } = BillValidations_1.billIdSchema.parse(req.params);
        const result = await service.delete(parseInt(String(id)));
        console.log("Factura eliminada correctamente");
        return res.status(200).send({
            status: "success",
            message: "Factura eliminada correctamente",
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
        console.error("Error al eliminar factura:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteBill = deleteBill;
const getBillsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const billService = getService();
        if (!startDate || !endDate) {
            return res.status(400).send({
                status: "error",
                message: "startDate y endDate son requeridos",
            });
        }
        const data = await billService.getByDateRange(new Date(startDate), new Date(endDate));
        return res.status(200).send({
            status: "success",
            message: "Facturas obtenidas por rango de fecha correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las facturas por rango de fecha: ${error.message}`,
        });
    }
};
exports.getBillsByDateRange = getBillsByDateRange;
const getBillsByCustomer = async (req, res) => {
    try {
        const { customer } = req.params;
        const billService = getService();
        const data = await billService.getBillsByCustomer(customer);
        return res.status(200).send({
            status: "success",
            message: "Facturas del cliente obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las facturas del cliente: ${error.message}`,
        });
    }
};
exports.getBillsByCustomer = getBillsByCustomer;
const getBillsByTable = async (req, res) => {
    try {
        const { tableId } = req.params;
        const billService = getService();
        const data = await billService.getBillsByTable(tableId);
        return res.status(200).send({
            status: "success",
            message: "Facturas de la mesa obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las facturas de la mesa: ${error.message}`,
        });
    }
};
exports.getBillsByTable = getBillsByTable;
const closeBillsByTable = async (req, res) => {
    try {
        const { tableId } = BillValidations_1.tableIdSchema.parse(req.params);
        const billService = getService();
        const result = await billService.closeBillsByTable(tableId);
        return res.status(200).send({
            status: "success",
            message: `Se cerraron ${result.updated} facturas de la mesa ${tableId}`,
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
        console.error("Error al cerrar facturas por mesa:", error);
        return res.status(500).send({
            status: "error",
            message: `Error al cerrar las facturas de la mesa: ${error.message}`,
        });
    }
};
exports.closeBillsByTable = closeBillsByTable;
