import { EntityManager, In, Repository } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { BillDetails } from "../../core/entities/BillDetails";
import { Bill } from "../../core/entities/Bill";
import { Product } from "../../core/entities/Producto";
import { Status } from "../../core/enums/Status";
import { SaveBillDetailDTO } from "../DTOs/BillsDTO";
import { AppError } from "../errors/AppError";
import { adjustStockForProducts } from "./StockService";

const EDITABLE_STATUSES = [Status.OPEN, Status.DRAFT];

const round2 = (value: number) => Math.round(value * 100) / 100;

export class BillDetailsService implements IService {
  constructor(
    private detailRepo: Repository<BillDetails>,
    private billService: IService,
  ) {}

  /** Detalles de una factura (id = billId). */
  async getById(id: number): Promise<BillDetails[]> {
    return this.detailRepo.find({
      where: { billId: id },
      relations: ["product"],
      order: { billDetailId: "ASC" },
    });
  }

  save(body: SaveBillDetailDTO): Promise<BillDetails[]> {
    return this.saveAll(body);
  }

  /**
   * Agrega productos a la cuenta. Si el producto ya está en la cuenta
   * suma la cantidad a la línea existente. Descuenta stock y recalcula el total.
   */
  async saveAll(data: SaveBillDetailDTO): Promise<BillDetails[]> {
    return this.detailRepo.manager.transaction(async (manager) => {
      await this.getEditableBill(manager, data.billId);

      const quantities = new Map<number, number>();
      for (const item of data.billDetails) {
        quantities.set(
          item.productId,
          (quantities.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const productIds = [...quantities.keys()];
      const products = await manager.find(Product, {
        where: { productId: In(productIds) },
      });
      for (const productId of productIds) {
        const product = products.find((p) => p.productId === productId);
        if (!product) {
          throw AppError.badRequest(`Producto con ID ${productId} no encontrado`);
        }
        if (!product.active) {
          throw AppError.badRequest(`El producto "${product.name}" no está disponible`);
        }
      }

      await adjustStockForProducts(manager, quantities);

      const existing = await manager.find(BillDetails, {
        where: { billId: data.billId, productId: In(productIds) },
      });

      const toSave = productIds.map((productId) => {
        const product = products.find((p) => p.productId === productId)!;
        const line =
          existing.find((d) => d.productId === productId) ??
          Object.assign(new BillDetails(), {
            billId: data.billId,
            productId,
            quantity: 0,
            unitPrice: product.price,
          });
        line.quantity += quantities.get(productId)!;
        line.subTotal = round2(line.quantity * line.unitPrice);
        return line;
      });

      const saved = await manager.save(toSave);
      await this.recalculateTotal(manager, data.billId);
      return saved;
    });
  }

  /** Cambia la cantidad de una línea (PATCH). Ajusta stock por la diferencia. */
  async update(body: { billDetailId: number; quantity: number }) {
    return this.detailRepo.manager.transaction(async (manager) => {
      const detail = await this.getDetail(manager, body.billDetailId);
      await this.getEditableBill(manager, detail.billId);

      const delta = body.quantity - detail.quantity;
      await adjustStockForProducts(manager, new Map([[detail.productId, delta]]));

      detail.quantity = body.quantity;
      detail.subTotal = round2(detail.quantity * detail.unitPrice);
      const saved = await manager.save(detail);
      await this.recalculateTotal(manager, detail.billId);
      return saved;
    });
  }

  /** Quita la línea, devuelve el stock y recalcula el total. */
  async delete(id: number): Promise<any> {
    await this.detailRepo.manager.transaction(async (manager) => {
      const detail = await this.getDetail(manager, id);
      await this.getEditableBill(manager, detail.billId);

      await adjustStockForProducts(
        manager,
        new Map([[detail.productId, -detail.quantity]]),
      );
      await manager.delete(BillDetails, { billDetailId: id });
      await this.recalculateTotal(manager, detail.billId);
    });
    return { message: "Detalle eliminado correctamente", id };
  }

  getAll(): Promise<BillDetails[]> {
    return this.detailRepo.find({ relations: ["product"] });
  }

  private async getDetail(manager: EntityManager, id: number) {
    const detail = await manager.findOne(BillDetails, {
      where: { billDetailId: id },
    });
    if (!detail) throw new Error(`Detalle con ID ${id} no encontrado`);
    return detail;
  }

  private async getEditableBill(manager: EntityManager, billId: number) {
    const bill = await manager.findOne(Bill, { where: { billId } });
    if (!bill) {
      throw AppError.badRequest(`Bill con ID ${billId} no encontrado`);
    }
    if (!EDITABLE_STATUSES.includes(bill.status)) {
      throw AppError.conflict(
        `La cuenta ${billId} está ${bill.status} y no se puede modificar`,
      );
    }
    return bill;
  }

  private async recalculateTotal(manager: EntityManager, billId: number) {
    const raw = await manager
      .createQueryBuilder(BillDetails, "d")
      .select("COALESCE(SUM(d.sub_total), 0)", "total")
      .where("d.bill_id = :billId", { billId })
      .getRawOne<{ total: string }>();
    await manager.update(
      Bill,
      { billId },
      { total: round2(parseFloat(raw?.total ?? "0")) },
    );
  }
}
