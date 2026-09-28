"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveProducts = exports.deleteProduct = exports.updateProduct = exports.saveProduct = exports.getProductById = exports.getProducts = exports.setService = void 0;
const ProductValidations_1 = require("../application/validations/ProductValidations");
let service = null;
const setService = (productService) => {
    service = productService;
};
exports.setService = setService;
const getService = () => {
    if (!service) {
        throw new Error("Product service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getProducts = async (req, res) => {
    try {
        const products = await service.getAll();
        console.log("Productos obtenidos correctamente");
        const productDTOs = products.map((product) => ({
            productId: product.productId,
            name: product.name,
            description: product.description,
            price: product.price,
            cost: product.cost,
            productTypeId: product.productTypeId,
            active: product.active,
        }));
        return res.status(200).send({
            status: "success",
            message: "Productos obtenidos correctamente",
            data: productDTOs,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener los productos: " + error.message,
        });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = ProductValidations_1.productIdSchema.parse(req.params);
        const productService = getService();
        const data = await productService.getById(id);
        console.log("Producto obtenido correctamente");
        return res.status(200).send({
            status: "success",
            message: "Producto obtenido correctamente",
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
            message: `Error al obtener el producto: ${error.message}`,
        });
    }
};
exports.getProductById = getProductById;
const saveProduct = async (req, res) => {
    try {
        const productData = req.body;
        const validatedData = ProductValidations_1.createProductSchema.parse(productData);
        const currentService = getService();
        const result = await currentService.save(validatedData);
        console.log("Producto guardado correctamente");
        return res.status(201).send({
            status: "success",
            message: "El producto se guardó correctamente",
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
        console.error("Error al guardar producto:", error);
        return res.status(500).send({
            status: "error",
            message: "Error interno del servidor: " + error.message,
        });
    }
};
exports.saveProduct = saveProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = ProductValidations_1.productIdSchema.parse(req.params);
        const updateData = ProductValidations_1.updateProductSchema.parse(req.body);
        const productService = getService();
        const result = await productService.update({
            productId: id,
            ...updateData,
        });
        console.log("Producto actualizado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Producto actualizado correctamente",
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
        console.error("Error al actualizar producto:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = ProductValidations_1.productIdSchema.parse(req.params);
        const currentService = getService();
        const result = await currentService.delete(parseInt(String(id)));
        console.log("Producto eliminado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Producto eliminado correctamente",
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
        console.error("Error al eliminar producto:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteProduct = deleteProduct;
const getActiveProducts = async (req, res) => {
    try {
        const productService = getService();
        const data = await productService.getActiveProducts();
        console.log("Productos activos obtenidos correctamente");
        return res.status(200).send({
            status: "success",
            message: "Productos activos obtenidos correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener los productos activos: ${error.message}`,
        });
    }
};
exports.getActiveProducts = getActiveProducts;
