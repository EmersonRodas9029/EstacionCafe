"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngredientService = void 0;
const Ingredient_1 = require("../../core/entities/Ingredient");
class IngredientService {
    constructor(ingredientRepo) {
        this.ingredientRepo = ingredientRepo;
        this.ingredientRepo = ingredientRepo;
    }
    async save(body) {
        const ingredient = new Ingredient_1.Ingredient();
        ingredient.name = body.name;
        ingredient.quantity = body.quantity;
        ingredient.productId = body.productId;
        ingredient.consumableId = body.consumableId;
        console.log("Guardando ingrediente...");
        return await this.ingredientRepo.save(ingredient);
    }
    async saveAll(ingredients) {
        console.log("Guardando múltiples ingredientes...");
        const ingredientEntities = ingredients.map(body => {
            const ingredient = new Ingredient_1.Ingredient();
            ingredient.name = body.name;
            ingredient.quantity = body.quantity;
            ingredient.productId = body.productId;
            ingredient.consumableId = body.consumableId;
            return ingredient;
        });
        return await this.ingredientRepo.save(ingredientEntities);
    }
    async delete(id) {
        console.log(`Eliminando ingrediente con ID: ${id}`);
        const result = await this.ingredientRepo.delete(id);
        if (result.affected === 0) {
            throw new Error(`Ingrediente con ID ${id} no encontrado`);
        }
        return { message: "Ingrediente eliminado correctamente", id };
    }
    async update(body) {
        const { ingredientId, ...updateData } = body;
        console.log(`Actualizando ingrediente con ID: ${ingredientId}`);
        const ingredient = await this.ingredientRepo.findOne({
            where: { ingredientId }
        });
        if (!ingredient) {
            throw new Error(`Ingrediente con ID ${ingredientId} no encontrado`);
        }
        if (updateData.name !== undefined)
            ingredient.name = updateData.name;
        if (updateData.quantity !== undefined)
            ingredient.quantity = updateData.quantity;
        if (updateData.productId !== undefined)
            ingredient.productId = updateData.productId;
        if (updateData.consumableId !== undefined)
            ingredient.consumableId = updateData.consumableId;
        return await this.ingredientRepo.save(ingredient);
    }
    async getAll() {
        console.log("Obteniendo ingredientes...");
        return await this.ingredientRepo.find({
            relations: ["product", "consumable"],
            order: { name: "ASC" }
        });
    }
    async getById(id) {
        console.log(`Obteniendo ingrediente con ID: ${id}`);
        return await this.ingredientRepo.findOne({
            where: { ingredientId: id },
            relations: ["product", "consumable"]
        });
    }
    async getIngredientsByProduct(productId) {
        console.log(`Obteniendo ingredientes del producto con ID: ${productId}`);
        return await this.ingredientRepo.find({
            where: { productId },
            relations: ["product", "consumable"],
            order: { name: "ASC" }
        });
    }
    async getIngredientsByConsumable(consumableId) {
        console.log(`Obteniendo ingredientes del consumible con ID: ${consumableId}`);
        return await this.ingredientRepo.find({
            where: { consumableId },
            relations: ["product", "consumable"],
            order: { name: "ASC" }
        });
    }
    async getByProduct(productId) {
        return await this.ingredientRepo.find({
            where: { productId },
            relations: ["product", "consumable"],
            order: { name: "ASC" }
        });
    }
    async getByConsumable(consumableId) {
        return await this.ingredientRepo.find({
            where: { consumableId },
            relations: ["product", "consumable"],
            order: { name: "ASC" }
        });
    }
    async getIngredientsByProductAndConsumable(productId, consumableId) {
        return await this.ingredientRepo.find({
            where: {
                productId,
                consumableId
            },
            relations: ["product", "consumable"],
            order: { name: "ASC" }
        });
    }
}
exports.IngredientService = IngredientService;
