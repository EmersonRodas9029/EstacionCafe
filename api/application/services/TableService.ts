import { Repository } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { Table, TableStatus } from "../../core/entities/Table";
import { SaveTableDTO, UpdateTableDTO } from "../DTOs/TableDTO";
import { Bill } from "../../core/entities/Bill";
import { AppError } from "../errors/AppError";

export class TableService implements IService {
  public constructor(private tableRepository: Repository<Table>) {
    this.tableRepository = tableRepository;
  }

  async saveAll(body: SaveTableDTO[]): Promise<Table[]> {
    const tables = body.map((data) => {
      const table = new Table();
      table.tableId = data.tableId;
      table.zone = data.zone;
      table.status = data.status || TableStatus.DISPONIBLE;
      return table;
    });
    return await this.tableRepository.save(tables);
  }

  async save(body: SaveTableDTO): Promise<any> {
    const data: SaveTableDTO = body;

    // Verificar si la mesa ya existe
    const existingTable = await this.tableRepository.findOne({
      where: { tableId: data.tableId },
    });

    if (existingTable) {
      throw new Error(`La mesa con ID ${data.tableId} ya existe`);
    }

    const table: Table = new Table();
    table.tableId = data.tableId;
    table.zone = data.zone;
    table.status = data.status || TableStatus.DISPONIBLE;

    console.log("Guardando mesa...");
    return await this.tableRepository.save(table);
  }

  async delete(id: number | string): Promise<any> {
    const tableId = String(id);
    const bills = await this.tableRepository.manager.count(Bill, {
      where: { tableId },
    });
    if (bills > 0) {
      throw AppError.conflict(
        `La mesa ${tableId} tiene ${bills} facturas asociadas y no se puede eliminar`,
      );
    }
    const result = await this.tableRepository.delete(tableId);
    if (result.affected === 0) {
      throw new Error(`Mesa con ID ${tableId} no encontrada`);
    }
    return { message: "Mesa eliminada correctamente", id: tableId };
  }

  async update(body: UpdateTableDTO & { tableId: string }): Promise<any> {
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

  async getAll(): Promise<any[]> {
    console.log(`Obteniendo mesas...`);
    return this.tableRepository
      // Sin relación bills: crecería sin límite con el historial
      .find({ order: { zone: "ASC", tableId: "ASC" } })
      .catch((error: any) => {
        console.log(error);
        throw error;
      });
  }

  async getById(id: number | string): Promise<any> {
    const tableId = String(id);
    const table = await this.tableRepository.findOne({
      where: { tableId },
    });
    if (!table) {
      throw new Error(`Mesa con ID ${tableId} no encontrada`);
    }
    return table;
  }

  async getByZone(zone: string): Promise<Table[]> {
    return await this.tableRepository.find({
      where: { zone },
      order: { tableId: "ASC" },
    });
  }

  async getByStatus(status: TableStatus): Promise<Table[]> {
    return await this.tableRepository.find({
      where: { status },
      order: { zone: "ASC", tableId: "ASC" },
    });
  }

  async getAvailableTables(): Promise<Table[]> {
    return await this.getByStatus(TableStatus.DISPONIBLE);
  }

  async updateTableStatus(
    tableId: string,
    status: TableStatus,
  ): Promise<Table> {
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
