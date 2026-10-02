import { z } from 'zod'

/** Mismas reglas que la validación Zod del backend (POST /products). */
export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Requerido').max(50),
    description: z.string().trim().min(1, 'Requerido').max(100),
    price: z.coerce.number<number>().positive('Debe ser mayor a 0'),
    cost: z.coerce.number<number>().positive('Debe ser mayor a 0'),
    productTypeId: z.coerce.number<number>().int().positive('Selecciona una categoría'),
  })
  .refine((v) => v.price > v.cost, {
    path: ['price'],
    message: 'El precio debe ser mayor al costo',
  })

export type ProductFormValues = z.infer<typeof productFormSchema>
