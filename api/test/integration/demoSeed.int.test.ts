import { DataSource } from "typeorm";
import { closeTestDatabase, setupTestDatabase } from "./db";
import { runDemoSeed } from "../../infrastructure/db/seeders/demoSeeder";
import { ReportService } from "../../application/services/ReportService";
import { TableService } from "../../application/services/TableService";
import { Table } from "../../core/entities/Table";
import { Role } from "../../core/enums/Role";

let ds: DataSource;
// Mediodía fijo en El Salvador: el resultado no depende de la hora en que corre la prueba
const NOW = new Date("2026-03-18T18:00:00Z");

beforeAll(async () => {
  ds = await setupTestDatabase();
});
afterAll(closeTestDatabase);

describe("seed:demo", () => {
  it("genera un mes coherente con cuentas en todos los estados", async () => {
    const summary = await runDemoSeed(ds, NOW);

    expect(summary.days).toBe(30);
    expect(Object.keys(summary.byStatus).sort()).toEqual([
      "closed",
      "draft",
      "finished",
      "open",
      "pending_payment",
      "void",
    ]);
    const [{ unpaid }] = await ds.query(
      `SELECT count(*)::int AS unpaid FROM bills WHERE status IN ('closed', 'finished') AND payment_method IS NULL`,
    );
    expect(unpaid).toBe(0);
    expect(summary.bills).toBeGreaterThan(1000);
    expect(summary.lowStock).toEqual(
      expect.arrayContaining(["Leche de almendra", "Jarabe de caramelo", "Fresas"]),
    );

    const [{ negatives }] = await ds.query(`SELECT count(*)::int AS negatives FROM "Consumable" WHERE quantity < 0`);
    expect(negatives).toBe(0);

    const [{ mismatched }] = await ds.query(`
      SELECT count(*)::int AS mismatched FROM bills b
      WHERE b.total <> (SELECT coalesce(sum(sub_total), 0) FROM bill_details d WHERE d.bill_id = b.bill_id)`);
    expect(mismatched).toBe(0);
    const [{ empty }] = await ds.query(
      `SELECT count(*)::int AS empty FROM bills b WHERE NOT EXISTS (SELECT 1 FROM bill_details d WHERE d.bill_id = b.bill_id)`,
    );
    expect(empty).toBe(0);
  });

  it("el reporte del mes cuadra con la suma de las cuentas vendidas", async () => {
    const from = new Date("2026-02-17T06:00:00Z");
    const to = NOW;
    const report = await new ReportService(ds).sales(from, to);
    const [{ total, bills }] = await ds.query(
      `SELECT coalesce(sum(total), 0)::float AS total, count(*)::int AS bills FROM bills
        WHERE status IN ('closed', 'finished') AND date BETWEEN $1 AND $2`,
      [from, to],
    );
    expect(report.summary.totalSales).toBeCloseTo(total, 2);
    expect(report.summary.billsCount).toBe(bills);
    expect(report.summary.purchasesTotal).toBeGreaterThan(0);
    expect(report.byDay.length).toBeGreaterThanOrEqual(29);
  });

  it("hoy hay mesas atendidas por varios meseros y una reservada", async () => {
    const board = await new TableService(ds.getRepository(Table)).board({ userId: 0, role: Role.ADMIN });
    const shared = board.find((t) => t.tableId === "I2")!;
    expect(shared.attendedBy.map((w) => w.username).sort()).toEqual(["ana.lopez", "mesero.demo"]);
    expect(board.find((t) => t.tableId === "T5")!.status).toBe("reservada");
  });

  it("es determinista para el mismo día", async () => {
    const first = await runDemoSeed(ds, NOW);
    const second = await runDemoSeed(ds, NOW);
    expect(second).toEqual(first);
  });
});
