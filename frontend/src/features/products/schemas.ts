import { z } from 'zod'

/** La columna de cantidad en la receta es decimal(10,2): más decimales se redondearían en silencio. */
/** Los inputs entregan strings (o '' si están vacíos): se convierten y se valida que haya número. */
const amount = (required: string) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number({ error: required }))

const hasTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-9

export const recipeLineSchema = z.object({
  ingredientId: z.number().optional(),
  consumableId: amount('Elige un consumible').pipe(
    z.number().int().positive('Elige un consumible'),
  ),
  quantity: amount('Escribe la cantidad')
    .pipe(z.number().positive('Debe ser mayor a 0'))
    .refine(hasTwoDecimals, 'Máximo 2 decimales'),
})

/** Mismas reglas que la validación Zod del backend (POST /products) más la receta. */
export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Requerido').max(50),
    description: z.string().trim().min(1, 'Requerido').max(100),
    price: amount('Escribe el precio').pipe(z.number().positive('Debe ser mayor a 0')),
    cost: amount('Escribe el costo').pipe(z.number().positive('Debe ser mayor a 0')),
    productTypeId: amount('Selecciona una categoría').pipe(
      z.number().int().positive('Selecciona una categoría'),
    ),
    recipe: z.array(recipeLineSchema),
  })
  .refine((v) => v.price > v.cost, {
    path: ['price'],
    message: 'El precio debe ser mayor al costo',
  })
  .superRefine((v, ctx) => {
    const seen = new Set<number>()
    v.recipe.forEach((line, index) => {
      if (seen.has(line.consumableId))
        ctx.addIssue({
          code: 'custom',
          path: ['recipe', index, 'consumableId'],
          message: 'Este consumible ya está en la receta',
        })
      seen.add(line.consumableId)
    })
  })

export type ProductFormInput = z.input<typeof productFormSchema>
export type ProductFormValues = z.output<typeof productFormSchema>
export type RecipeLine = ProductFormValues['recipe'][number]
