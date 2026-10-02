import { Repository } from "typeorm";
import { ConsumableType } from "../../core/entities/ConsumableType";
import { IService } from "../../core/interfaces/IService";
import {
  SaveConsumableTypeDTO,
  UpdateConsumableTypeDTO,
} from "../DTOs/ConsumableDTO";

export class ConsumableTypeService implements IService {
  constructor(private ConsumableTypeRepository: Repository<ConsumableType>) {
    this.ConsumableTypeRepository = ConsumableTypeRepository;
  }

  async save(body: SaveConsumableTypeDTO): Promise<ConsumableType> {
    const consumableType = new ConsumableType();
    consumableType.name = body.name;

    return await this.ConsumableTypeRepository.save(consumableType);
  }

  async saveAll(
    ConsumableTypes: SaveConsumableTypeDTO[]
  ): Promise<ConsumableType[]> {
    
    const ConsumableTypeEntities = ConsumableTypes.map((body) => {
      const consumableType = new ConsumableType();
      consumableType.name = body.name;
      return consumableType;
    });

    return await this.ConsumableTypeRepository.save(ConsumableTypeEntities);
  }

  async delete(id: number): Promise<void> {
    const result = await this.ConsumableTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Tipo de consumible con ID ${id} no encontrado`);
    }
  }

  async update(
    body: Partial<UpdateConsumableTypeDTO>
  ): Promise<ConsumableType> {
    const consumableType = await this.ConsumableTypeRepository.findOne({
      where: { consumableTypeId: body.consumableTypeId },
    });

    if (!consumableType) {
      throw new Error(
        `Tipo de consumible con ID ${body.consumableTypeId} no encontrado`
      );
    }

    if (body.name !== undefined) consumableType.name = body.name;

    return await this.ConsumableTypeRepository.save(consumableType);
  }

  async getAll(): Promise<ConsumableType[]> {
    return await this.ConsumableTypeRepository.find();
  }

  async getById(id: number): Promise<ConsumableType | null> {
    return await this.ConsumableTypeRepository.findOne({
      where: { consumableTypeId: id },
    });
  }
}
