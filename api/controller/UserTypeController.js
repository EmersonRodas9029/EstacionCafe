"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserType = exports.updateUserType = exports.saveUserType = exports.getUserTypeById = exports.getUserTypes = exports.setService = void 0;
const UserTypeValidations_1 = require("../application/validations/UserTypeValidations");
let service = null;
const setService = (userTypeService) => {
    service = userTypeService;
};
exports.setService = setService;
const getService = () => {
    if (!service) {
        throw new Error("UserType service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getUserTypes = async (req, res) => {
    try {
        const data = await service.getAll();
        console.log("Tipos de usuario obtenidos correctamente");
        return res.status(200).send({
            status: "success",
            message: "Tipos de usuario obtenidos correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener los tipos de usuario: ${error.message}`,
        });
    }
};
exports.getUserTypes = getUserTypes;
const getUserTypeById = async (req, res) => {
    try {
        const { id } = UserTypeValidations_1.userTypeIdSchema.parse(req.params);
        const userTypeService = getService();
        const data = await userTypeService.getById(id);
        console.log("Tipo de usuario obtenido correctamente");
        return res.status(200).send({
            status: "success",
            message: "Tipo de usuario obtenido correctamente",
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
            message: `Error al obtener el tipo de usuario: ${error.message}`,
        });
    }
};
exports.getUserTypeById = getUserTypeById;
const saveUserType = async (req, res) => {
    try {
        const userTypeData = req.body;
        const result = await service.save(UserTypeValidations_1.createUserTypeSchema.parse(userTypeData));
        console.log("Tipo de usuario creado correctamente");
        return res.status(201).send({
            status: "success",
            message: "Tipo de usuario creado correctamente",
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
        console.error("Error al crear tipo de usuario:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.saveUserType = saveUserType;
const updateUserType = async (req, res) => {
    try {
        const { id } = UserTypeValidations_1.userTypeIdSchema.parse(req.params);
        const updateData = UserTypeValidations_1.updateUserTypeSchema.parse(req.body);
        const userTypeService = getService();
        const result = await userTypeService.update({
            userTypeId: id,
            ...updateData,
        });
        console.log("Tipo de usuario actualizado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Tipo de usuario actualizado correctamente",
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
        console.error("Error al actualizar tipo de usuario:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateUserType = updateUserType;
const deleteUserType = async (req, res) => {
    try {
        const { id } = UserTypeValidations_1.userTypeIdSchema.parse(req.params);
        const result = await service.delete(parseInt(String(id)));
        console.log("Tipo de usuario eliminado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Tipo de usuario eliminado correctamente",
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
        console.error("Error al eliminar tipo de usuario:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteUserType = deleteUserType;
