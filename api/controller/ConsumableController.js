"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConsumablesBySupplier = exports.deleteConsumable = exports.updateConsumable = exports.saveConsumable = exports.getConsumableById = exports.getConsumables = exports.setService = void 0;
const ConsumableValidations_1 = require("../application/validations/ConsumableValidations");
let service = null;
const setService = (consumableService) => {
    service = consumableService;
};
exports.setService = setService;
const getService = () => {
    if (!service) {
        throw new Error("Consumable service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getConsumables = async (req, res) => {
    try {
        const data = await service.getAll();
        return res.status(200).send({
            status: "success",
            message: "Consumibles obtenidos correctamente",
            data: data,
        });
    }
    catch (error) {
        console.error("Error al obtener los consumibles:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.getConsumables = getConsumables;
const getConsumableById = async (req, res) => {
    try {
        const { id } = ConsumableValidations_1.consumableIdSchema.parse(req.params);
        const consumableService = getService();
        const data = await consumableService.getById(id);
        console.log("Consumible obtenido correctamente");
        return res.status(200).send({
            status: "success",
            message: "Consumible obtenido correctamente",
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
        if (error.message.includes("no encontrado")) {
            return res.status(404).send({
                status: "error",
                message: error.message,
            });
        }
        return res.status(500).send({
            status: "error",
            message: `Error al obtener el consumible: ${error.message}`,
        });
    }
};
exports.getConsumableById = getConsumableById;
const saveConsumable = async (req, res) => {
    try {
        const data = req.body;
        const validatedData = ConsumableValidations_1.ConsumableSchema.parse(data);
        const currentService = getService();
        const result = await currentService.save(validatedData);
        return res.status(201).send({
            status: "success",
            message: "Consumible guardado correctamente",
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
        console.error("Error al guardar el consumible:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.saveConsumable = saveConsumable;
const updateConsumable = async (req, res) => {
    try {
        const { id } = ConsumableValidations_1.consumableIdSchema.parse(req.params);
        const updateData = ConsumableValidations_1.updateConsumableSchema.parse(req.body);
        const consumableService = getService();
        const result = await consumableService.update({
            consumableId: id,
            ...updateData,
        });
        console.log("Consumible actualizado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Consumible actualizado correctamente",
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
        if (error.message.includes("no encontrado")) {
            return res.status(404).send({
                status: "error",
                message: error.message,
            });
        }
        console.error("Error al actualizar consumible:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateConsumable = updateConsumable;
const deleteConsumable = async (req, res) => {
    try {
        const { id } = ConsumableValidations_1.consumableIdSchema.parse(req.params);
        const currentService = getService();
        const result = await currentService.delete(parseInt(String(id)));
        console.log("Consumible eliminado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Consumible eliminado correctamente",
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
        if (error.message.includes("no encontrado")) {
            return res.status(404).send({
                status: "error",
                message: error.message,
            });
        }
        console.error("Error al eliminar consumible:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteConsumable = deleteConsumable;
const getConsumablesBySupplier = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const consumableService = getService();
        const data = await consumableService.getBySupplier(parseInt(supplierId));
        return res.status(200).send({
            status: "success",
            message: "Consumibles del proveedor obtenidos correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener los consumibles del proveedor: ${error.message}`,
        });
    }
};
exports.getConsumablesBySupplier = getConsumablesBySupplier;
