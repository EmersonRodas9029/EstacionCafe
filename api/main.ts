//Cargamos variables de entorno PRIMERO
import "./infrastructure/db/loadEnv";

//Cargamos dependencias
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const routes = require("./application/Routes/routes").default;
const { setupSwagger } = require("./infrastructure/swagger/swagger");

//Creamos el servidor
const app = express();
const port = parseInt(process.env.PORT || "3484", 10);

// Trust proxy - required for req.protocol to work correctly behind reverse proxies (Render, Heroku, etc.)
app.set("trust proxy", 1);
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3484/*")
  .split(",")
  .map((origin: string) => origin.trim())
  .filter(Boolean);


  console.log(process.env.NODE_ENV, process.env.CORS_ORIGIN)
//Configuramos CORS
app.use(
  cors({
    origin: (origin: string | undefined, callback: any) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Allow all origins in development or if wildcard is set
      if (corsOrigins.includes("*") || process.env.NODE_ENV === "development") {
        callback(null, true);
        return;
      }
      
      // Check if origin is in the allowed list
      if (corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      
      callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

//Parsear cookies
app.use(cookieParser());

//Covertimos datos del body a objetos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
setupSwagger(app);

// Usar las rutas del router
app.use("/api", routes);

//Inyectamos dependencias
const { initializeDependencies } = require("./core/dependencyInjection");
const { startAllJobs } = require("./infrastructure/jobs");

initializeDependencies()
  .then(() => {
    console.log("Iniciando servidor...");

    //Poner a escuchar el servidor solo después de que las dependencias estén listas
    app.listen(port, () => {
      console.log(`Servidor corriendo en puerto ${port}`);

      // Iniciar jobs programados después de que el servidor esté listo
      startAllJobs();
    });
  })
  .catch((error: any) => {
    console.error("Error al inicializar la aplicación:", error);
    process.exit(1);
  });
