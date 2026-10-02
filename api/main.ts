import "reflect-metadata";
import { corsOrigins, env } from "./infrastructure/config/env";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./application/Routes/routes";
import { setupSwagger } from "./infrastructure/swagger/swagger";
import { getDataSource } from "./infrastructure/db/Connection";
import { initializeDependencies } from "./core/dependencyInjection";
import { startAllJobs } from "./infrastructure/jobs";
import {
  errorHandler,
  notFoundHandler,
} from "./infrastructure/security/errorHandler";

export const app = express();

// Necesario detrás de proxies (Render, Railway) para req.protocol/secure cookies
app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // Sin Origin: curl, Postman, apps móviles
      if (!origin || corsOrigins.includes("*") || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Token-In-Body"],
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    database: getDataSource().isInitialized ? "connected" : "disconnected",
  });
});

setupSwagger(app);
app.use("/api", routes);
app.use("/api", notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await initializeDependencies();
  app.listen(env.PORT, () => {
    console.log(`API escuchando en http://localhost:${env.PORT}/api`);
    console.log(`Documentación en http://localhost:${env.PORT}/api/docs`);
    startAllJobs();
  });
};

if (require.main === module) {
  start().catch((error: Error) => {
    console.error("No se pudo iniciar la API:", error.message);
    process.exit(1);
  });
}
