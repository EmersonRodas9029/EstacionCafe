"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveSuppliers = exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSupplierById = exports.getSuppliers = exports.setService = void 0;
const SupplierValidations_1 = require("../application/validations/SupplierValidations");
let service;
const setService = (supplierService) => {
    service = supplierService;
};
exports.setService = setService;
const getSuppliers = async (req, res) => {
    try {
        const data = await service.getAll();
        console.log("Proveedores obtenidos correctamente");
        return res.status(200).send({
            status: "success",
            message: "Proveedores obtenidos correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener los proveedores: ${error}`,
        });
    }
};
exports.getSuppliers = getSuppliers;
const getSupplierById = async (req, res) => {
    try {
        const { id } = SupplierValidations_1.supplierIdSchema.parse(req.params);
        const supplierService = service;
        const data = await supplierService.getById(id);
        console.log("Proveedor obtenido correctamente");
        return res.status(200).send({
            status: "success",
            message: "Proveedor obtenido correctamente",
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
            message: `Error al obtener el proveedor: ${error.message}`,
        });
    }
};
exports.getSupplierById = getSupplierById;
const createSupplier = async (req, res) => {
    try {
        const supplierData = req.body;
        const result = await service.save(SupplierValidations_1.createSupplierSchema.parse(supplierData));
        console.log("Proveedor creado correctamente");
        return res.status(201).send({
            status: "success",
            message: "Proveedor creado correctamente",
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
        console.error("Error al crear proveedor:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.createSupplier = createSupplier;
const updateSupplier = async (req, res) => {
    try {
        const { id } = SupplierValidations_1.supplierIdSchema.parse(req.params);
        const updateData = SupplierValidations_1.updateSupplierSchema.parse(req.body);
        const supplierService = service;
        const result = await supplierService.update({
            supplierId: id,
            ...updateData,
        });
        console.log("Proveedor actualizado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Proveedor actualizado correctamente",
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
        console.error("Error al actualizar proveedor:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (req, res) => {
    try {
        const { id } = SupplierValidations_1.supplierIdSchema.parse(req.params);
        const result = await service.delete(id);
        console.log("Proveedor eliminado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Proveedor eliminado correctamente",
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
        console.error("Error al eliminar proveedor:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteSupplier = deleteSupplier;
const getActiveSuppliers = async (req, res) => {
    try {
        const supplierService = service;
        const data = await supplierService.getActiveSuppliers();
        console.log("Proveedores activos obtenidos correctamente");
        return res.status(200).send({
            status: "success",
            message: "Proveedores activos obtenidos correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener los proveedores activos: ${error}`,
        });
    }
};
exports.getActiveSuppliers = getActiveSuppliers;
