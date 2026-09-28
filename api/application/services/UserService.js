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
exports.UserService = void 0;
const User_1 = require("../../core/entities/User");
const bcrypt = __importStar(require("bcrypt"));
class UserService {
    constructor(userRepo) {
        this.userRepository = userRepo;
    }
    async saveAll(body) {
        const users = await Promise.all(body.map(async (userData) => {
            const user = new User_1.User();
            user.username = userData.username;
            user.password = await this.encryptPassword(userData.password);
            user.userTypeId = userData.typeId;
            user.email = userData.email;
            return user;
        }));
        return await this.userRepository.save(users);
    }
    async save(body) {
        const userData = body;
        const user = new User_1.User();
        user.username = userData.username;
        user.password = await this.encryptPassword(userData.password);
        user.userTypeId = userData.typeId;
        user.email = userData.email;
        console.log("Guardando usuario...");
        return await this.userRepository.save(user);
    }
    async delete(id) {
        const user = await this.getById(id);
        user.active = false;
        await this.userRepository.save(user);
        return { message: "Usuario desactivado correctamente", id };
    }
    async update(body) {
        const { userId, ...updateData } = body;
        if (!userId) {
            throw new Error("userId es requerido para actualizar");
        }
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user) {
            throw new Error(`Usuario con ID ${userId} no encontrado`);
        }
        if (updateData.password) {
            updateData.password = await this.encryptPassword(updateData.password);
        }
        // Mapear typeId a userTypeId
        if (updateData.typeId) {
            updateData.userTypeId = updateData.typeId;
            delete updateData.typeId;
        }
        Object.assign(user, updateData);
        return await this.userRepository.save(user);
    }
    async getAll() {
        console.log(`Obteniendo usuarios...`);
        return this.userRepository.find({
            relations: ["userType"],
            order: { username: "ASC" },
        });
    }
    async getById(id) {
        const user = await this.userRepository.findOne({
            where: { userId: id },
            relations: ["userType"],
        });
        if (!user) {
            throw new Error(`Usuario con ID ${id} no encontrado`);
        }
        return user;
    }
    async getUsersByType(typeId) {
        return await this.userRepository.find({
            where: { userTypeId: typeId },
            relations: ["userType"],
            order: { username: "ASC" },
        });
    }
    async getUserByUsername(username) {
        return await this.userRepository.findOne({
            where: { username },
            relations: ["userType"],
        });
    }
    async encryptPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }
    async getPasswordAndRole(username) {
        const user = await this.userRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.userType", "userType")
            .select([
            "user.userId",
            "user.username",
            "user.password",
            "userType.name",
        ])
            .where("user.username = :username", { username })
            .getOne();
        if (!user) {
            return null;
        }
        const data = {
            userId: user.userId,
            username: user.username,
            role: user.userType.name,
            password: user.password,
        };
        return data;
    }
}
exports.UserService = UserService;
