import { Repository, Between } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { Purchase } from "../../core/entities/Purchase";
import { SavePurchaseDTO } from "../DTOs/PurchaseDTO";

export class PurchaseService implements IService {
    public constructor(private purchaseRepository: Repository<Purchase>) {
        this.purchaseRepository = purchaseRepository;
    }

    async save(body: SavePurchaseDTO): Promise<any> {
        const data: SavePurchaseDTO = body;
        const purchase: Purchase = new Purchase();
        purchase.date = data.date;
        purchase.cashRegister = data.cashRegister;
        purchase.supplierId = data.supplierId;
        purchase.total = data.total;

        return await this.purchaseRepository.save(purchase);
    }

    async saveAll(body: any[]): Promise<any[]> {
        console.log("Guardando múltiples compras...");
        return await this.purchaseRepository.save(body);
    }

    async delete(id: number): Promise<any> {
        const result = await this.purchaseRepository.delete(id);
        if (result.affected === 0) {
            throw new Error(`Compra con ID ${id} no encontrada`);
        }
        return { message: "Compra eliminada correctamente", id };
    }

    async update(body: any): Promise<any> {
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

    async getAll(): Promise<any[]> {
        return await this.purchaseRepository.find({
            relations: ["supplier"] as any,
            order: { date: "DESC" }
        });
    }

    async getById(id: number): Promise<any> {
        const purchase = await this.purchaseRepository.findOne({
            where: { purchaseId: id },
            relations: ["supplier"] as any
        });
        if (!purchase) {
            throw new Error(`Compra con ID ${id} no encontrada`);
        }
        return purchase;
    }

    async getBySupplier(supplierId: number): Promise<any[]> {
        return await this.purchaseRepository.find({
            where: { supplierId },
            relations: ["supplier"] as any,
            order: { date: "DESC" }
        });
    }

    async getByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
        return await this.purchaseRepository.find({
            where: {
                date: Between(startDate, endDate)
            },
            relations: ["supplier"] as any,
            order: { date: "DESC" }
        });
    }
}