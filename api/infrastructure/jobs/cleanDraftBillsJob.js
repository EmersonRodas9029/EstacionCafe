"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCleanDraftBillsNow = exports.cleanDraftBillsJob = void 0;
const cron = __importStar(require("node-cron"));
const Connection_1 = require("../db/Connection");
const Bill_1 = require("../../core/entities/Bill");
const Status_1 = require("../../core/enums/Status");
/**
 * Job que elimina bills con status 'draft' cada 10 minutos
 * Cron pattern: "star-slash-10 * * * *" = cada 10 minutos
 */
const cleanDraftBillsJob = () => {
    // Ejecutar cada 10 minutos
    const task = cron.schedule("*/5 * * * *", async () => {
        try {
            console.log("[CleanDraftBillsJob] Iniciando limpieza de bills con status 'draft'...");
            if (!Connection_1.AppDataSource.isInitialized) {
                console.warn("[CleanDraftBillsJob] DataSource no está inicializado, saltando ejecución");
                return;
            }
            const billRepository = Connection_1.AppDataSource.getRepository(Bill_1.Bill);
            // Buscar y eliminar bills con status DRAFT
            const result = await billRepository.delete({ status: Status_1.Status.DRAFT });
            if (result.affected && result.affected > 0) {
                console.log(`[CleanDraftBillsJob] Se eliminaron ${result.affected} bills con status 'draft'`);
            }
            else {
                console.log("[CleanDraftBillsJob] No se encontraron bills con status 'draft'");
            }
        }
        catch (error) {
            console.error("[CleanDraftBillsJob] X Error al eliminar bills draft:", error.message);
        }
    });
    console.log("[CleanDraftBillsJob] Job iniciado - Se ejecutará cada 10 minutos");
    return task;
};
exports.cleanDraftBillsJob = cleanDraftBillsJob;
const runCleanDraftBillsNow = async () => {
    try {
        if (!Connection_1.AppDataSource.isInitialized) {
            throw new Error("DataSource no está inicializado");
        }
        const billRepository = Connection_1.AppDataSource.getRepository(Bill_1.Bill);
        const result = await billRepository.delete({ status: Status_1.Status.DRAFT });
        return { deleted: result.affected || 0 };
    }
    catch (error) {
        console.error("Error al ejecutar limpieza manual:", error.message);
        throw error;
    }
};
exports.runCleanDraftBillsNow = runCleanDraftBillsNow;
