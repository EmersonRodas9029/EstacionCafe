import { z } from 'zod'

const base = {
  username: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^\S+$/, 'Sin espacios'),
  email: z.string().trim().toLowerCase().pipe(z.email('Correo no válido')),
  typeId: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Elige un rol' }).int().positive('Elige un rol'),
  ),
}

const password = z.string().min(6, 'Mínimo 6 caracteres').max(100, 'Máximo 100 caracteres')

/** Mismas reglas que POST /users. */
export const createUserSchema = z.object({ ...base, password })

/** Al editar la contraseña es opcional: vacía = no cambiarla. */
export const editUserSchema = z.object({
  ...base,
  password: z.union([z.literal(''), password]),
})

export type UserFormInput = z.input<typeof editUserSchema>
export type UserFormValues = z.output<typeof editUserSchema>

/** Reglas de /user-types: nombre 1–50 y nivel entero 0–10. */
export const roleFormSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(50, 'Máximo 50 caracteres'),
  permissionLevel: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce
      .number({ error: 'Escribe el nivel' })
      .int('Debe ser entero')
      .min(0, 'Entre 0 y 10')
      .max(10, 'Entre 0 y 10'),
  ),
  role: z.enum(['admin', 'mesero', 'cajero']),
})

export type RoleFormInput = z.input<typeof roleFormSchema>
export type RoleFormValues = z.output<typeof roleFormSchema>
