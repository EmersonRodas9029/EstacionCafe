"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductType = exports.updateProductType = exports.saveProductType = exports.getProductTypeById = exports.getProductTypes = exports.setService = void 0;
const ProductTypeValidations_1 = require("../application/validations/ProductTypeValidations");
let service = null;
const setService = (productTypeService) => {
    service = productTypeService;
};
exports.setService = setService;
const getService = () => {
    if (!service) {
        throw new Error("ProductType service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getProductTypes = async (req, res) => {
    try {
        const productTypes = await service.getAll();
        console.log("Tipos de producto obtenidos correctamente");
        const productTypeDTOs = productTypes.map((productType) => ({
            productTypeId: productType.productTypeId,
            name: productType.name,
        }));
        return res.status(200).send({
            status: "success",
            message: "Tipos de producto obtenidos correctamente",
            data: productTypeDTOs,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener los tipos de producto: " + error.message,
        });
    }
};
exports.getProductTypes = getProductTypes;
const getProductTypeById = async (req, res) => {
    try {
        const { id } = ProductTypeValidations_1.productTypeIdSchema.parse(req.params);
        const productTypeService = getService();
        const data = await productTypeService.getById(id);
        console.log("Tipo de producto obtenido correctamente");
        return res.status(200).send({
            status: "success",
            message: "Tipo de producto obtenido correctamente",
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
            message: `Error al obtener el tipo de producto: ${error.message}`,
        });
    }
};
exports.getProductTypeById = getProductTypeById;
const saveProductType = async (req, res) => {
    try {
        const productTypeData = req.body;
        const validatedData = ProductTypeValidations_1.createProductTypeSchema.parse(productTypeData);
        const currentService = getService();
        const result = await currentService.save(validatedData);
        console.log("Tipo de producto guardado correctamente");
        return res.status(201).send({
            status: "success",
            message: "El tipo de producto se guardó correctamente",
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
        console.error("Error al guardar tipo de producto:", error);
        return res.status(500).send({
            status: "error",
            message: "Error interno del servidor: " + error.message,
        });
    }
};
exports.saveProductType = saveProductType;
const updateProductType = async (req, res) => {
    try {
        const { id } = ProductTypeValidations_1.productTypeIdSchema.parse(req.params);
        const updateData = ProductTypeValidations_1.updateProductTypeSchema.parse(req.body);
        const productTypeService = getService();
        const result = await productTypeService.update({
            productTypeId: id,
            ...updateData,
        });
        console.log("Tipo de producto actualizado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Tipo de producto actualizado correctamente",
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
        console.error("Error al actualizar tipo de producto:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateProductType = updateProductType;
const deleteProductType = async (req, res) => {
    try {
        const { id } = ProductTypeValidations_1.productTypeIdSchema.parse(req.params);
        const currentService = getService();
        const result = await currentService.delete(parseInt(String(id)));
        console.log("Tipo de producto eliminado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Tipo de producto eliminado correctamente",
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
        console.error("Error al eliminar tipo de producto:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteProductType = deleteProductType;
