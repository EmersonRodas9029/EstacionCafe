import { config } from "dotenv";
import { resolve } from "path";
import { z } from "zod";

// Carga api/.env sin importar el cwd (raíz del monorepo, api/ o dist/)
config({ path: resolve(__dirname, "../../.env"), quiet: true });
config({ path: resolve(__dirname, "../../../.env"), quiet: true });

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3484),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),

    DATABASE_URL: z.string().optional(),
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_USERNAME: z.string().default("estacioncafe"),
    DB_PASSWORD: z.string().default("estacioncafe"),
    DB_DATABASE: z.string().default("estacioncafe"),
    DB_SSL: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    DB_LOGGING: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),

    JWT_SECRET: z.string().min(1).default("dev-secret-change-me"),
    JWT_EXPIRES_IN_HOURS: z.coerce.number().positive().default(12),
    /** Secreto para el hash de los PIN: sin él, una BD filtrada no sirve para adivinarlos. */
    PIN_PEPPER: z.string().min(1).default("dev-pin-pepper-change-me"),
    PIN_SESSION_MINUTES: z.coerce.number().positive().default(30),
  })
  .superRefine((env, ctx) => {
    if (
      env.NODE_ENV === "production" &&
      env.JWT_SECRET === "dev-secret-change-me"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["JWT_SECRET"],
        message: "JWT_SECRET es obligatorio en producción",
      });
    }
    if (
      env.NODE_ENV === "production" &&
      env.PIN_PEPPER === "dev-pin-pepper-change-me"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["PIN_PEPPER"],
        message: "PIN_PEPPER es obligatorio en producción",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Variables de entorno inválidas:\n${issues}`);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
