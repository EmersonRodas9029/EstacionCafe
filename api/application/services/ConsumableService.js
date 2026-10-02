"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumableService = void 0;
const Consumable_1 = require("../../core/entities/Consumable");
class ConsumableService {
    constructor(consumableRepository) {
        this.consumableRepository = consumableRepository;
        this.consumableRepository = consumableRepository;
    }
    async save(body) {
        const consumable = new Consumable_1.Consumable();
        consumable.supplierId = body.supplierId;
        consumable.name = body.name;
        consumable.cosumableTypeId = body.cosumableTypeId;
        consumable.cost = body.cost;
        consumable.quantity = body.quantity;
        consumable.unitMeasurement = body.unitMeasurement;
        return await this.consumableRepository.save(consumable);
    }
    async saveAll(consumables) {
        const consumableEntities = consumables.map((body) => {
            const consumable = new Consumable_1.Consumable();
            consumable.supplierId = body.supplierId;
            consumable.name = body.name;
            consumable.cosumableTypeId = body.cosumableTypeId;
            consumable.cost = body.cost;
            consumable.quantity = body.quantity;
            consumable.unitMeasurement = body.unitMeasurement;
            return consumable;
        });
        return await this.consumableRepository.save(consumableEntities);
    }
    async delete(id) {
        const consumable = await this.getById(id);
        consumable.active = false;
        await this.consumableRepository.save(consumable);
        return { message: "Consumible desactivado correctamente", id };
    }
    async update(body) {
        const { consumableId, ...updateData } = body;
        if (!consumableId) {
            throw new Error("consumableId es requerido para actualizar");
        }
        const consumable = await this.consumableRepository.findOne({
            where: { consumableId },
        });
        if (!consumable) {
            throw new Error(`Consumible con ID ${consumableId} no encontrado`);
        }
        if (updateData.supplier !== undefined)
            consumable.supplierId = updateData.supplier;
        if (updateData.name !== undefined)
            consumable.name = updateData.name;
        if (updateData.TypeId !== undefined)
            consumable.cosumableTypeId = updateData.TypeId;
        if (updateData.cost !== undefined)
            consumable.cost = updateData.cost;
        if (updateData.quantity !== undefined)
            consumable.quantity = updateData.quantity;
        if (updateData.unitMeasurement !== undefined)
            consumable.unitMeasurement = updateData.unitMeasurement;
        return await this.consumableRepository.save(consumable);
    }
    async getAll() {
        const data = await this.consumableRepository.find({
            relations: ["consumableType", "supplier"],
            order: { name: "ASC" },
        });
        return data.map((x) => {
            const consumable = {
                consumableId: x.consumableId,
                name: x.name,
                supplierId: x.supplierId,
                cosumableTypeId: x.cosumableTypeId,
                quantity: x.quantity,
                unitMeasurement: x.unitMeasurement,
                cost: x.cost,
                consumableType: x.consumableType,
                supplier: x.supplier,
                active: x.active,
            };
            return consumable;
        });
    }
    async getById(id) {
        const consumable = await this.consumableRepository.findOne({
            where: { consumableId: id },
            relations: ["consumableType", "supplier"],
        });
        if (!consumable) {
            throw new Error(`Consumible con ID ${id} no encontrado`);
        }
        return consumable;
    }
    async getBySupplier(supplierId) {
        return await this.consumableRepository.find({
            where: { supplierId },
            relations: ["consumableType", "supplier"],
            order: { name: "ASC" },
        });
    }
    async getByConsumableType(consumableTypeId) {
        return await this.consumableRepository.find({
            where: { cosumableTypeId: consumableTypeId },
            relations: ["consumableType", "supplier"],
            order: { name: "ASC" },
        });
    }
    async getLowStockConsumables(threshold = 10) {
        return await this.consumableRepository
            .createQueryBuilder("consumable")
            .leftJoinAndSelect("consumable.consumableType", "consumableType")
            .leftJoinAndSelect("consumable.supplier", "supplier")
            .where("consumable.quantity <= :threshold", { threshold })
            .orderBy("consumable.quantity", "ASC")
            .getMany();
    }
}
exports.ConsumableService = ConsumableService;
