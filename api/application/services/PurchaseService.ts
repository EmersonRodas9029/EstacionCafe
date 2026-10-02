import { Between, In, Repository } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { Purchase } from "../../core/entities/Purchase";
import { PurchaseDetail } from "../../core/entities/PurchaseDetail";
import { Consumable } from "../../core/entities/Consumable";
import { SavePurchaseDTO, UpdatePurchaseDTO } from "../DTOs/PurchaseDTO";
import { AppError } from "../errors/AppError";

const RELATIONS = ["supplier", "cashRegister", "details", "details.consumable"];
const round2 = (value: number) => Math.round(value * 100) / 100;

export class PurchaseService implements IService {
  public constructor(private purchaseRepository: Repository<Purchase>) {}

  /** Registra la compra; con detalles suma stock y actualiza el costo del consumible. */
  async save(data: SavePurchaseDTO): Promise<Purchase> {
    const purchaseId = await this.purchaseRepository.manager.transaction(
      async (manager) => {
        const purchase = new Purchase();
        purchase.date = data.date;
        purchase.supplierId = data.supplierId;
        purchase.cashRegisterId = data.cashRegisterId ?? null;
        purchase.total = data.details
          ? round2(
              data.details.reduce((acc, d) => acc + d.quantity * d.unitCost, 0),
            )
          : data.total!;
        const saved = await manager.save(purchase);

        if (data.details) {
          const ids = data.details.map((d) => d.consumableId);
          const consumables = await manager.find(Consumable, {
            where: { consumableId: In(ids) },
            lock: { mode: "pessimistic_write" },
          });

          for (const item of data.details) {
            const consumable = consumables.find(
              (c) => c.consumableId === item.consumableId,
            );
            if (!consumable) {
              throw AppError.badRequest(
                `Consumible con ID ${item.consumableId} no encontrado`,
              );
            }
            consumable.quantity =
              Math.round((consumable.quantity + item.quantity) * 1000) / 1000;
            consumable.cost = item.unitCost;
          }
          await manager.save(consumables);

          await manager.save(
            data.details.map((item) =>
              Object.assign(new PurchaseDetail(), {
                purchaseId: saved.purchaseId,
                consumableId: item.consumableId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                subTotal: round2(item.quantity * item.unitCost),
              }),
            ),
          );
        }
        return saved.purchaseId!;
      },
    );
    return this.getById(purchaseId);
  }

  async saveAll(body: SavePurchaseDTO[]): Promise<Purchase[]> {
    const saved: Purchase[] = [];
    for (const data of body) saved.push(await this.save(data));
    return saved;
  }

  /** Elimina la compra y descuenta del inventario lo que había sumado. */
  async delete(id: number): Promise<any> {
    await this.purchaseRepository.manager.transaction(async (manager) => {
      const purchase = await manager.findOne(Purchase, {
        where: { purchaseId: id },
        relations: ["details"],
      });
      if (!purchase) throw new Error(`Compra con ID ${id} no encontrada`);

      for (const detail of purchase.details ?? []) {
        const consumable = await manager.findOne(Consumable, {
          where: { consumableId: detail.consumableId },
          lock: { mode: "pessimistic_write" },
        });
        if (!consumable) continue;
        const resulting = consumable.quantity - detail.quantity;
        if (resulting < 0) {
          throw AppError.conflict(
            `No se puede eliminar: "${consumable.name}" ya se consumió (stock ${consumable.quantity})`,
          );
        }
        consumable.quantity = Math.round(resulting * 1000) / 1000;
        await manager.save(consumable);
      }

      await manager.delete(PurchaseDetail, { purchaseId: id });
      await manager.delete(Purchase, { purchaseId: id });
    });
    return { message: "Compra eliminada correctamente", id };
  }

  /** Solo datos generales; las líneas no se editan (eliminar y volver a registrar). */
  async update(body: UpdatePurchaseDTO): Promise<Purchase> {
    const { purchaseId, ...data } = body;
    if (!purchaseId) throw new Error("purchaseId es requerido para actualizar");

    const purchase = await this.purchaseRepository.findOne({
      where: { purchaseId },
      relations: ["details"],
    });
    if (!purchase) throw new Error(`Compra con ID ${purchaseId} no encontrada`);

    if (data.total !== undefined && purchase.details?.length) {
      throw AppError.badRequest(
        "El total de una compra con detalles se calcula automáticamente",
      );
    }

    if (data.date !== undefined) purchase.date = data.date;
    if (data.supplierId !== undefined) purchase.supplierId = data.supplierId;
    if (data.cashRegisterId !== undefined)
      purchase.cashRegisterId = data.cashRegisterId;
    if (data.total !== undefined) purchase.total = data.total;

    await this.purchaseRepository.save(purchase);
    return this.getById(purchaseId);
  }

  async getAll(): Promise<Purchase[]> {
    return this.purchaseRepository.find({
      relations: ["supplier", "cashRegister"],
      order: { date: "DESC" },
    });
  }

  async getById(id: number): Promise<Purchase> {
    const purchase = await this.purchaseRepository.findOne({
      where: { purchaseId: id },
      relations: RELATIONS,
    });
    if (!purchase) {
      throw new Error(`Compra con ID ${id} no encontrada`);
    }
    return purchase;
  }

  async getBySupplier(supplierId: number): Promise<Purchase[]> {
    return this.purchaseRepository.find({
      where: { supplierId },
      relations: ["supplier", "cashRegister"],
      order: { date: "DESC" },
    });
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<Purchase[]> {
    return this.purchaseRepository.find({
      where: { date: Between(startDate, endDate) },
      relations: ["supplier", "cashRegister"],
      order: { date: "DESC" },
    });
  }
}
