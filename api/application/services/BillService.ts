import { EntityManager, In, Repository } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { Bill } from "../../core/entities/Bill";
import { BillDetails } from "../../core/entities/BillDetails";
import { Table, TableStatus } from "../../core/entities/Table";
import { CashRegister } from "../../core/entities/CashRegister";
import { BillFiltersDTO, SaveBillDTO, UpdateBillDTO } from "../DTOs/BillsDTO";
import { ACTIVE_STATUSES, Status } from "../../core/enums/Status";
import { PaymentMethod } from "../../core/enums/PaymentMethod";
import { Role } from "../../core/enums/Role";
import { OrderType } from "../../core/enums/OrderType";
import { AppError } from "../errors/AppError";
import { adjustStockForProducts } from "./StockService";
import { Actor, assertBillAccess, ownerScope } from "./billAccess";

/**
 * Transiciones permitidas. Cobrar (→ closed) es solo de cajero y admin; el
 * mesero cierra (→ pending_payment) y puede reabrir mientras no esté cobrada.
 */
const TRANSITIONS: Record<Status, Status[]> = {
  [Status.DRAFT]: [Status.OPEN, Status.PENDING_PAYMENT, Status.CLOSED],
  [Status.OPEN]: [Status.PENDING_PAYMENT, Status.CLOSED],
  [Status.PENDING_PAYMENT]: [Status.OPEN, Status.CLOSED],
  [Status.CLOSED]: [Status.FINISHED],
  [Status.FINISHED]: [],
  [Status.VOID]: [],
};

const STATUS_LABEL: Record<Status, string> = {
  [Status.DRAFT]: "en edición",
  [Status.OPEN]: "abierta",
  [Status.PENDING_PAYMENT]: "por cobrar",
  [Status.CLOSED]: "cobrada",
  [Status.FINISHED]: "entregada",
  [Status.VOID]: "anulada",
};

/** Sin actor = uso interno (seed, jobs): puede todo. */
const canCharge = (actor?: Actor) => !actor || actor.role === Role.ADMIN || actor.role === Role.CAJERO;
const BILL_RELATIONS = ["waiter", "table", "cashRegister"];

export class BillService implements IService {
  public constructor(private billRepository: Repository<Bill>) {}

  async saveAll(
    body: (SaveBillDTO & { waiterId: number })[],
  ): Promise<Bill[]> {
    const saved: Bill[] = [];
    for (const data of body) saved.push(await this.save(data));
    return saved;
  }

  async save(data: SaveBillDTO & { waiterId: number }): Promise<Bill> {
    return this.billRepository.manager.transaction(async (manager) => {
      if (data.orderType === OrderType.DINE_IN) {
        await this.occupyTable(manager, data.tableId!);
      }
      // Una cuenta nace en curso: cobrarla es un paso aparte (y solo del cajero)
      if (data.status && ![Status.OPEN, Status.DRAFT].includes(data.status)) {
        throw AppError.badRequest("Una cuenta nueva solo puede crearse abierta o en edición");
      }

      const bill = new Bill();
      bill.waiterId = data.waiterId;
      bill.customer = data.customer;
      bill.orderType = data.orderType;
      bill.tableId = data.orderType === OrderType.DINE_IN ? data.tableId : null;
      bill.cashRegisterId = null;
      bill.status = data.status ?? Status.OPEN;
      bill.total = 0;
      bill.date = data.date ?? new Date();

      return manager.save(bill);
    });
  }

  /** Anula la factura. Si seguía activa, devuelve el stock consumido. */
  /** Solo cuentas en curso: las cobradas se anulan para no perder el historial. */
  async delete(id: number): Promise<any> {
    await this.billRepository.manager.transaction(async (manager) => {
      const bill = await manager.findOne(Bill, { where: { billId: id } });
      if (!bill) throw new Error(`Factura con ID ${id} no encontrada`);
      if (!ACTIVE_STATUSES.includes(bill.status)) {
        throw AppError.conflict(
          "Solo se eliminan cuentas en curso; las cobradas se anulan",
        );
      }

      const details = await manager.find(BillDetails, {
        where: { billId: id },
      });
      if (ACTIVE_STATUSES.includes(bill.status) && details.length > 0) {
        const deltas = new Map<number, number>();
        for (const d of details) {
          deltas.set(d.productId, (deltas.get(d.productId) ?? 0) - d.quantity);
        }
        await adjustStockForProducts(manager, deltas);
      }

      await manager.delete(BillDetails, { billId: id });
      await manager.delete(Bill, { billId: id });
      if (bill.tableId) await this.releaseTableIfFree(manager, bill.tableId);
    });
    return { message: "Factura eliminada correctamente", id };
  }

  /**
   * Anula una cuenta conservando sus líneas. Si estaba en curso devuelve el
   * stock y libera la mesa; si ya se cobró, lo vendido ya se consumió.
   */
  async void(id: number): Promise<Bill> {
    return this.billRepository.manager.transaction(async (manager) => {
      const bill = await manager.findOne(Bill, { where: { billId: id } });
      if (!bill) throw AppError.notFound(`Factura con ID ${id} no encontrada`);
      if (bill.status === Status.VOID) {
        throw AppError.conflict(`La factura ${id} ya está anulada`);
      }

      if (ACTIVE_STATUSES.includes(bill.status)) {
        const details = await manager.find(BillDetails, {
          where: { billId: id },
        });
        const deltas = new Map<number, number>();
        for (const d of details) {
          deltas.set(d.productId, (deltas.get(d.productId) ?? 0) - d.quantity);
        }
        if (deltas.size > 0) await adjustStockForProducts(manager, deltas);
      }

      bill.status = Status.VOID;
      const saved = await manager.save(bill);
      if (bill.tableId) await this.releaseTableIfFree(manager, bill.tableId);
      return saved;
    });
  }

  async update(body: UpdateBillDTO, actor?: Actor): Promise<Bill> {
    const { billId, ...data } = body;
    if (!billId) throw new Error("billId es requerido para actualizar");

    return this.billRepository.manager.transaction(async (manager) => {
      const bill = await manager.findOne(Bill, { where: { billId } });
      if (!bill) throw new Error(`Factura con ID ${billId} no encontrada`);
      assertBillAccess(bill, actor);

      if (bill.status === Status.VOID) {
        throw AppError.conflict(`La factura ${billId} está anulada`);
      }
      if (data.status === Status.VOID) {
        throw AppError.badRequest("Para anular usa POST /bills/{id}/void");
      }

      const previousTable = bill.tableId ?? null;
      const charging = data.status === Status.CLOSED && bill.status !== Status.CLOSED;
      const touchesPayment = data.cashRegisterId !== undefined || data.paymentMethod !== undefined;

      if ((charging || touchesPayment) && !canCharge(actor)) {
        throw AppError.forbidden("Solo el cajero o el administrador pueden cobrar");
      }
      if (data.status !== undefined && data.status !== bill.status) {
        if (!TRANSITIONS[bill.status].includes(data.status)) {
          throw AppError.conflict(
            `Una cuenta ${STATUS_LABEL[bill.status]} no puede pasar a ${STATUS_LABEL[data.status]}`,
          );
        }
        if (data.status === Status.FINISHED && bill.orderType !== OrderType.TAKEAWAY) {
          throw AppError.badRequest("Solo las órdenes para llevar se marcan como entregadas");
        }
        if (data.status === Status.PENDING_PAYMENT) {
          const lines = await manager.count(BillDetails, { where: { billId } });
          if (lines === 0) throw AppError.badRequest("La cuenta no tiene productos");
        }
      }

      if (data.tableId !== undefined && data.tableId !== bill.tableId) {
        if (bill.orderType === OrderType.TAKEAWAY) {
          throw AppError.badRequest("Una orden para llevar no lleva mesa");
        }
        await this.occupyTable(manager, data.tableId);
        bill.tableId = data.tableId;
      }

      if (data.cashRegisterId !== undefined) {
        await this.ensureActiveCashRegister(manager, data.cashRegisterId);
        bill.cashRegisterId = data.cashRegisterId;
      }

      if (data.paymentMethod !== undefined) bill.paymentMethod = data.paymentMethod;
      if (charging && !bill.cashRegisterId) {
        throw AppError.badRequest("Se requiere cashRegisterId para cobrar la cuenta");
      }
      if (charging && !bill.paymentMethod) {
        throw AppError.badRequest("Indica el método de pago (efectivo o tarjeta)");
      }

      if (data.customer !== undefined) bill.customer = data.customer;
      if (data.status !== undefined) bill.status = data.status;
      if (data.date !== undefined) bill.date = data.date;
      if (data.total !== undefined) bill.total = data.total;

      const saved = await manager.save(bill);

      if (previousTable && previousTable !== saved.tableId) {
        await this.releaseTableIfFree(manager, previousTable);
      }
      if (saved.tableId && !ACTIVE_STATUSES.includes(saved.status)) {
        await this.releaseTableIfFree(manager, saved.tableId);
      }
      return saved;
    });
  }

  async getAll(): Promise<Bill[]> {
    return this.billRepository.find({
      relations: BILL_RELATIONS,
      order: { date: "DESC" },
    });
  }

  /** Listado filtrado; con page/limit pagina y devuelve el total. */
  /** Con actor mesero el listado se limita a sus cuentas, pida lo que pida. */
  async find(
    filters: BillFiltersDTO,
    actor?: Actor,
  ): Promise<{ items: Bill[]; total: number }> {
    const scope = ownerScope(actor);
    if (scope !== undefined) filters = { ...filters, waiterId: scope };
    const qb = this.billRepository
      .createQueryBuilder("bill")
      .leftJoinAndSelect("bill.waiter", "waiter")
      .leftJoinAndSelect("bill.table", "table")
      .leftJoinAndSelect("bill.cashRegister", "cashRegister")
      .orderBy("bill.date", "DESC");

    if (filters.status)
      qb.andWhere("bill.status = :status", { status: filters.status });
    if (filters.active)
      qb.andWhere("bill.status IN (:...active)", { active: ACTIVE_STATUSES });
    if (filters.orderType)
      qb.andWhere("bill.orderType = :orderType", {
        orderType: filters.orderType,
      });
    if (filters.tableId)
      qb.andWhere("bill.tableId = :tableId", { tableId: filters.tableId });
    if (filters.waiterId)
      qb.andWhere("bill.waiterId = :waiterId", { waiterId: filters.waiterId });
    if (filters.from) qb.andWhere("bill.date >= :from", { from: filters.from });
    if (filters.to) qb.andWhere("bill.date <= :to", { to: filters.to });

    if (filters.page) {
      const limit = filters.limit ?? 20;
      qb.skip((filters.page - 1) * limit).take(limit);
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async getById(id: number, actor?: Actor): Promise<Bill> {
    const bill = await this.billRepository.findOne({
      where: { billId: id },
      relations: BILL_RELATIONS,
    });
    if (!bill) {
      throw new Error(`Factura con ID ${id} no encontrada`);
    }
    assertBillAccess(bill, actor);
    return bill;
  }

  async getByDateRange(startDate: Date, endDate: Date, actor?: Actor): Promise<Bill[]> {
    return (await this.find({ from: startDate, to: endDate }, actor)).items;
  }

  async getBillsByCustomer(customer: string, actor?: Actor): Promise<Bill[]> {
    const waiterId = ownerScope(actor);
    return this.billRepository.find({
      where: { customer, ...(waiterId !== undefined && { waiterId }) },
      relations: BILL_RELATIONS,
      order: { date: "DESC" },
    });
  }

  async getBillsByTable(tableId: string, actor?: Actor): Promise<Bill[]> {
    const waiterId = ownerScope(actor);
    return this.billRepository.find({
      where: { tableId, ...(waiterId !== undefined && { waiterId }) },
      relations: BILL_RELATIONS,
      order: { date: "DESC" },
    });
  }

  /**
   * Cobra las cuentas activas de la mesa en la caja indicada. El mesero cobra
   * solo las suyas: si quedan cuentas de otros, la mesa sigue ocupada.
   */
  async closeBillsByTable(
    tableId: string,
    cashRegisterId: number,
    actor?: Actor,
    paymentMethod: PaymentMethod = PaymentMethod.CASH,
  ): Promise<{ updated: number }> {
    if (!canCharge(actor)) throw AppError.forbidden("Solo el cajero o el administrador pueden cobrar");
    return this.billRepository.manager.transaction(async (manager) => {
      await this.ensureActiveCashRegister(manager, cashRegisterId);

      const waiterId = ownerScope(actor);
      const openBills = await manager.find(Bill, {
        where: {
          tableId,
          status: In(ACTIVE_STATUSES),
          ...(waiterId !== undefined && { waiterId }),
        },
      });

      for (const bill of openBills) {
        bill.status = Status.CLOSED;
        bill.cashRegisterId = cashRegisterId;
        bill.paymentMethod = paymentMethod;
      }
      if (openBills.length > 0) await manager.save(openBills);

      await this.releaseTableIfFree(manager, tableId);
      return { updated: openBills.length };
    });
  }

  private async occupyTable(manager: EntityManager, tableId: string) {
    const table = await manager.findOne(Table, { where: { tableId } });
    if (!table) throw AppError.badRequest(`Mesa ${tableId} no encontrada`);
    if (table.status !== TableStatus.OCUPADA) {
      table.status = TableStatus.OCUPADA;
      await manager.save(table);
    }
  }

  private async releaseTableIfFree(manager: EntityManager, tableId: string) {
    const stillActive = await manager.count(Bill, {
      where: { tableId, status: In(ACTIVE_STATUSES) },
    });
    if (stillActive > 0) return;

    const table = await manager.findOne(Table, { where: { tableId } });
    if (table && table.status === TableStatus.OCUPADA) {
      table.status = TableStatus.DISPONIBLE;
      await manager.save(table);
    }
  }

  private async ensureActiveCashRegister(
    manager: EntityManager,
    cashRegisterId: number,
  ) {
    const register = await manager.findOne(CashRegister, {
      where: { cashRegisterId },
    });
    if (!register || !register.active) {
      throw AppError.badRequest(
        `Caja registradora ${cashRegisterId} no existe o está inactiva`,
      );
    }
  }
}
