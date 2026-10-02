import { Repository } from "typeorm";
import { Consumable } from "../../core/entities/Consumable";
import { IService } from "../../core/interfaces/IService";
import {
  ConsumableItemDTO,
  SaveConsumableDTO,
  UpdateConsumableDTO,
} from "../DTOs/ConsumableDTO";

export class ConsumableService implements IService {
  constructor(private consumableRepository: Repository<Consumable>) {
    this.consumableRepository = consumableRepository;
  }

  async save(body: SaveConsumableDTO): Promise<Consumable> {
    const consumable = new Consumable();
    consumable.supplierId = body.supplierId;
    consumable.name = body.name;
    consumable.consumableTypeId = body.consumableTypeId;
    consumable.cost = body.cost;
    consumable.quantity = body.quantity;
    consumable.unitMeasurement = body.unitMeasurement;
    consumable.minStock = body.minStock ?? 0;

    return await this.consumableRepository.save(consumable);
  }

  async saveAll(consumables: SaveConsumableDTO[]): Promise<Consumable[]> {
    const consumableEntities = consumables.map((body) => {
      const consumable = new Consumable();
      consumable.supplierId = body.supplierId;
      consumable.name = body.name;
      consumable.consumableTypeId = body.consumableTypeId;
      consumable.cost = body.cost;
      consumable.quantity = body.quantity;
      consumable.unitMeasurement = body.unitMeasurement;
      consumable.minStock = body.minStock ?? 0;
      return consumable;
    });

    return await this.consumableRepository.save(consumableEntities);
  }

  async delete(id: number): Promise<any> {
    const consumable = await this.getById(id);
    consumable.active = false;

    await this.consumableRepository.save(consumable);
    return { message: "Consumible desactivado correctamente", id };
  }

  async update(body: UpdateConsumableDTO): Promise<Consumable> {
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

    const fields = [
      "supplierId",
      "name",
      "consumableTypeId",
      "cost",
      "quantity",
      "unitMeasurement",
      "minStock",
      "active",
    ] as const;
    for (const field of fields) {
      if (updateData[field] !== undefined) {
        (consumable as any)[field] = updateData[field];
      }
    }

    return await this.consumableRepository.save(consumable);
  }
  async getAll(): Promise<ConsumableItemDTO[]> {
    const data = await this.consumableRepository.find({
      relations: ["consumableType", "supplier"] as any,
      order: { name: "ASC" },
    });

    return data.map((x) => {
      const consumable: ConsumableItemDTO = {
        consumableId: x.consumableId,
        name: x.name,
        supplierId: x.supplierId,
        consumableTypeId: x.consumableTypeId,

        quantity: x.quantity,
        unitMeasurement: x.unitMeasurement,
        cost: x.cost,
        minStock: x.minStock,
        lowStock: x.quantity <= x.minStock,
        consumableType: x.consumableType,
        supplier: x.supplier,

        active: x.active,
      };
      return consumable;
    });
  }

  async getById(id: number): Promise<Consumable> {
    const consumable = await this.consumableRepository.findOne({
      where: { consumableId: id },
      relations: ["consumableType", "supplier"] as any,
    });

    if (!consumable) {
      throw new Error(`Consumible con ID ${id} no encontrado`);
    }

    return consumable;
  }

  async getBySupplier(supplierId: number): Promise<Consumable[]> {
    return await this.consumableRepository.find({
      where: { supplierId },
      relations: ["consumableType", "supplier"] as any,
      order: { name: "ASC" },
    });
  }

  async getByConsumableType(consumableTypeId: number): Promise<Consumable[]> {
    return await this.consumableRepository.find({
      where: { consumableTypeId: consumableTypeId },
      relations: ["consumableType", "supplier"] as any,
      order: { name: "ASC" },
    });
  }

  /** Consumibles activos con quantity <= minStock (umbral por consumible). */
  async getLowStockConsumables(): Promise<Consumable[]> {
    return await this.consumableRepository
      .createQueryBuilder("consumable")
      .leftJoinAndSelect("consumable.consumableType", "consumableType")
      .leftJoinAndSelect("consumable.supplier", "supplier")
      .where("consumable.active = true")
      .andWhere("consumable.quantity <= consumable.min_stock")
      .orderBy("consumable.quantity", "ASC")
      .getMany();
  }
}
