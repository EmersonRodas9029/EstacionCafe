"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillService = void 0;
const typeorm_1 = require("typeorm");
const Bill_1 = require("../../core/entities/Bill");
const Status_1 = require("../../core/enums/Status");
class BillService {
    constructor(billRepository) {
        this.billRepository = billRepository;
        this.billRepository = billRepository;
    }
    async saveAll(body) {
        const bills = body.map((data) => {
            const bill = new Bill_1.Bill();
            bill.cashRegisterId = data.cashRegister;
            bill.tableId = data.tableId;
            if (data.status) {
                bill.status = data.status;
            }
            bill.total = data.total;
            bill.customer = data.customer;
            bill.date = data.date;
            return bill;
        });
        return await this.billRepository.save(bills);
    }
    async save(body) {
        const data = body;
        const bill = new Bill_1.Bill();
        bill.cashRegisterId = data.cashRegister;
        bill.tableId = data.tableId;
        if (data.status) {
            bill.status = data.status;
        }
        bill.total = data.total;
        bill.customer = data.customer;
        bill.date = data.date;
        console.log("Guardando factura...");
        return await this.billRepository.save(bill);
    }
    async delete(id) {
        const result = await this.billRepository.delete(id);
        if (result.affected === 0) {
            throw new Error(`Factura con ID ${id} no encontrada`);
        }
        return { message: "Factura eliminada correctamente", id };
    }
    async update(body) {
        const { billId, ...updateData } = body;
        if (!billId) {
            throw new Error("billId es requerido para actualizar");
        }
        const bill = await this.billRepository.findOne({
            where: { billId },
        });
        console.log(bill);
        if (!bill) {
            throw new Error(`Factura con ID ${billId} no encontrada`);
        }
        Object.assign(bill, updateData);
        return await this.billRepository.save(bill);
    }
    async getAll() {
        console.log(`Obteniendo facturas...`);
        return this.billRepository
            .find({
            relations: ["cashRegister", "table"],
            order: { date: "DESC" },
        })
            .catch((error) => {
            console.log(error);
            throw error;
        });
    }
    async getById(id) {
        const bill = await this.billRepository.findOne({
            where: { billId: id },
            relations: ["cashRegister", "table"],
        });
        if (!bill) {
            throw new Error(`Factura con ID ${id} no encontrada`);
        }
        return bill;
    }
    async getByDateRange(startDate, endDate) {
        return await this.billRepository
            .createQueryBuilder("bill")
            .leftJoinAndSelect("bill.cashRegister", "cashRegister")
            .leftJoinAndSelect("bill.table", "table")
            .where("bill.date >= :startDate", { startDate })
            .andWhere("bill.date <= :endDate", { endDate })
            .orderBy("bill.date", "DESC")
            .getMany();
    }
    async getBillsByCustomer(customer) {
        return await this.billRepository.find({
            where: { customer },
            relations: ["cashRegister", "table"],
            order: { date: "DESC" },
        });
    }
    async getBillsByTable(tableId) {
        return await this.billRepository.find({
            where: { tableId },
            relations: ["cashRegister", "table"],
            order: { date: "DESC" },
        });
    }
    /**
     * Cierra (marca como CLOSED) todas las facturas con status OPEN o DRAFT que pertenezcan a la mesa indicada.
     * Usa `save` para que los subscribers de TypeORM se disparen correctamente.
     */
    async closeBillsByTable(tableId) {
        const openBills = await this.billRepository.find({
            where: {
                tableId,
                status: (0, typeorm_1.In)([Status_1.Status.OPEN, Status_1.Status.DRAFT]),
            },
        });
        if (!openBills || openBills.length === 0) {
            return { updated: 0 };
        }
        for (const b of openBills) {
            b.status = Status_1.Status.CLOSED;
        }
        const saved = await this.billRepository.save(openBills);
        return { updated: Array.isArray(saved) ? saved.length : 1 };
    }
}
exports.BillService = BillService;
