"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchasesByDateRange = exports.getPurchasesBySupplier = exports.deletePurchase = exports.updatePurchase = exports.createPurchase = exports.getPurchaseById = exports.getPurchases = exports.setService = void 0;
const PurchaseValidations_1 = require("../application/validations/PurchaseValidations");
let service = null;
const setService = (purchaseService) => {
    service = purchaseService;
};
exports.setService = setService;
const getService = () => {
    if (!service) {
        throw new Error("Purchase service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getPurchases = async (req, res) => {
    try {
        const currentService = getService();
        const data = await currentService.getAll();
        return res.status(200).send({
            status: "success",
            message: "Compras obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las compras: ${error.message}`,
        });
    }
};
exports.getPurchases = getPurchases;
const getPurchaseById = async (req, res) => {
    try {
        const { id } = PurchaseValidations_1.purchaseIdSchema.parse(req.params);
        const purchaseService = getService();
        const data = await purchaseService.getById(id);
        return res.status(200).send({
            status: "success",
            message: "Compra obtenida correctamente",
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
            message: `Error al obtener la compra: ${error.message}`,
        });
    }
};
exports.getPurchaseById = getPurchaseById;
const createPurchase = async (req, res) => {
    try {
        const purchaseData = req.body;
        const currentService = getService();
        const result = await currentService.save(PurchaseValidations_1.createPurchaseSchema.parse(purchaseData));
        return res.status(201).send({
            status: "success",
            message: "Compra creada correctamente",
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
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.createPurchase = createPurchase;
const updatePurchase = async (req, res) => {
    try {
        const { id } = PurchaseValidations_1.purchaseIdSchema.parse(req.params);
        const updateData = PurchaseValidations_1.updatePurchaseSchema.parse(req.body);
        const purchaseService = getService();
        const result = await purchaseService.update({
            purchaseId: parseInt(String(id)),
            ...updateData,
        });
        return res.status(200).send({
            status: "success",
            message: "Compra actualizada correctamente",
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
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updatePurchase = updatePurchase;
const deletePurchase = async (req, res) => {
    try {
        const { id } = PurchaseValidations_1.purchaseIdSchema.parse(req.params);
        const currentService = getService();
        const result = await currentService.delete(parseInt(String(id)));
        return res.status(200).send({
            status: "success",
            message: "Compra eliminada correctamente",
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
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deletePurchase = deletePurchase;
const getPurchasesBySupplier = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const purchaseService = getService();
        const data = await purchaseService.getBySupplier(parseInt(supplierId));
        return res.status(200).send({
            status: "success",
            message: "Compras del proveedor obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las compras del proveedor: ${error.message}`,
        });
    }
};
exports.getPurchasesBySupplier = getPurchasesBySupplier;
const getPurchasesByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const purchaseService = getService();
        if (!startDate || !endDate) {
            return res.status(400).send({
                status: "error",
                message: "startDate y endDate son requeridos",
            });
        }
        const data = await purchaseService.getByDateRange(new Date(startDate), new Date(endDate));
        return res.status(200).send({
            status: "success",
            message: "Compras por rango de fecha obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las compras por rango de fecha: ${error.message}`,
        });
    }
};
exports.getPurchasesByDateRange = getPurchasesByDateRange;
