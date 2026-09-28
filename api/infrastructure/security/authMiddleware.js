"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.initializeAuthMiddleware = void 0;
let tokenService = null;
const initializeAuthMiddleware = (service) => {
    tokenService = service;
};
exports.initializeAuthMiddleware = initializeAuthMiddleware;
const verifyToken = async (req, res, next) => {
    try {
        if (process.env.SECURITY_MODE === "develop" && req.method !== "DELETE") {
            next();
            return;
        }
        // Obtener token del header Authorization o cookies
        const token = req.headers?.authorization?.replace("Bearer ", "") ||
            req.cookies?.auth_token;
        if (!token) {
            return res.status(401).send({
                status: "error",
                message: "Token no proporcionado",
            });
        }
        if (!tokenService) {
            return res.status(500).send({
                status: "error",
                message: "Servicio de tokens no inicializado",
            });
        }
        const data = await tokenService.verifyToken(token);
        req.user = data;
        console.log(data);
        next();
    }
    catch (error) {
        return res.status(401).send({
            status: "error",
            message: "Token inválido o expirado",
            error: error.message,
        });
    }
};
exports.verifyToken = verifyToken;
