"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableService = void 0;
const Table_1 = require("../../core/entities/Table");
class TableService {
    constructor(tableRepository) {
        this.tableRepository = tableRepository;
        this.tableRepository = tableRepository;
    }
    async saveAll(body) {
        const tables = body.map((data) => {
            const table = new Table_1.Table();
            table.tableId = data.tableId;
            table.zone = data.zone;
            table.status = data.status || Table_1.TableStatus.DISPONIBLE;
            return table;
        });
        return await this.tableRepository.save(tables);
    }
    async save(body) {
        const data = body;
        // Verificar si la mesa ya existe
        const existingTable = await this.tableRepository.findOne({
            where: { tableId: data.tableId },
        });
        if (existingTable) {
            throw new Error(`La mesa con ID ${data.tableId} ya existe`);
        }
        const table = new Table_1.Table();
        table.tableId = data.tableId;
        table.zone = data.zone;
        table.status = data.status || Table_1.TableStatus.DISPONIBLE;
        console.log("Guardando mesa...");
        return await this.tableRepository.save(table);
    }
    async delete(id) {
        const tableId = String(id);
        const result = await this.tableRepository.delete(tableId);
        if (result.affected === 0) {
            throw new Error(`Mesa con ID ${tableId} no encontrada`);
        }
        return { message: "Mesa eliminada correctamente", id: tableId };
    }
    async update(body) {
        const { tableId, ...updateData } = body;
        if (!tableId) {
            throw new Error("tableId es requerido para actualizar");
        }
        const table = await this.tableRepository.findOne({
            where: { tableId },
        });
        if (!table) {
            throw new Error(`Mesa con ID ${tableId} no encontrada`);
        }
        Object.assign(table, updateData);
        return await this.tableRepository.save(table);
    }
    async getAll() {
        console.log(`Obteniendo mesas...`);
        return this.tableRepository
            .find({
            relations: ["bills"],
            order: { zone: "ASC", tableId: "ASC" },
        })
            .catch((error) => {
            console.log(error);
            throw error;
        });
    }
    async getById(id) {
        const tableId = String(id);
        const table = await this.tableRepository.findOne({
            where: { tableId },
            relations: ["bills"],
        });
        if (!table) {
            throw new Error(`Mesa con ID ${tableId} no encontrada`);
        }
        return table;
    }
    async getByZone(zone) {
        return await this.tableRepository.find({
            where: { zone },
            relations: ["bills"],
            order: { tableId: "ASC" },
        });
    }
    async getByStatus(status) {
        return await this.tableRepository.find({
            where: { status },
            relations: ["bills"],
            order: { zone: "ASC", tableId: "ASC" },
        });
    }
    async getAvailableTables() {
        return await this.getByStatus(Table_1.TableStatus.DISPONIBLE);
    }
    async updateTableStatus(tableId, status) {
        const table = await this.tableRepository.findOne({
            where: { tableId },
        });
        if (!table) {
            throw new Error(`Mesa con ID ${tableId} no encontrada`);
        }
        table.status = status;
        return await this.tableRepository.save(table);
    }
}
exports.TableService = TableService;
