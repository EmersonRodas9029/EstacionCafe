"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConsumableType = exports.updateConsumableType = exports.saveConsumableType = exports.getConsumableTypeById = exports.getConsumableTypes = exports.setService = void 0;
const ConsumableTypeValidations_1 = require("../application/validations/ConsumableTypeValidations");
let service = null;
const setService = (consumableTypeService) => {
    service = consumableTypeService;
};
exports.setService = setService;
const getService = () => {
    if (!service) {
        throw new Error("ConsumableType service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getConsumableTypes = async (req, res) => {
    try {
        const data = await service.getAll();
        return res.status(200).send({
            status: "success",
            message: "Tipos de consumibles obtenidos correctamente",
            data: data,
        });
    }
    catch (error) {
        console.error("Error al obtener los tipos de consumibles:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.getConsumableTypes = getConsumableTypes;
const getConsumableTypeById = async (req, res) => {
    try {
        const { id } = ConsumableTypeValidations_1.consumableTypeIdSchema.parse(req.params);
        const consumableTypeService = getService();
        const data = await consumableTypeService.getById(id);
        console.log("Tipo de consumible obtenido correctamente");
        return res.status(200).send({
            status: "success",
            message: "Tipo de consumible obtenido correctamente",
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
            message: `Error al obtener el tipo de consumible: ${error.message}`,
        });
    }
};
exports.getConsumableTypeById = getConsumableTypeById;
const saveConsumableType = async (req, res) => {
    try {
        const data = req.body;
        const validatedData = ConsumableTypeValidations_1.ConsumableTypeSchema.parse(data);
        const currentService = getService();
        const result = await currentService.save(validatedData);
        return res.status(201).send({
            status: "success",
            message: "Tipo de consumible guardado correctamente",
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
        console.error("Error al guardar el tipo de consumible:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.saveConsumableType = saveConsumableType;
const updateConsumableType = async (req, res) => {
    try {
        const { id } = ConsumableTypeValidations_1.consumableTypeIdSchema.parse(req.params);
        const updateData = ConsumableTypeValidations_1.updateConsumableTypeSchema.parse(req.body);
        const consumableTypeService = getService();
        const result = await consumableTypeService.update({
            consumableTypeId: id,
            ...updateData,
        });
        console.log("Tipo de consumible actualizado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Tipo de consumible actualizado correctamente",
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
        console.error("Error al actualizar tipo de consumible:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateConsumableType = updateConsumableType;
const deleteConsumableType = async (req, res) => {
    try {
        const { id } = ConsumableTypeValidations_1.consumableTypeIdSchema.parse(req.params);
        const currentService = getService();
        const result = await currentService.delete(parseInt(String(id)));
        console.log("Tipo de consumible eliminado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Tipo de consumible eliminado correctamente",
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
        console.error("Error al eliminar tipo de consumible:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteConsumableType = deleteConsumableType;
