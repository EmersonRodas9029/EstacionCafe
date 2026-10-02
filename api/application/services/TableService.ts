import { Repository } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { Table, TableStatus } from "../../core/entities/Table";
import { SaveTableDTO, UpdateTableDTO } from "../DTOs/TableDTO";
import { Bill } from "../../core/entities/Bill";
import { AppError } from "../errors/AppError";
import { plural } from "../utils/plural";
import { Status } from "../../core/enums/Status";
import { Actor, ownerScope } from "./billAccess";

export interface BoardSummary {
  bills: number;
  total: number;
}

export interface BoardTable {
  tableId: string;
  zone: string;
  status: TableStatus;
  /** Quiénes tienen cuentas activas en la mesa (sin montos) */
  attendedBy: { waiterId: number; username: string }[];
  /** Cuentas activas propias */
  mine: BoardSummary;
  /** Todas las cuentas activas: solo cajero y admin */
  all?: BoardSummary;
}

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
        `La mesa ${tableId} tiene ${plural(bills, "factura asociada", "facturas asociadas")} y no se puede eliminar`,
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

  /**
   * Mapa de mesas para el panel de operación. El mesero ve quién atiende cada
   * mesa pero solo los montos de sus cuentas; cajero y admin ven el total.
   */
  async board(actor: Actor): Promise<BoardTable[]> {
    const tables = await this.tableRepository.find({ order: { zone: "ASC", tableId: "ASC" } });
    const rows: { tableId: string; waiterId: number; username: string; bills: string; total: string }[] =
      await this.tableRepository.manager
        .createQueryBuilder(Bill, "b")
        .innerJoin("b.waiter", "w")
        .select('b.table_id', "tableId")
        .addSelect('b.waiter_id', "waiterId")
        .addSelect("w.username", "username")
        .addSelect("COUNT(*)", "bills")
        .addSelect("COALESCE(SUM(b.total), 0)", "total")
        .where("b.table_id IS NOT NULL")
        .andWhere("b.status IN (:...statuses)", { statuses: [Status.OPEN, Status.DRAFT] })
        .groupBy("b.table_id")
        .addGroupBy("b.waiter_id")
        .addGroupBy("w.username")
        .orderBy("w.username", "ASC")
        .getRawMany();

    const seesAll = ownerScope(actor) === undefined;
    const sum = (list: typeof rows): BoardSummary => ({
      bills: list.reduce((acc, r) => acc + Number(r.bills), 0),
      total: Math.round(list.reduce((acc, r) => acc + Number(r.total), 0) * 100) / 100,
    });

    return tables.map((table) => {
      const here = rows.filter((r) => r.tableId === table.tableId);
      return {
        tableId: table.tableId,
        zone: table.zone,
        status: table.status,
        attendedBy: here.map((r) => ({ waiterId: Number(r.waiterId), username: r.username })),
        mine: sum(here.filter((r) => Number(r.waiterId) === actor.userId)),
        ...(seesAll && { all: sum(here) }),
      };
    });
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
