import { Repository, In } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { Bill } from "../../core/entities/Bill";
import { SaveBillDTO, UpdateBillDTO } from "../DTOs/BillsDTO";
import { Status } from "../../core/enums/Status";

export class BillService implements IService {
  public constructor(private billRepository: Repository<Bill>) {
    this.billRepository = billRepository;
  }

  async saveAll(body: SaveBillDTO[]): Promise<Bill[]> {
    const bills = body.map((data) => {
      const bill = new Bill();
      bill.cashRegisterId = data.cashRegister;
      bill.tableId = data.tableId;
      if ((data as any).status) {
        bill.status = (data as any).status;
      }
      bill.total = data.total;
      bill.customer = data.customer;
      bill.date = data.date;
      return bill;
    });
    return await this.billRepository.save(bills);
  }

  async save(body: SaveBillDTO): Promise<any> {
    const data: SaveBillDTO = body;
    const bill: Bill = new Bill();
    bill.cashRegisterId = data.cashRegister;
    bill.tableId = data.tableId;
    if ((data as any).status) {
      bill.status = (data as any).status;
    }
    bill.total = data.total;
    bill.customer = data.customer;
    bill.date = data.date;
    console.log("Guardando factura...");
    return await this.billRepository.save(bill);
  }

  async delete(id: number): Promise<any> {
    const result = await this.billRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Factura con ID ${id} no encontrada`);
    }
    return { message: "Factura eliminada correctamente", id };
  }
  async update(body: UpdateBillDTO): Promise<any> {
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

  async getAll(): Promise<any[]> {
    console.log(`Obteniendo facturas...`);
    return this.billRepository
      .find({
        relations: ["cashRegister", "table"] as any,
        order: { date: "DESC" },
      })
      .catch((error: any) => {
        console.log(error);
        throw error;
      });
  }

  async getById(id: number): Promise<any> {
    const bill = await this.billRepository.findOne({
      where: { billId: id },
      relations: ["cashRegister", "table"] as any,
    });
    if (!bill) {
      throw new Error(`Factura con ID ${id} no encontrada`);
    }
    return bill;
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<Bill[]> {
    return await this.billRepository
      .createQueryBuilder("bill")
      .leftJoinAndSelect("bill.cashRegister", "cashRegister")
      .leftJoinAndSelect("bill.table", "table")
      .where("bill.date >= :startDate", { startDate })
      .andWhere("bill.date <= :endDate", { endDate })
      .orderBy("bill.date", "DESC")
      .getMany();
  }

  async getBillsByCustomer(customer: string): Promise<Bill[]> {
    return await this.billRepository.find({
      where: { customer },
      relations: ["cashRegister", "table"] as any,
      order: { date: "DESC" },
    });
  }

  async getBillsByTable(tableId: string): Promise<Bill[]> {
    return await this.billRepository.find({
      where: { tableId },
      relations: ["cashRegister", "table"] as any,
      order: { date: "DESC" },
    });
  }

  /**
   * Cierra (marca como CLOSED) todas las facturas con status OPEN o DRAFT que pertenezcan a la mesa indicada.
   * Usa `save` para que los subscribers de TypeORM se disparen correctamente.
   */
  async closeBillsByTable(tableId: string): Promise<{ updated: number }> {
    const openBills = await this.billRepository.find({
      where: {
        tableId,
        status: In([Status.OPEN, Status.DRAFT]),
      },
    });

    if (!openBills || openBills.length === 0) {
      return { updated: 0 };
    }

    for (const b of openBills) {
      b.status = Status.CLOSED;
    }

    const saved = await this.billRepository.save(openBills);

    return { updated: Array.isArray(saved) ? saved.length : 1 };
  }
}
