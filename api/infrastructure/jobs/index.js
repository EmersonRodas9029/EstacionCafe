"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCleanDraftBillsNow = exports.cleanDraftBillsJob = exports.startAllJobs = void 0;
const cleanDraftBillsJob_1 = require("./cleanDraftBillsJob");
/**
 * Inicia todos los jobs programados de la aplicación
 */
const startAllJobs = () => {
    console.log("[JobScheduler] Iniciando todos los jobs programados...");
    (0, cleanDraftBillsJob_1.cleanDraftBillsJob)();
    console.log("[JobScheduler] Todos los jobs iniciados correctamente");
};
exports.startAllJobs = startAllJobs;
// Exportar funciones individuales para testing o ejecución manual
var cleanDraftBillsJob_2 = require("./cleanDraftBillsJob");
Object.defineProperty(exports, "cleanDraftBillsJob", { enumerable: true, get: function () { return cleanDraftBillsJob_2.cleanDraftBillsJob; } });
Object.defineProperty(exports, "runCleanDraftBillsNow", { enumerable: true, get: function () { return cleanDraftBillsJob_2.runCleanDraftBillsNow; } });
