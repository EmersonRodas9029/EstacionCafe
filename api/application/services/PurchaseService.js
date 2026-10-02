"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseService = void 0;
const typeorm_1 = require("typeorm");
const Purchase_1 = require("../../core/entities/Purchase");
class PurchaseService {
    constructor(purchaseRepository) {
        this.purchaseRepository = purchaseRepository;
        this.purchaseRepository = purchaseRepository;
    }
    async save(body) {
        const data = body;
        const purchase = new Purchase_1.Purchase();
        purchase.date = data.date;
        purchase.cashRegister = data.cashRegister;
        purchase.supplierId = data.supplierId;
        purchase.total = data.total;
        return await this.purchaseRepository.save(purchase);
    }
    async saveAll(body) {
        console.log("Guardando múltiples compras...");
        return await this.purchaseRepository.save(body);
    }
    async delete(id) {
        const result = await this.purchaseRepository.delete(id);
        if (result.affected === 0) {
            throw new Error(`Compra con ID ${id} no encontrada`);
        }
        return { message: "Compra eliminada correctamente", id };
    }
    async update(body) {
        const { purchaseId, ...updateData } = body;
        if (!purchaseId) {
            throw new Error("purchaseId es requerido para actualizar");
        }
        const purchase = await this.purchaseRepository.findOne({ where: { purchaseId } });
        if (!purchase) {
            throw new Error(`Compra con ID ${purchaseId} no encontrada`);
        }
        Object.assign(purchase, updateData);
        return await this.purchaseRepository.save(purchase);
    }
    async getAll() {
        return await this.purchaseRepository.find({
            relations: ["supplier"],
            order: { date: "DESC" }
        });
    }
    async getById(id) {
        const purchase = await this.purchaseRepository.findOne({
            where: { purchaseId: id },
            relations: ["supplier"]
        });
        if (!purchase) {
            throw new Error(`Compra con ID ${id} no encontrada`);
        }
        return purchase;
    }
    async getBySupplier(supplierId) {
        return await this.purchaseRepository.find({
            where: { supplierId },
            relations: ["supplier"],
            order: { date: "DESC" }
        });
    }
    async getByDateRange(startDate, endDate) {
        return await this.purchaseRepository.find({
            where: {
                date: (0, typeorm_1.Between)(startDate, endDate)
            },
            relations: ["supplier"],
            order: { date: "DESC" }
        });
    }
}
exports.PurchaseService = PurchaseService;
