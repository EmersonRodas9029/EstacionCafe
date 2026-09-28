import { Repository } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { ProductType } from "../../core/entities/ProductType";
import {
  SaveProductTypeDTO,
  UpdateProductTypeDTO,
} from "../DTOs/ProductTypeDTO";

export class ProductTypeService implements IService {
  private productTypeRepo: Repository<ProductType>;

  constructor(productTypeRepository: Repository<ProductType>) {
    this.productTypeRepo = productTypeRepository;
  }

  async save(body: SaveProductTypeDTO): Promise<ProductType> {
    const productType = new ProductType();
    productType.name = body.name;
    console.log("Guardando tipo de producto...");
    return await this.productTypeRepo.save(productType);
  }

  async saveAll(body: SaveProductTypeDTO[]): Promise<ProductType[]> {
    const productTypes = body.map((data) => {
      const productType = new ProductType();
      productType.name = data.name;
      return productType;
    });

    return await this.productTypeRepo.save(productTypes);
  }

  async delete(id: number): Promise<any> {
    const result = await this.productTypeRepo.delete(id);
    if (result.affected === 0) {
      throw new Error(`Tipo de producto con ID ${id} no encontrado`);
    }
    return { message: "Tipo de producto eliminado correctamente", id };
  }

  async update(body: UpdateProductTypeDTO): Promise<ProductType> {
    const { productTypeId, ...updateData } = body;

    if (!productTypeId) {
      throw new Error("productTypeId es requerido para actualizar");
    }

    const productType = await this.productTypeRepo.findOne({
      where: { productTypeId },
    });

    if (!productType) {
      throw new Error(`Tipo de producto con ID ${productTypeId} no encontrado`);
    }

    Object.assign(productType, updateData);
    return await this.productTypeRepo.save(productType);
  }

  async getAll(): Promise<ProductType[]> {
    console.log(`Obteniendo tipos de productos...`);
    return await this.productTypeRepo.find({
      order: { name: "ASC" },
    });
  }

  async getById(id: number): Promise<ProductType> {
    const productType = await this.productTypeRepo.findOne({
      where: { productTypeId: id },
    });

    if (!productType) {
      throw new Error(`Tipo de producto con ID ${id} no encontrado`);
    }

    return productType;
  }
}
