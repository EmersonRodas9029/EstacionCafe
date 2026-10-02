import { useMutation, type QueryClient } from '@tanstack/react-query'
import {
  createIngredient,
  deleteIngredient,
  updateIngredient,
} from '@/api/generated/ingredients/ingredients'
import type { Consumable } from '@/api/generated/model/consumable'
import type { Ingredient } from '@/api/generated/model/ingredient'
import type { Product } from '@/api/generated/model/product'
import { createProduct, useUpdateProduct, updateProduct } from '@/api/generated/products/products'
import {
  useCreateProductType,
  useDeleteProductType,
  useUpdateProductType,
} from '@/api/generated/product-types/product-types'
import { useInvalidatingOptions } from '@/lib/mutation-options'
import { invalidatePrefixes } from '@/lib/query'
import type { ProductFormValues } from '../schemas'

const CATALOG_PREFIXES = ['/products', '/product-type', '/ingredient']

/** Productos, categorías y recetas: el menú del mesero también lee de aquí. */
export const invalidateCatalog = (queryClient: QueryClient) =>
  invalidatePrefixes(queryClient, CATALOG_PREFIXES)

const useCatalogOptions = () => useInvalidatingOptions(CATALOG_PREFIXES)

export const useCreateCategory = () => useCreateProductType({ mutation: useCatalogOptions() })
export const useRenameCategory = () => useUpdateProductType({ mutation: useCatalogOptions() })
export const useDeleteCategory = () => useDeleteProductType({ mutation: useCatalogOptions() })
export const useEditProduct = () => useUpdateProduct({ mutation: useCatalogOptions() })

const ingredientName = (product: string, consumable: string | undefined) =>
  `${product} - ${consumable ?? 'consumible'}`.slice(0, 255)

type SaveProductInput = {
  productId?: number
  values: ProductFormValues
  /** Receta tal como está en el servidor, para calcular qué cambió. */
  original: Ingredient[]
  consumables: Consumable[]
}

/**
 * Guarda el producto y su receta en un solo paso: la API expone ingredientes
 * sueltos, así que se compara contra la receta original y solo se envían
 * altas, cambios y bajas.
 */
export function useSaveProduct() {
  const options = useCatalogOptions()

  return useMutation({
    ...options,
    mutationFn: async ({
      productId,
      values,
      original,
      consumables,
    }: SaveProductInput): Promise<Product> => {
      const { recipe, ...fields } = values
      const product = productId
        ? (await updateProduct(productId, fields)).data
        : (await createProduct(fields)).data

      const nameOf = (consumableId: number) =>
        ingredientName(product.name, consumables.find((c) => c.consumableId === consumableId)?.name)
      const kept = new Set(recipe.flatMap((line) => line.ingredientId ?? []))

      await Promise.all([
        ...original
          .filter((ingredient) => !kept.has(ingredient.ingredientId))
          .map((ingredient) => deleteIngredient(ingredient.ingredientId)),
        ...recipe.map((line) => {
          if (!line.ingredientId)
            return createIngredient({
              name: nameOf(line.consumableId),
              quantity: line.quantity,
              productId: product.productId,
              consumableId: line.consumableId,
            })
          const before = original.find((i) => i.ingredientId === line.ingredientId)
          const changed =
            !before ||
            before.consumableId !== line.consumableId ||
            Number(before.quantity) !== line.quantity
          return changed
            ? updateIngredient(line.ingredientId, {
                name: nameOf(line.consumableId),
                quantity: line.quantity,
                consumableId: line.consumableId,
              })
            : null
        }),
      ])

      return product
    },
  })
}
