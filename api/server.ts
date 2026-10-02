import express from "express";
import mainRouter from "./application/Routes/routes";
import { initializeDependencies } from "./core/dependencyInjection";
import { getDataSource } from "./infrastructure/db/Connection";
import { setupSwagger } from "./infrastructure/swagger/swagger";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "EstacionCafe API funcionando",
    health: "/health",
    docs: "/api/docs",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    database: getDataSource().isInitialized ? "connected" : "disconnected",
  });
});

setupSwagger(app);
app.use("/api", mainRouter);

const start = async () => {
  await initializeDependencies();
  app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
    console.log(`Documentación en http://localhost:${port}/api/docs`);
  });
};

start().catch((error: Error) => {
  console.error("No se pudo iniciar la API:", error.message);
  process.exitCode = 1;
});

export default app;
