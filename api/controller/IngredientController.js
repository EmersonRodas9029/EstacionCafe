"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIngredientsByProduct = exports.deleteIngredient = exports.updateIngredient = exports.saveIngredient = exports.getIngredientById = exports.getIngredients = exports.setService = void 0;
const IngredientValidations_1 = require("../application/validations/IngredientValidations");
let service = null;
const setService = (ingredientService) => {
    service = ingredientService;
};
exports.setService = setService;
const getService = () => {
    if (!service) {
        throw new Error("Ingredient service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getIngredients = async (req, res) => {
    try {
        const result = await service.getAll();
        console.log("Ingredientes obtenidos correctamente");
        return res.status(200).send({
            status: "success",
            message: "Ingredientes obtenidos correctamente",
            data: result,
        });
    }
    catch (error) {
        console.error("Error al conseguir los ingredientes:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.getIngredients = getIngredients;
const getIngredientById = async (req, res) => {
    try {
        const { id } = IngredientValidations_1.ingredientIdSchema.parse(req.params);
        const ingredientService = getService();
        const data = await ingredientService.getById(id);
        console.log("Ingrediente obtenido correctamente");
        return res.status(200).send({
            status: "success",
            message: "Ingrediente obtenido correctamente",
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
            message: `Error al obtener el ingrediente: ${error.message}`,
        });
    }
};
exports.getIngredientById = getIngredientById;
const saveIngredient = async (req, res) => {
    try {
        const data = req.body;
        const validatedData = IngredientValidations_1.IngredientSchema.parse(data);
        const currentService = getService();
        const result = await currentService.save(validatedData);
        console.log("Ingrediente guardado correctamente");
        return res.status(201).send({
            status: "success",
            message: "Ingrediente guardado correctamente",
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
        console.error("Error al guardar el ingrediente:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.saveIngredient = saveIngredient;
const updateIngredient = async (req, res) => {
    try {
        const { id } = IngredientValidations_1.ingredientIdSchema.parse(req.params);
        const updateData = IngredientValidations_1.updateIngredientSchema.parse(req.body);
        const ingredientService = getService();
        const result = await ingredientService.update({
            ingredientId: id,
            ...updateData,
        });
        console.log("Ingrediente actualizado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Ingrediente actualizado correctamente",
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
        console.error("Error al actualizar ingrediente:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateIngredient = updateIngredient;
const deleteIngredient = async (req, res) => {
    try {
        const { id } = IngredientValidations_1.ingredientIdSchema.parse(req.params);
        const currentService = getService();
        const result = await currentService.delete(parseInt(String(id)));
        console.log("Ingrediente eliminado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Ingrediente eliminado correctamente",
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
        console.error("Error al eliminar ingrediente:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteIngredient = deleteIngredient;
const getIngredientsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const ingredientService = getService();
        const data = await ingredientService.getByProduct(parseInt(productId));
        return res.status(200).send({
            status: "success",
            message: "Ingredientes del producto obtenidos correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener los ingredientes del producto: ${error.message}`,
        });
    }
};
exports.getIngredientsByProduct = getIngredientsByProduct;
