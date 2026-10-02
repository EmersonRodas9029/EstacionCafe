import { EntityManager } from "typeorm";
import { Ingredient } from "../../core/entities/Ingredient";
import { Consumable } from "../../core/entities/Consumable";
import { AppError } from "../errors/AppError";

/**
 * Descuenta o repone consumibles según la receta (ingredientes) de cada producto.
 * delta > 0 consume stock; delta < 0 lo devuelve.
 * Debe ejecutarse dentro de una transacción.
 */
export const adjustStockForProducts = async (
  manager: EntityManager,
  deltas: Map<number, number>,
): Promise<void> => {
  const perConsumable = new Map<number, number>();

  for (const [productId, delta] of deltas) {
    if (delta === 0) continue;
    const ingredients = await manager.find(Ingredient, {
      where: { productId },
    });
    for (const ingredient of ingredients) {
      const current = perConsumable.get(ingredient.consumableId) ?? 0;
      perConsumable.set(
        ingredient.consumableId,
        current + Number(ingredient.quantity) * delta,
      );
    }
  }

  for (const [consumableId, required] of perConsumable) {
    if (required === 0) continue;

    // Bloqueo de fila para evitar sobreventa con pedidos simultáneos
    const consumable = await manager.findOne(Consumable, {
      where: { consumableId },
      lock: { mode: "pessimistic_write" },
    });
    if (!consumable) {
      throw AppError.badRequest(
        `Consumible con ID ${consumableId} no encontrado`,
      );
    }

    const resulting = consumable.quantity - required;
    if (resulting < 0) {
      throw AppError.badRequest(
        `Stock insuficiente para "${consumable.name}". Disponible: ${consumable.quantity}, requerido: ${required}`,
        "stock_error",
      );
    }

    consumable.quantity = Math.round(resulting * 1000) / 1000;
    await manager.save(consumable);
  }
};
