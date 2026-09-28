"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const bcrypt = __importStar(require("bcrypt"));
const console_1 = require("console");
class TokenService {
    constructor(userService) {
        this.userService = userService;
        this.secret = process.env.JWT_SECRET || "secret";
        this.generateToken = async (payload) => {
            try {
                const dbData = await this.userService.getPasswordAndRole(payload.username);
                if (!dbData) {
                    throw new Error("Usuario no encontrado");
                }
                const isMatch = await bcrypt.compare(payload.password, dbData.password);
                if (!isMatch) {
                    console.log("Las contraseñas no coincidieron");
                    throw (0, console_1.error)("Contraseña o usarname incorrecto");
                }
                return jwt.sign({
                    userId: dbData.userId,
                    username: payload.username,
                    role: dbData?.role,
                    timestamp: Date.now(),
                }, this.secret, {
                    expiresIn: "3h",
                });
            }
            catch (error) {
                throw new Error(error.message);
            }
        };
        this.verifyToken = async (token) => {
            try {
                const decodedPayload = jwt.verify(token, this.secret);
                return decodedPayload;
            }
            catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    console.error("Error: El token ha expirado.");
                    throw new Error("Token expired");
                }
                else {
                    console.error("Error: El token no es válido o ha sido alterado.", error.message);
                    throw new Error("Invalid token");
                }
            }
        };
        this.userService = userService;
    }
}
exports.TokenService = TokenService;
