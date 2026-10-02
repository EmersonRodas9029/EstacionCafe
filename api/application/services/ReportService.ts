import { DataSource } from "typeorm";
import { Status } from "../../core/enums/Status";

const SOLD = [Status.CLOSED, Status.FINISHED];
const TZ = "America/El_Salvador";

const num = (value: unknown) => Math.round(Number(value ?? 0) * 100) / 100;

export interface SalesReport {
  range: { from: Date; to: Date };
  summary: {
    totalSales: number;
    billsCount: number;
    averageTicket: number;
    costOfGoods: number;
    grossProfit: number;
    purchasesTotal: number;
  };
  byDay: { date: string; total: number; bills: number }[];
  topProducts: {
    productId: number;
    name: string;
    quantity: number;
    total: number;
  }[];
  byProductType: {
    productTypeId: number | null;
    name: string;
    quantity: number;
    total: number;
  }[];
  byWaiter: { waiterId: number; username: string; bills: number; total: number }[];
  byOrderType: { orderType: string; bills: number; total: number }[];
  /** Para cuadrar caja; `null` = ventas anteriores a registrar el método */
  byPaymentMethod: { paymentMethod: string | null; bills: number; total: number }[];
}

/**
 * Reportes agregados en SQL. Ventas = cuentas closed o finished
 * dentro del rango (por fecha de la cuenta).
 */
export class ReportService {
  constructor(private dataSource: DataSource) {}

  async sales(from: Date, to: Date, top = 10): Promise<SalesReport> {
    const params = [from, to, SOLD];
    const billFilter = `b.date >= $1 AND b.date <= $2 AND b.status = ANY($3)`;
    const q = (sql: string, extra: unknown[] = []) =>
      this.dataSource.query(sql, [...params, ...extra]);

    const [summary] = await q(
      `SELECT COALESCE(SUM(b.total), 0) AS total, COUNT(*) AS bills
         FROM bills b WHERE ${billFilter}`,
    );

    const [cost] = await q(
      `SELECT COALESCE(SUM(d.quantity * p.cost), 0) AS cost
         FROM bill_details d
         JOIN bills b ON b.bill_id = d.bill_id
         JOIN products p ON p.product_id = d.product_id
        WHERE ${billFilter}`,
    );

    const [purchases] = await this.dataSource.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM purchases
        WHERE date >= $1 AND date <= $2`,
      [from, to],
    );

    const byDay = await q(
      `SELECT to_char(b.date AT TIME ZONE '${TZ}', 'YYYY-MM-DD') AS date,
              SUM(b.total) AS total, COUNT(*) AS bills
         FROM bills b WHERE ${billFilter}
        GROUP BY 1 ORDER BY 1`,
    );

    const topProducts = await q(
      `SELECT p.product_id AS "productId", p.name,
              SUM(d.quantity) AS quantity, SUM(d.sub_total) AS total
         FROM bill_details d
         JOIN bills b ON b.bill_id = d.bill_id
         JOIN products p ON p.product_id = d.product_id
        WHERE ${billFilter}
        GROUP BY p.product_id, p.name
        ORDER BY quantity DESC, total DESC
        LIMIT $4`,
      [top],
    );

    const byProductType = await q(
      `SELECT pt.product_type_id AS "productTypeId",
              COALESCE(pt.name, 'Sin categoría') AS name,
              SUM(d.quantity) AS quantity, SUM(d.sub_total) AS total
         FROM bill_details d
         JOIN bills b ON b.bill_id = d.bill_id
         JOIN products p ON p.product_id = d.product_id
         LEFT JOIN product_types pt ON pt.product_type_id = p.product_type_id
        WHERE ${billFilter}
        GROUP BY pt.product_type_id, pt.name
        ORDER BY total DESC`,
    );

    const byWaiter = await q(
      `SELECT u.user_id AS "waiterId", u.username,
              COUNT(*) AS bills, SUM(b.total) AS total
         FROM bills b JOIN users u ON u.user_id = b.waiter_id
        WHERE ${billFilter}
        GROUP BY u.user_id, u.username
        ORDER BY total DESC`,
    );

    const byOrderType = await q(
      `SELECT b.order_type AS "orderType", COUNT(*) AS bills, SUM(b.total) AS total
         FROM bills b WHERE ${billFilter}
        GROUP BY b.order_type`,
    );

    const byPaymentMethod = await q(
      `SELECT b.payment_method AS "paymentMethod", COUNT(*) AS bills, SUM(b.total) AS total
         FROM bills b WHERE ${billFilter}
        GROUP BY b.payment_method
        ORDER BY total DESC`,
    );

    const totalSales = num(summary.total);
    const billsCount = Number(summary.bills);
    const costOfGoods = num(cost.cost);

    return {
      range: { from, to },
      summary: {
        totalSales,
        billsCount,
        averageTicket: billsCount ? num(totalSales / billsCount) : 0,
        costOfGoods,
        grossProfit: num(totalSales - costOfGoods),
        purchasesTotal: num(purchases.total),
      },
      byDay: byDay.map((r: any) => ({
        date: r.date,
        total: num(r.total),
        bills: Number(r.bills),
      })),
      topProducts: topProducts.map((r: any) => ({
        productId: r.productId,
        name: r.name,
        quantity: Number(r.quantity),
        total: num(r.total),
      })),
      byProductType: byProductType.map((r: any) => ({
        productTypeId: r.productTypeId,
        name: r.name,
        quantity: Number(r.quantity),
        total: num(r.total),
      })),
      byWaiter: byWaiter.map((r: any) => ({
        waiterId: r.waiterId,
        username: r.username,
        bills: Number(r.bills),
        total: num(r.total),
      })),
      byOrderType: byOrderType.map((r: any) => ({
        orderType: r.orderType,
        bills: Number(r.bills),
        total: num(r.total),
      })),
      byPaymentMethod: byPaymentMethod.map((r: any) => ({
        paymentMethod: r.paymentMethod,
        bills: Number(r.bills),
        total: num(r.total),
      })),
    };
  }
}
