import { z } from 'zod'

/** Reglas de POST /tables: ID en mayúsculas y números, zona 1–50. */
export const tableFormSchema = z.object({
  tableId: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Escribe el identificador')
    .max(10, 'Máximo 10 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Solo letras y números, sin espacios'),
  zone: z.string().trim().min(1, 'Escribe la zona').max(50, 'Máximo 50 caracteres'),
})

export type TableFormValues = z.infer<typeof tableFormSchema>
