import { z } from 'zod'

/** Mismo patrón que el backend: fijo o celular de El Salvador, con o sin +503 y guion. */
export const SV_PHONE = /^(\+503)?[2-9]\d{3}-?\d{4}$/

export const supplierFormSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre').max(100, 'Máximo 100 caracteres'),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, ''))
    .pipe(z.string().regex(SV_PHONE, 'Formato: 2222-3333 o +503 7777-8888')),
  email: z.string().trim().toLowerCase().pipe(z.email('Correo no válido')),
})

export type SupplierFormInput = z.input<typeof supplierFormSchema>
export type SupplierFormValues = z.output<typeof supplierFormSchema>
