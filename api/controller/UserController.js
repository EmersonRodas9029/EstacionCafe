"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.getUsersByType = exports.deleteUser = exports.updateUser = exports.saveUser = exports.getUserById = exports.getUsers = exports.setServices = void 0;
const UserValidations_1 = require("../application/validations/UserValidations");
let service = null;
let tokenService = null;
const setServices = (userService, securityService) => {
    service = userService;
    tokenService = securityService;
};
exports.setServices = setServices;
const getService = () => {
    if (!service) {
        throw new Error("User service no está inicializado. Llama a setService primero.");
    }
    return service;
};
const getUsers = async (req, res) => {
    try {
        const data = await service.getAll();
        console.log("Usuarios obtenidos correctamente");
        return res.status(200).send({
            status: "success",
            message: "Usuarios obtenidos correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener los usuarios: ${error.message}`,
        });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = UserValidations_1.userIdSchema.parse(req.params);
        const userService = getService();
        const data = await userService.getById(id);
        console.log("Usuario obtenido correctamente");
        return res.status(200).send({
            status: "success",
            message: "Usuario obtenido correctamente",
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
            message: `Error al obtener el usuario: ${error.message}`,
        });
    }
};
exports.getUserById = getUserById;
const saveUser = async (req, res) => {
    try {
        const userData = req.body;
        const result = await service.save(UserValidations_1.createUserSchema.parse(userData));
        console.log("Usuario creado correctamente");
        return res.status(201).send({
            status: "success",
            message: "Usuario creado correctamente",
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
        console.error("Error al crear usuario:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.saveUser = saveUser;
const updateUser = async (req, res) => {
    try {
        const { id } = UserValidations_1.userIdSchema.parse(req.params);
        const updateData = UserValidations_1.updateUserSchema.parse(req.body);
        const userService = getService();
        const result = await userService.update({
            userId: id,
            ...updateData,
        });
        console.log("Usuario actualizado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Usuario actualizado correctamente",
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
        console.error("Error al actualizar usuario:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = UserValidations_1.userIdSchema.parse(req.params);
        const result = await service.delete(parseInt(String(id)));
        console.log("Usuario eliminado correctamente");
        return res.status(200).send({
            status: "success",
            message: "Usuario eliminado correctamente",
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
        console.error("Error al eliminar usuario:", error);
        return res.status(500).send({
            status: "error",
            message: `Error interno del servidor: ${error.message}`,
        });
    }
};
exports.deleteUser = deleteUser;
const getUsersByType = async (req, res) => {
    try {
        const { typeId } = req.params;
        const userService = getService();
        const data = await userService.getUsersByType(parseInt(typeId));
        return res.status(200).send({
            status: "success",
            message: "Usuarios por tipo obtenidos correctamente",
            data: data,
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al obtener los usuarios por tipo: ${error.message}`,
        });
    }
};
exports.getUsersByType = getUsersByType;
const login = async (req, res) => {
    try {
        const data = req.body;
        const token = await tokenService?.generateToken(data);
        return res
            .status(200)
            .cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60,
        })
            .send({
            status: "success",
            message: "Inicio de sesión exitoso",
            data: {
                token: token,
                expiresIn: "1 hora",
            },
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al iniciar sesión: ${error.message}`,
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        res.clearCookie("auth_token");
        return res.status(200).send({
            status: "success",
            message: "Sesión cerrada",
        });
    }
    catch (error) {
        return res.status(500).send({
            status: "error",
            message: `Error al cerrar sesión: ${error.message}`,
        });
    }
};
exports.logout = logout;
