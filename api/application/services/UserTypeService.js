"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTypeService = void 0;
const UserType_1 = require("../../core/entities/UserType");
class UserTypeService {
    constructor(typeRepository) {
        this.typeRepo = typeRepository;
    }
    async save(body) {
        const type = new UserType_1.UserType();
        type.name = body.name;
        type.permissionLevel = body.permissionLevel;
        console.log("Guardando tipo de usuario...");
        return this.typeRepo.save(type);
    }
    async saveAll(body) {
        const userTypes = body.map(data => {
            const type = new UserType_1.UserType();
            type.name = data.name;
            type.permissionLevel = data.permissionLevel;
            return type;
        });
        return await this.typeRepo.save(userTypes);
    }
    async delete(id) {
        const result = await this.typeRepo.delete(id);
        if (result.affected === 0) {
            throw new Error(`Tipo de usuario con ID ${id} no encontrado`);
        }
        return { message: "Tipo de usuario eliminado correctamente", id };
    }
    async update(body) {
        const { userTypeId, ...updateData } = body;
        if (!userTypeId) {
            throw new Error("userTypeId es requerido para actualizar");
        }
        const userType = await this.typeRepo.findOne({ where: { userTypeId } });
        if (!userType) {
            throw new Error(`Tipo de usuario con ID ${userTypeId} no encontrado`);
        }
        Object.assign(userType, updateData);
        return await this.typeRepo.save(userType);
    }
    async getAll() {
        console.log(`Obteniendo tipos de usuarios...`);
        return this.typeRepo.find({
            order: { permissionLevel: "ASC" }
        });
    }
    async getById(id) {
        const userType = await this.typeRepo.findOne({ where: { userTypeId: id } });
        if (!userType) {
            throw new Error(`Tipo de usuario con ID ${id} no encontrado`);
        }
        return userType;
    }
    async getByPermissionLevel(level) {
        return await this.typeRepo.find({
            where: { permissionLevel: level },
            order: { name: "ASC" }
        });
    }
}
exports.UserTypeService = UserTypeService;
