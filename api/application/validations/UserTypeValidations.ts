import { z } from "zod";
import { Role } from "../../core/enums/Role";

export const createUserTypeSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre es muy largo")
    .trim(),

  permissionLevel: z
    .number()
    .int("El nivel de permisos debe ser un número entero")
    .min(0, "El nivel de permisos no puede ser negativo")
    .max(10, "El nivel de permisos no puede ser mayor a 10"),

  role: z
    .nativeEnum(Role, "El rol debe ser admin, mesero o cajero")
    .default(Role.MESERO),
});

export const updateUserTypeSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre es muy largo")
    .trim()
    .optional(),
  permissionLevel: z
    .number()
    .int("El nivel de permisos debe ser un número entero")
    .min(0, "El nivel de permisos no puede ser negativo")
    .max(10, "El nivel de permisos no puede ser mayor a 10")
    .optional(),
  role: z.nativeEnum(Role, "El rol debe ser admin, mesero o cajero").optional(),
});

export const userTypeIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El ID debe ser un número positivo"
    ),
});
