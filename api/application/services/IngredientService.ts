import { Repository } from "typeorm";
import { Ingredient } from "../../core/entities/Ingredient";
import { IService } from "../../core/interfaces/IService";
import { SaveIngredientDTO, UpdateIngredientDTO } from "../DTOs/IngredientDTOs";

export class IngredientService implements IService {
  constructor(private ingredientRepo: Repository<Ingredient>) {
    this.ingredientRepo = ingredientRepo;
  }

  
  async save(body: SaveIngredientDTO): Promise<Ingredient> {
    const ingredient = new Ingredient();
    ingredient.name = body.name;
    ingredient.quantity = body.quantity;
    ingredient.productId = body.productId;
    ingredient.consumableId = body.consumableId;
    
    console.log("Guardando ingrediente...");
    return await this.ingredientRepo.save(ingredient);
  }

  async saveAll(ingredients: SaveIngredientDTO[]): Promise<Ingredient[]> {
    console.log("Guardando múltiples ingredientes...");
    const ingredientEntities = ingredients.map(body => {
      const ingredient = new Ingredient();
      ingredient.name = body.name;
      ingredient.quantity = body.quantity;
      ingredient.productId = body.productId;
      ingredient.consumableId = body.consumableId;
      return ingredient;
    });
    
    return await this.ingredientRepo.save(ingredientEntities);
  }

  async delete(id: number): Promise<any> {
    console.log(`Eliminando ingrediente con ID: ${id}`);
    const result = await this.ingredientRepo.delete(id);
    if (result.affected === 0) {
      throw new Error(`Ingrediente con ID ${id} no encontrado`);
    }
    return { message: "Ingrediente eliminado correctamente", id };
  }

  async update(body: any): Promise<Ingredient> {
    const { ingredientId, ...updateData } = body;
    console.log(`Actualizando ingrediente con ID: ${ingredientId}`);

    const ingredient = await this.ingredientRepo.findOne({ 
      where: { ingredientId } 
    });
    
    if (!ingredient) {
      throw new Error(`Ingrediente con ID ${ingredientId} no encontrado`);
    }

    if (updateData.name !== undefined) ingredient.name = updateData.name;
    if (updateData.quantity !== undefined) ingredient.quantity = updateData.quantity;
    if (updateData.productId !== undefined) ingredient.productId = updateData.productId;
    if (updateData.consumableId !== undefined) ingredient.consumableId = updateData.consumableId;

    return await this.ingredientRepo.save(ingredient);
  }

  async getAll(): Promise<Ingredient[]> {
    console.log("Obteniendo ingredientes...");
    return await this.ingredientRepo.find({ 
      relations: ["product", "consumable"] as any,
      order: { name: "ASC" }
    });
  }

  async getById(id: number): Promise<Ingredient | null> {
    console.log(`Obteniendo ingrediente con ID: ${id}`);
    return await this.ingredientRepo.findOne({
      where: { ingredientId: id },
      relations: ["product", "consumable"] as any
    });
  }

  async getIngredientsByProduct(productId: number): Promise<Ingredient[]> {
    console.log(`Obteniendo ingredientes del producto con ID: ${productId}`);
    return await this.ingredientRepo.find({
      where: { productId },
      relations: ["product", "consumable"] as any,
      order: { name: "ASC" }
    });
  }

  async getIngredientsByConsumable(consumableId: number): Promise<Ingredient[]> {
    console.log(`Obteniendo ingredientes del consumible con ID: ${consumableId}`);
    return await this.ingredientRepo.find({
      where: { consumableId },
      relations: ["product", "consumable"] as any,
      order: { name: "ASC" }
    });
  }

  async getByProduct(productId: number): Promise<Ingredient[]> {
    return await this.ingredientRepo.find({
      where: { productId },
      relations: ["product", "consumable"] as any,
      order: { name: "ASC" }
    });
  }

  async getByConsumable(consumableId: number): Promise<Ingredient[]> {
    return await this.ingredientRepo.find({
      where: { consumableId },
      relations: ["product", "consumable"] as any,
      order: { name: "ASC" }
    });
  }

  async getIngredientsByProductAndConsumable(productId: number, consumableId: number): Promise<Ingredient[]> {
    return await this.ingredientRepo.find({
      where: { 
        productId,
        consumableId 
      },
      relations: ["product", "consumable"] as any,
      order: { name: "ASC" }
    });
  }


}
