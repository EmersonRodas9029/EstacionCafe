"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumableTypeService = void 0;
const ConsumableType_1 = require("../../core/entities/ConsumableType");
class ConsumableTypeService {
    constructor(ConsumableTypeRepository) {
        this.ConsumableTypeRepository = ConsumableTypeRepository;
        this.ConsumableTypeRepository = ConsumableTypeRepository;
    }
    async save(body) {
        const consumableType = new ConsumableType_1.ConsumableType();
        consumableType.name = body.name;
        return await this.ConsumableTypeRepository.save(consumableType);
    }
    async saveAll(ConsumableTypes) {
        const ConsumableTypeEntities = ConsumableTypes.map((body) => {
            const consumableType = new ConsumableType_1.ConsumableType();
            consumableType.name = body.name;
            return consumableType;
        });
        return await this.ConsumableTypeRepository.save(ConsumableTypeEntities);
    }
    async delete(id) {
        const result = await this.ConsumableTypeRepository.delete(id);
        if (result.affected === 0) {
            throw new Error(`Tipo de consumible con ID ${id} no encontrado`);
        }
    }
    async update(body) {
        const consumableType = await this.ConsumableTypeRepository.findOne({
            where: { consumableTypeId: body.consumableTypeId },
        });
        if (!consumableType) {
            throw new Error(`Tipo de consumible con ID ${body.consumableTypeId} no encontrado`);
        }
        if (body.name !== undefined)
            consumableType.name = body.name;
        return await this.ConsumableTypeRepository.save(consumableType);
    }
    async getAll() {
        return await this.ConsumableTypeRepository.find();
    }
    async getById(id) {
        return await this.ConsumableTypeRepository.findOne({
            where: { consumableTypeId: id },
        });
    }
}
exports.ConsumableTypeService = ConsumableTypeService;
