import * as billController from "../BillController";
import { IService } from "../../core/interfaces/IService";
import {
  createBillSchema,
  updateBillSchema,
  billIdSchema,
  tableIdSchema,
} from "../../application/validations/BillValidations";

jest.mock("../../application/validations/BillValidations", () => ({
  createBillSchema: { parse: jest.fn() },
  updateBillSchema: { parse: jest.fn() },
  billIdSchema: { parse: jest.fn() },
  tableIdSchema: { parse: jest.fn() },
}));
const mockedCreateBillSchema = createBillSchema as jest.Mocked<
  typeof createBillSchema
>;
const mockedUpdateBillSchema = updateBillSchema as jest.Mocked<
  typeof updateBillSchema
>;
const mockedBillIdSchema = billIdSchema as jest.Mocked<typeof billIdSchema>;
const mockedTableIdSchema = tableIdSchema as jest.Mocked<typeof tableIdSchema>;

describe("BillController", () => {
  let mockService: jest.Mocked<IService>;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    // Crear el mock del servicio
    mockService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      save: jest.fn(),
      saveAll: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    } as any;

    // Añadir métodos específicos del BillService
    (mockService as any).getByDateRange = jest.fn();
    (mockService as any).getBillsByCustomer = jest.fn();
    (mockService as any).getBillsByTable = jest.fn();
    (mockService as any).closeBillsByTable = jest.fn();

    // Establecer el servicio mock
    billController.setService(mockService);

    mockReq = {
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getBills", () => {
    it("deberia retornar las facturas exitosamente", async () => {
      const facturasSimuladas = [
        { billId: 1, customer: "Cliente 1", total: 100 },
        { billId: 2, customer: "Cliente 2", total: 300 },
      ];

      mockService.getAll.mockResolvedValue(facturasSimuladas);

      await billController.getBills(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Facturas obtenidas correctamente",
        data: facturasSimuladas,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Facturas obtenidas correctamente",
      );
    });

    it("deberia manejar errores al obtener las facturas", async () => {
      const mensajeError = "Error de conexión a la base de datos";
      mockService.getAll.mockRejectedValue(new Error(mensajeError));

      await billController.getBills(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error al obtener las facturas: " + mensajeError,
      });
    });

    it("debería retornar un array vacío cuando no hay facturas", async () => {
      const facturasVacias: any[] = [];

      mockService.getAll.mockResolvedValue(facturasVacias);

      await billController.getBills(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Facturas obtenidas correctamente",
        data: [],
      });
      expect(console.log).toHaveBeenCalledWith(
        "Facturas obtenidas correctamente",
      );
    });
  });

  describe("getBillById", () => {
    it("debería obtener una factura por ID exitosamente", async () => {
      const factura = {
        billId: 1,
        customer: "Juan Pérez",
        total: 250,
        date: new Date(),
      };

      mockReq.params = { id: "1" };
      mockedBillIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockResolvedValue(factura);

      await billController.getBillById(mockReq, mockRes);

      expect(mockedBillIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Factura obtenida correctamente",
        data: factura,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Factura obtenida correctamente",
      );
    });

    it("debería manejar errores de validación ZodError para ID inválido", async () => {
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El ID debe ser un número positivo",
            path: ["id"],
            code: "custom",
          },
        ],
      };

      mockReq.params = { id: "invalid" };
      mockedBillIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await billController.getBillById(mockReq, mockRes);

      expect(mockedBillIdSchema.parse).toHaveBeenCalledWith({ id: "invalid" });
      expect(mockService.getById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Factura obtenida correctamente",
      );
    });

    it("debería manejar error cuando la factura no existe", async () => {
      const errorNoEncontrada = new Error("Factura no encontrada");

      mockReq.params = { id: "999" };
      mockedBillIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.getById.mockRejectedValue(errorNoEncontrada);

      await billController.getBillById(mockReq, mockRes);

      expect(mockedBillIdSchema.parse).toHaveBeenCalledWith({ id: "999" });
      expect(mockService.getById).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: errorNoEncontrada.message,
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = { id: "1" };
      mockedBillIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockRejectedValue(errorServidor);

      await billController.getBillById(mockReq, mockRes);

      expect(mockedBillIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener la factura: ${errorServidor.message}`,
      });
    });
  });

  describe("saveBill", () => {
    it("deberia guardar la factura exitosamente", async () => {
      const datosFactura = {
        cashRegister: 1,
        customer: "Juan Pérez",
        total: 200,
        date: new Date(),
      };

      const facturaGuardada = { billId: 1, ...datosFactura };

      mockReq.body = datosFactura;
      mockedCreateBillSchema.parse.mockReturnValue(datosFactura);
      mockService.save.mockResolvedValue(facturaGuardada);

      await billController.saveBill(mockReq, mockRes);

      expect(mockedCreateBillSchema.parse).toHaveBeenCalledWith(datosFactura);
      expect(mockService.save).toHaveBeenCalledWith(datosFactura);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Factura creada correctamente",
        data: facturaGuardada,
      });
      expect(console.log).toHaveBeenCalledWith("Factura creada correctamente");
    });

    it("debería manejar errores de validación ZodError", async () => {
      const datosInvalidos = { customer: "" };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El nombre del cliente es requerido",
            path: ["customer"],
            code: "invalid_type",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreateBillSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await billController.saveBill(mockReq, mockRes);

      expect(mockedCreateBillSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre del cliente es requerido",
        campo: ["customer"],
        error: "invalid_type",
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const datosFactura = { customer: "Juan Pérez" };
      const errorServidor = new Error("Error interno del servidor");

      mockReq.body = datosFactura;
      mockedCreateBillSchema.parse.mockReturnValue({
        cashRegister: 1,
        customer: datosFactura.customer,
        total: 0,
        date: new Date(),
      });
      mockService.save.mockRejectedValue(errorServidor);

      await billController.saveBill(mockReq, mockRes);

      expect(mockedCreateBillSchema.parse).toHaveBeenCalledWith(datosFactura);
      expect(mockService.save).toHaveBeenCalledWith({
        cashRegister: 1,
        customer: datosFactura.customer,
        total: 0,
        date: expect.any(Date),
      });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Error interno del servidor",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al crear factura:",
        errorServidor,
      );
    });

    it("debería manejar errores sin mensaje específico", async () => {
      const datosFactura = { customer: "Juan Pérez" };
      const errorSinMensaje = {};

      mockReq.body = datosFactura;
      mockedCreateBillSchema.parse.mockReturnValue({
        cashRegister: 1,
        customer: datosFactura.customer,
        total: 0,
        date: new Date(),
      });
      mockService.save.mockRejectedValue(errorSinMensaje);

      await billController.saveBill(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: undefined",
      });
    });
  });

  describe("updateBill", () => {
    it("debería actualizar una factura exitosamente", async () => {
      const datosActualizacion = {
        customer: "Juan Pérez Actualizado",
        total: 350,
      };

      const facturaActualizada = {
        billId: 1,
        customer: "Juan Pérez Actualizado",
        total: 350,
        date: new Date(),
      };

      mockReq.params = { id: "1" };
      mockReq.body = datosActualizacion;
      mockedBillIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateBillSchema.parse.mockReturnValue(datosActualizacion);
      mockService.update.mockResolvedValue(facturaActualizada);

      await billController.updateBill(mockReq, mockRes);

      expect(mockedBillIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockedUpdateBillSchema.parse).toHaveBeenCalledWith(
        datosActualizacion,
      );
      expect(mockService.update).toHaveBeenCalledWith({
        billId: 1,
        ...datosActualizacion,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Factura actualizada correctamente",
        data: facturaActualizada,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Factura actualizada correctamente",
      );
    });

    it("debería manejar errores de validación ZodError para ID inválido", async () => {
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El ID debe ser un número positivo",
            path: ["id"],
            code: "custom",
          },
        ],
      };

      mockReq.params = { id: "invalid" };
      mockReq.body = { customer: "Test" };
      mockedBillIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await billController.updateBill(mockReq, mockRes);

      expect(mockedBillIdSchema.parse).toHaveBeenCalledWith({ id: "invalid" });
      expect(mockedUpdateBillSchema.parse).not.toHaveBeenCalled();
      expect(mockService.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El ID debe ser un número positivo",
        campo: ["id"],
      });
    });

    it("debería manejar error cuando la factura no existe", async () => {
      const errorNoEncontrada = new Error("Factura no encontrada");

      mockReq.params = { id: "999" };
      mockReq.body = { customer: "Test" };
      mockedBillIdSchema.parse.mockReturnValue({ id: 999 });
      mockedUpdateBillSchema.parse.mockReturnValue({ customer: "Test" });
      mockService.update.mockRejectedValue(errorNoEncontrada);

      await billController.updateBill(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        billId: 999,
        customer: "Test",
      });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: errorNoEncontrada.message,
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = { id: "1" };
      mockReq.body = { customer: "Test" };
      mockedBillIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateBillSchema.parse.mockReturnValue({ customer: "Test" });
      mockService.update.mockRejectedValue(errorServidor);

      await billController.updateBill(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        billId: 1,
        customer: "Test",
      });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al actualizar factura:",
        errorServidor,
      );
    });
  });

  describe("deleteBill", () => {
    it("debería eliminar una factura exitosamente", async () => {
      const facturaEliminada = {
        billId: 1,
        customer: "Juan Pérez",
        total: 200,
      };

      mockReq.params = { id: "1" };
      mockedBillIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockResolvedValue(facturaEliminada);

      await billController.deleteBill(mockReq, mockRes);

      expect(mockedBillIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Factura eliminada correctamente",
        data: facturaEliminada,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Factura eliminada correctamente",
      );
    });

    it("debería manejar errores de validación ZodError para ID inválido", async () => {
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El ID debe ser un número positivo",
            path: ["id"],
            code: "custom",
          },
        ],
      };

      mockReq.params = { id: "invalid" };
      mockedBillIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await billController.deleteBill(mockReq, mockRes);

      expect(mockedBillIdSchema.parse).toHaveBeenCalledWith({ id: "invalid" });
      expect(mockService.delete).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Factura eliminada correctamente",
      );
    });

    it("debería manejar error cuando la factura no existe", async () => {
      const errorNoEncontrada = new Error("Factura no encontrada");

      mockReq.params = { id: "999" };
      mockedBillIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.delete.mockRejectedValue(errorNoEncontrada);

      await billController.deleteBill(mockReq, mockRes);

      expect(mockedBillIdSchema.parse).toHaveBeenCalledWith({ id: "999" });
      expect(mockService.delete).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: errorNoEncontrada.message,
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = { id: "1" };
      mockedBillIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockRejectedValue(errorServidor);

      await billController.deleteBill(mockReq, mockRes);

      expect(mockedBillIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al eliminar factura:",
        errorServidor,
      );
    });
  });

  describe("getBillsByDateRange", () => {
    it("debería obtener facturas por rango de fechas exitosamente", async () => {
      const facturas = [
        {
          billId: 1,
          customer: "Cliente 1",
          total: 100,
          date: new Date("2023-01-01"),
        },
        {
          billId: 2,
          customer: "Cliente 2",
          total: 200,
          date: new Date("2023-01-02"),
        },
      ];

      mockReq.query = { startDate: "2023-01-01", endDate: "2023-01-31" };
      (mockService as any).getByDateRange.mockResolvedValue(facturas);

      await billController.getBillsByDateRange(mockReq, mockRes);

      expect((mockService as any).getByDateRange).toHaveBeenCalledWith(
        new Date("2023-01-01"),
        new Date("2023-01-31"),
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Facturas obtenidas por rango de fecha correctamente",
        data: facturas,
      });
    });

    it("debería manejar error cuando faltan parámetros de fecha", async () => {
      mockReq.query = { startDate: "2023-01-01" }; // falta endDate

      await billController.getBillsByDateRange(mockReq, mockRes);

      expect((mockService as any).getByDateRange).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "startDate y endDate son requeridos",
      });
    });

    it("debería manejar errores del servidor al obtener facturas por fecha", async () => {
      const errorServidor = new Error("Error de conexión a la base de datos");

      mockReq.query = { startDate: "2023-01-01", endDate: "2023-01-31" };
      (mockService as any).getByDateRange.mockRejectedValue(errorServidor);

      await billController.getBillsByDateRange(mockReq, mockRes);

      expect((mockService as any).getByDateRange).toHaveBeenCalledWith(
        new Date("2023-01-01"),
        new Date("2023-01-31"),
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener las facturas por rango de fecha: ${errorServidor.message}`,
      });
    });
  });

  describe("getBillsByCustomer", () => {
    it("debería obtener facturas por cliente exitosamente", async () => {
      const facturas = [
        { billId: 1, customer: "Juan Pérez", total: 100 },
        { billId: 3, customer: "Juan Pérez", total: 150 },
      ];

      mockReq.params = { customer: "Juan Pérez" };
      (mockService as any).getBillsByCustomer.mockResolvedValue(facturas);

      await billController.getBillsByCustomer(mockReq, mockRes);

      expect((mockService as any).getBillsByCustomer).toHaveBeenCalledWith(
        "Juan Pérez",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Facturas del cliente obtenidas correctamente",
        data: facturas,
      });
    });

    it("debería manejar errores del servidor al obtener facturas por cliente", async () => {
      const errorServidor = new Error("Error de conexión a la base de datos");

      mockReq.params = { customer: "Juan Pérez" };
      (mockService as any).getBillsByCustomer.mockRejectedValue(errorServidor);

      await billController.getBillsByCustomer(mockReq, mockRes);

      expect((mockService as any).getBillsByCustomer).toHaveBeenCalledWith(
        "Juan Pérez",
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener las facturas del cliente: ${errorServidor.message}`,
      });
    });

    it("debería retornar array vacío cuando el cliente no tiene facturas", async () => {
      const facturasVacias: any[] = [];

      mockReq.params = { customer: "Cliente Sin Facturas" };
      (mockService as any).getBillsByCustomer.mockResolvedValue(facturasVacias);

      await billController.getBillsByCustomer(mockReq, mockRes);

      expect((mockService as any).getBillsByCustomer).toHaveBeenCalledWith(
        "Cliente Sin Facturas",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Facturas del cliente obtenidas correctamente",
        data: [],
      });
    });
  });

  describe("setService", () => {
    it("debería establecer el servicio correctamente", async () => {
      const nuevoServicio = {
        getAll: jest.fn(),
        getById: jest.fn(),
        save: jest.fn(),
        saveAll: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      } as any;

      // Añadir métodos específicos del BillService
      nuevoServicio.getByDateRange = jest.fn();
      nuevoServicio.getBillsByCustomer = jest.fn();
      nuevoServicio.getBillsByTable = jest.fn();
      nuevoServicio.closeBillsByTable = jest.fn();

      expect(() => billController.setService(nuevoServicio)).not.toThrow();

      // Verificar que el servicio se estableció correctamente
      nuevoServicio.getAll.mockResolvedValue([]);
      await billController.getBills(mockReq, mockRes);

      expect(nuevoServicio.getAll).toHaveBeenCalled();
    });
  });

  describe("closeBillsByTable", () => {
    it("debería cerrar todas las facturas de una mesa exitosamente", async () => {
      const tableId = "A1";
      const resultado = { updated: 3 };

      mockReq.params = { tableId };
      mockedTableIdSchema.parse.mockReturnValue({ tableId });
      (mockService as any).closeBillsByTable.mockResolvedValue(resultado);

      await billController.closeBillsByTable(mockReq, mockRes);

      expect(mockedTableIdSchema.parse).toHaveBeenCalledWith({ tableId });
      expect((mockService as any).closeBillsByTable).toHaveBeenCalledWith(
        tableId,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: `Se cerraron 3 facturas de la mesa ${tableId}`,
        data: resultado,
      });
    });

    it("debería manejar correctamente cuando no hay facturas para cerrar", async () => {
      const tableId = "B3";
      const resultado = { updated: 0 };

      mockReq.params = { tableId };
      mockedTableIdSchema.parse.mockReturnValue({ tableId });
      (mockService as any).closeBillsByTable.mockResolvedValue(resultado);

      await billController.closeBillsByTable(mockReq, mockRes);

      expect(mockedTableIdSchema.parse).toHaveBeenCalledWith({ tableId });
      expect((mockService as any).closeBillsByTable).toHaveBeenCalledWith(
        tableId,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: `Se cerraron 0 facturas de la mesa ${tableId}`,
        data: resultado,
      });
    });

    it("debería manejar errores de validación ZodError para tableId inválido", async () => {
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El ID de la mesa es requerido",
            path: ["tableId"],
          },
        ],
      };

      mockReq.params = { tableId: "" };
      mockedTableIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await billController.closeBillsByTable(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El ID de la mesa es requerido",
        campo: ["tableId"],
      });
    });

    it("debería manejar errores de validación para tableId muy largo", async () => {
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El ID de la mesa no puede tener más de 10 caracteres",
            path: ["tableId"],
          },
        ],
      };

      mockReq.params = { tableId: "MESA_SUPER_LARGA_123456" };
      mockedTableIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await billController.closeBillsByTable(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message:
          "Datos inválidos: El ID de la mesa no puede tener más de 10 caracteres",
        campo: ["tableId"],
      });
    });

    it("debería manejar errores del servidor al cerrar facturas", async () => {
      const tableId = "VIP1";
      const errorServidor = new Error("Error de conexión a la base de datos");

      mockReq.params = { tableId };
      mockedTableIdSchema.parse.mockReturnValue({ tableId });
      (mockService as any).closeBillsByTable.mockRejectedValue(errorServidor);

      await billController.closeBillsByTable(mockReq, mockRes);

      expect((mockService as any).closeBillsByTable).toHaveBeenCalledWith(
        tableId,
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al cerrar las facturas de la mesa: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al cerrar facturas por mesa:",
        errorServidor,
      );
    });

    it("debería cerrar una sola factura exitosamente", async () => {
      const tableId = "C4";
      const resultado = { updated: 1 };

      mockReq.params = { tableId };
      mockedTableIdSchema.parse.mockReturnValue({ tableId });
      (mockService as any).closeBillsByTable.mockResolvedValue(resultado);

      await billController.closeBillsByTable(mockReq, mockRes);

      expect(mockedTableIdSchema.parse).toHaveBeenCalledWith({ tableId });
      expect((mockService as any).closeBillsByTable).toHaveBeenCalledWith(
        tableId,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: `Se cerraron 1 facturas de la mesa ${tableId}`,
        data: resultado,
      });
    });
  });
});
