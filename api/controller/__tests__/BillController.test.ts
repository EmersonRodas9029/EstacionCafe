import * as billController from "../BillController";
import { AppError } from "../../application/errors/AppError";
import { OrderType } from "../../core/enums/OrderType";
import { Status } from "../../core/enums/Status";

const ACTOR = { userId: 7, username: "mesero.demo", role: "mesero" };

describe("BillController", () => {
  let mockService: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      save: jest.fn(),
      saveAll: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      getByDateRange: jest.fn(),
      getBillsByCustomer: jest.fn(),
      getBillsByTable: jest.fn(),
      closeBillsByTable: jest.fn(),
    };
    billController.setService(mockService);

    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { userId: 7, username: "mesero.demo", role: "mesero" },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  describe("getBills", () => {
    it("lista facturas sin paginación", async () => {
      const items = [{ billId: 1 }, { billId: 2 }];
      mockService.find.mockResolvedValue({ items, total: 2 });

      await billController.getBills(mockReq, mockRes);

      expect(mockService.find).toHaveBeenCalledWith({}, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Facturas obtenidas correctamente",
        data: items,
      });
    });

    it("aplica filtros, mine=true y devuelve meta al paginar", async () => {
      mockReq.query = {
        status: "open",
        orderType: "takeaway",
        mine: "true",
        page: "2",
        limit: "10",
      };
      mockService.find.mockResolvedValue({ items: [], total: 15 });

      await billController.getBills(mockReq, mockRes);

      expect(mockService.find).toHaveBeenCalledWith({
        status: Status.OPEN,
        orderType: OrderType.TAKEAWAY,
        waiterId: 7,
        page: 2,
        limit: 10,
      }, ACTOR);
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.objectContaining({ meta: { page: 2, limit: 10, total: 15 } }),
      );
    });

    it("responde 400 con filtros inválidos", async () => {
      mockReq.query = { status: "pagada" };

      await billController.getBills(mockReq, mockRes);

      expect(mockService.find).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("responde 500 si falla el servicio", async () => {
      mockService.find.mockRejectedValue(new Error("db caída"));

      await billController.getBills(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error al obtener las facturas: db caída",
      });
    });
  });

  describe("getBillById", () => {
    it("devuelve la factura", async () => {
      mockReq.params = { id: "3" };
      mockService.getById.mockResolvedValue({ billId: 3 });

      await billController.getBillById(mockReq, mockRes);

      expect(mockService.getById).toHaveBeenCalledWith(3, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("responde 400 con ID inválido", async () => {
      mockReq.params = { id: "abc" };

      await billController.getBillById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("responde 404 si no existe", async () => {
      mockReq.params = { id: "99" };
      mockService.getById.mockRejectedValue(
        new Error("Factura con ID 99 no encontrada"),
      );

      await billController.getBillById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("saveBill", () => {
    it("crea una cuenta en mesa con el mesero del token", async () => {
      mockReq.body = { customer: "Cuenta 1", tableId: "M1" };
      mockService.save.mockResolvedValue({ billId: 1 });

      await billController.saveBill(mockReq, mockRes);

      expect(mockService.save).toHaveBeenCalledWith({
        customer: "Cuenta 1",
        tableId: "M1",
        orderType: OrderType.DINE_IN,
        waiterId: 7,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("sin mesa deduce orden para llevar", async () => {
      mockReq.body = { customer: "Ana" };
      mockService.save.mockResolvedValue({ billId: 2 });

      await billController.saveBill(mockReq, mockRes);

      expect(mockService.save).toHaveBeenCalledWith(
        expect.objectContaining({ orderType: OrderType.TAKEAWAY }),
      );
    });

    it("rechaza dine_in sin mesa", async () => {
      mockReq.body = { customer: "Ana", orderType: "dine_in" };

      await billController.saveBill(mockReq, mockRes);

      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.objectContaining({ campo: ["tableId"] }),
      );
    });

    it("rechaza para llevar con mesa", async () => {
      mockReq.body = { customer: "Ana", orderType: "takeaway", tableId: "M1" };

      await billController.saveBill(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("propaga AppError del servicio (mesa inexistente)", async () => {
      mockReq.body = { customer: "Ana", tableId: "Z9" };
      mockService.save.mockRejectedValue(
        AppError.badRequest("Mesa Z9 no encontrada"),
      );

      await billController.saveBill(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Mesa Z9 no encontrada",
      });
    });
  });

  describe("updateBill", () => {
    it("actualiza estado y caja", async () => {
      mockReq.params = { id: "1" };
      mockReq.body = { status: "closed", cashRegisterId: 2 };
      mockService.update.mockResolvedValue({ billId: 1, status: "closed" });

      await billController.updateBill(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        billId: 1,
        status: Status.CLOSED,
        cashRegisterId: 2,
      }, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("no permite modificar el total directamente", async () => {
      mockReq.params = { id: "1" };
      mockReq.body = { total: 5 };

      await billController.updateBill(mockReq, mockRes);

      expect(mockService.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("responde 400 si se cierra sin caja", async () => {
      mockReq.params = { id: "1" };
      mockReq.body = { status: "closed" };
      mockService.update.mockRejectedValue(
        AppError.badRequest("Se requiere cashRegisterId para cerrar la cuenta"),
      );

      await billController.updateBill(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("responde 404 si no existe", async () => {
      mockReq.params = { id: "9" };
      mockReq.body = { customer: "X" };
      mockService.update.mockRejectedValue(
        new Error("Factura con ID 9 no encontrada"),
      );

      await billController.updateBill(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteBill", () => {
    it("elimina la factura", async () => {
      mockReq.params = { id: "4" };
      mockService.delete.mockResolvedValue({ id: 4 });

      await billController.deleteBill(mockReq, mockRes);

      expect(mockService.delete).toHaveBeenCalledWith(4);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("responde 404 si no existe", async () => {
      mockReq.params = { id: "4" };
      mockService.delete.mockRejectedValue(
        new Error("Factura con ID 4 no encontrada"),
      );

      await billController.deleteBill(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getBillsByDateRange", () => {
    it("exige startDate y endDate", async () => {
      await billController.getBillsByDateRange(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("consulta el rango", async () => {
      mockReq.query = { startDate: "2026-01-01", endDate: "2026-01-31" };
      mockService.getByDateRange.mockResolvedValue([]);

      await billController.getBillsByDateRange(mockReq, mockRes);

      expect(mockService.getByDateRange).toHaveBeenCalledWith(
        new Date("2026-01-01"),
        new Date("2026-01-31"), ACTOR
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getBillsByCustomer / getBillsByTable", () => {
    it("filtra por cliente", async () => {
      mockReq.params = { customer: "Ana" };
      mockService.getBillsByCustomer.mockResolvedValue([]);

      await billController.getBillsByCustomer(mockReq, mockRes);

      expect(mockService.getBillsByCustomer).toHaveBeenCalledWith("Ana", ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("filtra por mesa", async () => {
      mockReq.params = { tableId: "M1" };
      mockService.getBillsByTable.mockResolvedValue([]);

      await billController.getBillsByTable(mockReq, mockRes);

      expect(mockService.getBillsByTable).toHaveBeenCalledWith("M1", ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("closeBillsByTable", () => {
    it("cierra las cuentas de la mesa en la caja indicada", async () => {
      mockReq.params = { tableId: "M1" };
      mockReq.body = { cashRegisterId: 1, paymentMethod: "card" };
      mockService.closeBillsByTable.mockResolvedValue({ updated: 2 });

      await billController.closeBillsByTable(mockReq, mockRes);

      expect(mockService.closeBillsByTable).toHaveBeenCalledWith("M1", 1, ACTOR, "card");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Se cerraron 2 facturas de la mesa M1",
        data: { updated: 2 },
      });
    });

    it("exige cashRegisterId", async () => {
      mockReq.params = { tableId: "M1" };

      await billController.closeBillsByTable(mockReq, mockRes);

      expect(mockService.closeBillsByTable).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
