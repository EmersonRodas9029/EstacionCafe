"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./application/Routes/routes"));
const dependencyInjection_1 = require("./core/dependencyInjection");
const Connection_1 = require("./infrastructure/db/Connection");
const swagger_1 = require("./infrastructure/swagger/swagger");
const app = (0, express_1.default)();
const port = Number(process.env.PORT || 3000);
app.use(express_1.default.json());
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
        database: (0, Connection_1.getDataSource)().isInitialized ? "connected" : "disconnected",
    });
});
(0, swagger_1.setupSwagger)(app);
app.use("/api", routes_1.default);
const start = async () => {
    await (0, dependencyInjection_1.initializeDependencies)();
    app.listen(port, () => {
        console.log(`API escuchando en http://localhost:${port}`);
        console.log(`Documentación en http://localhost:${port}/api/docs`);
    });
};
start().catch((error) => {
    console.error("No se pudo iniciar la API:", error.message);
    process.exitCode = 1;
});
exports.default = app;
