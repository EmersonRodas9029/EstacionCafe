"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCashRegisterByNumber = exports.getActiveCashRegisters = exports.deleteCashRegister = exports.updateCashRegister = exports.saveCashRegister = exports.getCashRegisterById = exports.getCashRegisters = exports.setService = void 0;
const CashRegisterValidations_1 = require("../application/validations/CashRegisterValidations");
let service = null;
const setService = (cashRegisterService) => {
    service = cashRegisterService;
};
exports.setService = setService;
const getService = () => {
    if (!service) {
        throw new Error("CashRegister service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getCashRegisters = async (req, res) => {
    try {
        const data = await service.getAll();
        console.log("Cajas registradoras obtenidas correctamente");
        return res.status(200).send({
            status: "success",
            message: "Cajas registradoras obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las cajas registradoras: ${error.message}`,
        });
    }
};
exports.getCashRegisters = getCashRegisters;
const getCashRegisterById = async (req, res) => {
    try {
        const { id } = CashRegisterValidations_1.cashRegisterIdSchema.parse(req.params);
        const cashRegisterService = getService();
        const data = await cashRegisterService.getById(id);
        console.log("Caja registradora obtenida correctamente");
        return res.status(200).send({
            status: "success",
            message: "Caja registradora obtenida correctamente",
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
            message: `Error al obtener la caja registradora: ${error.message}`,
        });
    }
};
exports.getCashRegisterById = getCashRegisterById;
const saveCashRegister = async (req, res) => {
    try {
        const cashRegisterData = req.body;
        const result = await service.save(CashRegisterValidations_1.createCashRegisterSchema.parse(cashRegisterData));
        console.log("Caja registradora creada correctamente");
        return res.status(201).send({
            status: "success",
            message: "Caja registradora creada correctamente",
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
        console.error("Error al crear caja registradora:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.saveCashRegister = saveCashRegister;
const updateCashRegister = async (req, res) => {
    try {
        const { id } = CashRegisterValidations_1.cashRegisterIdSchema.parse(req.params);
        const updateData = CashRegisterValidations_1.updateCashRegisterSchema.parse(req.body);
        const cashRegisterService = getService();
        const result = await cashRegisterService.update({
            cashRegisterId: id,
            ...updateData,
        });
        console.log("Caja registradora actualizada correctamente");
        return res.status(200).send({
            status: "success",
            message: "Caja registradora actualizada correctamente",
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
        console.error("Error al actualizar caja registradora:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateCashRegister = updateCashRegister;
const deleteCashRegister = async (req, res) => {
    try {
        const { id } = CashRegisterValidations_1.cashRegisterIdSchema.parse(req.params);
        const result = await service.delete(parseInt(String(id)));
        console.log("Caja registradora eliminada correctamente");
        return res.status(200).send({
            status: "success",
            message: "Caja registradora eliminada correctamente",
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
        console.error("Error al eliminar caja registradora:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteCashRegister = deleteCashRegister;
const getActiveCashRegisters = async (req, res) => {
    try {
        const cashRegisterService = getService();
        const data = await cashRegisterService.getActiveCashRegisters();
        console.log("Cajas registradoras activas obtenidas correctamente");
        return res.status(200).send({
            status: "success",
            message: "Cajas registradoras activas obtenidas correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener las cajas registradoras activas: ${error.message}`,
        });
    }
};
exports.getActiveCashRegisters = getActiveCashRegisters;
const getCashRegisterByNumber = async (req, res) => {
    try {
        const { number } = req.params;
        const cashRegisterService = getService();
        const data = await cashRegisterService.getByNumber(number);
        return res.status(200).send({
            status: "success",
            message: "Caja registradora por número obtenida correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener la caja registradora por número: ${error.message}`,
        });
    }
};
exports.getCashRegisterByNumber = getCashRegisterByNumber;
