import * as purchaseController from "../PurchaseController";
import { IService } from "../../core/interfaces/IService";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdSchema,
} from "../../application/validations/PurchaseValidations";

jest.mock("../../application/validations/PurchaseValidations", () => ({
  createPurchaseSchema: { parse: jest.fn() },
  updatePurchaseSchema: { parse: jest.fn() },
  purchaseIdSchema: { parse: jest.fn() },
}));
const mockedCreatePurchaseSchema = createPurchaseSchema as jest.Mocked<
  typeof createPurchaseSchema
>;
const mockedUpdatePurchaseSchema = updatePurchaseSchema as jest.Mocked<
  typeof updatePurchaseSchema
>;
const mockedPurchaseIdSchema = purchaseIdSchema as jest.Mocked<
  typeof purchaseIdSchema
>;

describe("PurchaseController", () => {
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

    // Mock adicional para métodos específicos del PurchaseService
    (mockService as any).getBySupplier = jest.fn();
    (mockService as any).getByDateRange = jest.fn();

    // Establecer el servicio mock
    purchaseController.setService(mockService);

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

  describe("getPurchases", () => {
    it("debería retornar las compras exitosamente", async () => {
      const comprasSimuladas = [
        {
          purchaseId: 1,
          date: new Date("2023-01-15"),
          cashRegister: 1,
          supplierId: 1,
          total: 150.5,
        },
        {
          purchaseId: 2,
          date: new Date("2023-01-20"),
          cashRegister: 2,
          supplierId: 2,
          total: 300.75,
        },
      ];

      mockService.getAll.mockResolvedValue(comprasSimuladas);

      await purchaseController.getPurchases(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Compras obtenidas correctamente",
        data: comprasSimuladas,
      });
    });

    it("debería manejar errores al obtener las compras", async () => {
      const mensajeError = "Error de conexión a la base de datos";
      mockService.getAll.mockRejectedValue(new Error(mensajeError));

      await purchaseController.getPurchases(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener las compras: ${mensajeError}`,
      });
    });
  });

  describe("getPurchaseById", () => {
    it("debería retornar la compra por ID exitosamente", async () => {
      const compraSimulada = [
        {
          purchaseId: 1,
          date: new Date("2023-01-15"),
          cashRegister: 1,
          supplierId: 1,
          total: 150.5,
        },
      ];
      const idParams = { id: "1" };

      mockReq.params = idParams;
      mockedPurchaseIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockResolvedValue(compraSimulada);

      await purchaseController.getPurchaseById(mockReq, mockRes);

      expect(mockedPurchaseIdSchema.parse).toHaveBeenCalledWith(idParams);
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Compra obtenida correctamente",
        data: compraSimulada,
      });
    });

    it("debería manejar errores de validación ZodError para ID inválido", async () => {
      const idInvalido = { id: "invalid" };
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

      mockReq.params = idInvalido;
      mockedPurchaseIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await purchaseController.getPurchaseById(mockReq, mockRes);

      expect(mockedPurchaseIdSchema.parse).toHaveBeenCalledWith(idInvalido);
      expect(mockService.getById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
    });

    it("debería manejar el caso cuando la compra no es encontrada", async () => {
      const idParams = { id: "999" };
      const errorNoEncontrada = new Error("Compra no encontrada");

      mockReq.params = idParams;
      mockedPurchaseIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.getById.mockRejectedValue(errorNoEncontrada);

      await purchaseController.getPurchaseById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Compra no encontrada",
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const idParams = { id: "1" };
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = idParams;
      mockedPurchaseIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockRejectedValue(errorServidor);

      await purchaseController.getPurchaseById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error al obtener la compra: Error interno del servidor",
      });
    });
  });

  describe("createPurchase", () => {
    it("debería crear la compra exitosamente", async () => {
      const datosCompra = {
        date: "2023-01-15",
        cashRegister: "1",
        supplierId: "1",
        total: "150.50",
      };

      const datosValidados = {
        date: new Date("2023-01-15"),
        cashRegister: 1,
        supplierId: 1,
        total: 150.5,
      };

      const compraGuardada = {
        purchaseId: 1,
        ...datosValidados,
      };

      mockReq.body = datosCompra;
      mockedCreatePurchaseSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockResolvedValue(compraGuardada);

      await purchaseController.createPurchase(mockReq, mockRes);

      expect(mockedCreatePurchaseSchema.parse).toHaveBeenCalledWith(
        datosCompra,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Compra creada correctamente",
        data: compraGuardada,
      });
    });

    it("debería manejar errores de validación ZodError para fecha inválida", async () => {
      const datosInvalidos = {
        date: "invalid-date",
        cashRegister: "1",
        supplierId: "1",
        total: "150.50",
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "La fecha debe ser válida",
            path: ["date"],
            code: "custom",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreatePurchaseSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await purchaseController.createPurchase(mockReq, mockRes);

      expect(mockedCreatePurchaseSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: La fecha debe ser válida",
        campo: ["date"],
        error: "custom",
      });
    });

    it("debería manejar errores de validación ZodError para cashRegister inválido", async () => {
      const datosInvalidos = {
        date: "2023-01-15",
        cashRegister: "0",
        supplierId: "1",
        total: "150.50",
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "La caja registradora debe ser un número positivo",
            path: ["cashRegister"],
            code: "custom",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreatePurchaseSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await purchaseController.createPurchase(mockReq, mockRes);

      expect(mockedCreatePurchaseSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message:
          "Datos inválidos: La caja registradora debe ser un número positivo",
        campo: ["cashRegister"],
        error: "custom",
      });
    });

    it("debería manejar errores de validación ZodError para supplierId inválido", async () => {
      const datosInvalidos = {
        date: "2023-01-15",
        cashRegister: "1",
        supplierId: "0",
        total: "150.50",
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El proveedor debe ser un ID válido",
            path: ["supplierId"],
            code: "custom",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreatePurchaseSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await purchaseController.createPurchase(mockReq, mockRes);

      expect(mockedCreatePurchaseSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El proveedor debe ser un ID válido",
        campo: ["supplierId"],
        error: "custom",
      });
    });

    it("debería manejar errores de validación ZodError para total inválido", async () => {
      const datosInvalidos = {
        date: "2023-01-15",
        cashRegister: "1",
        supplierId: "1",
        total: "0",
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El total debe ser mayor a 0",
            path: ["total"],
            code: "custom",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreatePurchaseSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await purchaseController.createPurchase(mockReq, mockRes);

      expect(mockedCreatePurchaseSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El total debe ser mayor a 0",
        campo: ["total"],
        error: "custom",
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const datosCompra = {
        date: "2023-01-15",
        cashRegister: "1",
        supplierId: "1",
        total: "150.50",
      };

      const datosValidados = {
        date: new Date("2023-01-15"),
        cashRegister: 1,
        supplierId: 1,
        total: 150.5,
      };

      const errorServidor = new Error("Error interno del servidor");

      mockReq.body = datosCompra;
      mockedCreatePurchaseSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockRejectedValue(errorServidor);

      await purchaseController.createPurchase(mockReq, mockRes);

      expect(mockedCreatePurchaseSchema.parse).toHaveBeenCalledWith(
        datosCompra,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Error interno del servidor",
      });
    });
  });

  describe("updatePurchase", () => {
    it("debería actualizar la compra exitosamente", async () => {
      const idParams = { id: "1" };
      const datosActualizacion = {
        date: "2023-01-20",
        total: "200.00",
      };

      const datosValidados = {
        date: new Date("2023-01-20"),
        total: 200.0,
      };

      const compraActualizada = {
        purchaseId: 1,
        cashRegister: 1,
        supplierId: 1,
        ...datosValidados,
      };

      mockReq.params = idParams;
      mockReq.body = datosActualizacion;
      mockedPurchaseIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdatePurchaseSchema.parse.mockReturnValue(datosValidados);
      (mockService as any).update.mockResolvedValue(compraActualizada);

      await purchaseController.updatePurchase(mockReq, mockRes);

      expect(mockedPurchaseIdSchema.parse).toHaveBeenCalledWith(idParams);
      expect(mockedUpdatePurchaseSchema.parse).toHaveBeenCalledWith(
        datosActualizacion,
      );
      expect((mockService as any).update).toHaveBeenCalledWith({
        purchaseId: 1,
        ...datosValidados,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Compra actualizada correctamente",
        data: compraActualizada,
      });
    });

    it("debería manejar errores de validación ZodError para ID inválido", async () => {
      const idInvalido = { id: "invalid" };
      const datosActualizacion = { total: "200.00" };
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

      mockReq.params = idInvalido;
      mockReq.body = datosActualizacion;
      mockedPurchaseIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await purchaseController.updatePurchase(mockReq, mockRes);

      expect(mockedPurchaseIdSchema.parse).toHaveBeenCalledWith(idInvalido);
      expect(mockedUpdatePurchaseSchema.parse).not.toHaveBeenCalled();
      expect((mockService as any).update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El ID debe ser un número positivo",
        campo: ["id"],
      });
    });

    it("debería manejar el caso cuando la compra no es encontrada", async () => {
      const idParams = { id: "999" };
      const datosActualizacion = { total: "200.00" };
      const datosValidados = { total: 200.0 };
      const errorNoEncontrada = new Error("Compra no encontrada");

      mockReq.params = idParams;
      mockReq.body = datosActualizacion;
      mockedPurchaseIdSchema.parse.mockReturnValue({ id: 999 });
      mockedUpdatePurchaseSchema.parse.mockReturnValue(datosValidados);
      (mockService as any).update.mockRejectedValue(errorNoEncontrada);

      await purchaseController.updatePurchase(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Compra no encontrada",
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const idParams = { id: "1" };
      const datosActualizacion = { total: "200.00" };
      const datosValidados = { total: 200.0 };
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = idParams;
      mockReq.body = datosActualizacion;
      mockedPurchaseIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdatePurchaseSchema.parse.mockReturnValue(datosValidados);
      (mockService as any).update.mockRejectedValue(errorServidor);

      await purchaseController.updatePurchase(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Error interno del servidor",
      });
    });
  });

  describe("deletePurchase", () => {
    it("debería eliminar la compra exitosamente", async () => {
      const idParams = { id: "1" };
      const resultadoEliminacion = { affected: 1 };

      mockReq.params = idParams;
      mockedPurchaseIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockResolvedValue(resultadoEliminacion);

      await purchaseController.deletePurchase(mockReq, mockRes);

      expect(mockedPurchaseIdSchema.parse).toHaveBeenCalledWith(idParams);
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Compra eliminada correctamente",
        data: resultadoEliminacion,
      });
    });

    it("debería manejar errores de validación ZodError para ID inválido", async () => {
      const idInvalido = { id: "invalid" };
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

      mockReq.params = idInvalido;
      mockedPurchaseIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await purchaseController.deletePurchase(mockReq, mockRes);

      expect(mockedPurchaseIdSchema.parse).toHaveBeenCalledWith(idInvalido);
      expect(mockService.delete).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
    });

    it("debería manejar el caso cuando la compra no es encontrada", async () => {
      const idParams = { id: "999" };
      const errorNoEncontrada = new Error("Compra no encontrada");

      mockReq.params = idParams;
      mockedPurchaseIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.delete.mockRejectedValue(errorNoEncontrada);

      await purchaseController.deletePurchase(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Compra no encontrada",
      });
    });
  });

  describe("getPurchasesBySupplier", () => {
    it("debería retornar las compras del proveedor exitosamente", async () => {
      const supplierId = "1";
      const comprasDelProveedor = [
        {
          purchaseId: 1,
          date: new Date("2023-01-15"),
          cashRegister: 1,
          supplierId: 1,
          total: 150.5,
        },
        {
          purchaseId: 3,
          date: new Date("2023-01-25"),
          cashRegister: 1,
          supplierId: 1,
          total: 275.25,
        },
      ];

      mockReq.params = { supplierId };
      (mockService as any).getBySupplier.mockResolvedValue(comprasDelProveedor);

      await purchaseController.getPurchasesBySupplier(mockReq, mockRes);

      expect((mockService as any).getBySupplier).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Compras del proveedor obtenidas correctamente",
        data: comprasDelProveedor,
      });
    });

    it("debería manejar errores al obtener las compras del proveedor", async () => {
      const supplierId = "1";
      const mensajeError = "Error de conexión a la base de datos";

      mockReq.params = { supplierId };
      (mockService as any).getBySupplier.mockRejectedValue(
        new Error(mensajeError),
      );

      await purchaseController.getPurchasesBySupplier(mockReq, mockRes);

      expect((mockService as any).getBySupplier).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener las compras del proveedor: ${mensajeError}`,
      });
    });
  });

  describe("getPurchasesByDateRange", () => {
    it("debería retornar las compras por rango de fecha exitosamente", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-31";
      const comprasPorFecha = [
        {
          purchaseId: 1,
          date: new Date("2023-01-15"),
          cashRegister: 1,
          supplierId: 1,
          total: 150.5,
        },
        {
          purchaseId: 2,
          date: new Date("2023-01-20"),
          cashRegister: 2,
          supplierId: 2,
          total: 300.75,
        },
      ];

      mockReq.query = { startDate, endDate };
      (mockService as any).getByDateRange.mockResolvedValue(comprasPorFecha);

      await purchaseController.getPurchasesByDateRange(mockReq, mockRes);

      expect((mockService as any).getByDateRange).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Compras por rango de fecha obtenidas correctamente",
        data: comprasPorFecha,
      });
    });

    it("debería manejar el caso cuando faltan parámetros de fecha", async () => {
      mockReq.query = { startDate: "2023-01-01" }; // Falta endDate

      await purchaseController.getPurchasesByDateRange(mockReq, mockRes);

      expect((mockService as any).getByDateRange).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "startDate y endDate son requeridos",
      });
    });

    it("debería manejar el caso cuando faltan ambos parámetros de fecha", async () => {
      mockReq.query = {}; // Sin parámetros

      await purchaseController.getPurchasesByDateRange(mockReq, mockRes);

      expect((mockService as any).getByDateRange).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "startDate y endDate son requeridos",
      });
    });

    it("debería manejar errores al obtener las compras por rango de fecha", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-01-31";
      const mensajeError = "Error de conexión a la base de datos";

      mockReq.query = { startDate, endDate };
      (mockService as any).getByDateRange.mockRejectedValue(
        new Error(mensajeError),
      );

      await purchaseController.getPurchasesByDateRange(mockReq, mockRes);

      expect((mockService as any).getByDateRange).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener las compras por rango de fecha: ${mensajeError}`,
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

      // Agregar métodos específicos del PurchaseService
      (nuevoServicio as any).getBySupplier = jest.fn();
      (nuevoServicio as any).getByDateRange = jest.fn();

      expect(() => purchaseController.setService(nuevoServicio)).not.toThrow();

      // Verificar que el servicio se estableció correctamente
      nuevoServicio.getAll.mockResolvedValue([]);
      await purchaseController.getPurchases(mockReq, mockRes);

      expect(nuevoServicio.getAll).toHaveBeenCalled();
    });
  });

  describe("Casos con diferentes tipos de datos", () => {
    it("debería manejar fechas como Date objects directamente", async () => {
      const datosCompra = {
        date: new Date("2023-01-15"),
        cashRegister: 1,
        supplierId: 1,
        total: 150.5,
      };

      const compraGuardada = {
        purchaseId: 1,
        ...datosCompra,
      };

      mockReq.body = datosCompra;
      mockedCreatePurchaseSchema.parse.mockReturnValue(datosCompra);
      mockService.save.mockResolvedValue(compraGuardada);

      await purchaseController.createPurchase(mockReq, mockRes);

      expect(mockedCreatePurchaseSchema.parse).toHaveBeenCalledWith(
        datosCompra,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosCompra);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar números como numbers directamente", async () => {
      const datosCompra = {
        date: "2023-01-15",
        cashRegister: 1, // number
        supplierId: 2, // number
        total: 150.5, // number
      };

      const datosValidados = {
        date: new Date("2023-01-15"),
        cashRegister: 1,
        supplierId: 2,
        total: 150.5,
      };

      const compraGuardada = {
        purchaseId: 1,
        ...datosValidados,
      };

      mockReq.body = datosCompra;
      mockedCreatePurchaseSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockResolvedValue(compraGuardada);

      await purchaseController.createPurchase(mockReq, mockRes);

      expect(mockedCreatePurchaseSchema.parse).toHaveBeenCalledWith(
        datosCompra,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar valores decimales en total", async () => {
      const datosCompra = {
        date: "2023-01-15",
        cashRegister: "1",
        supplierId: "1",
        total: "150.99",
      };

      const datosValidados = {
        date: new Date("2023-01-15"),
        cashRegister: 1,
        supplierId: 1,
        total: 150.99,
      };

      const compraGuardada = {
        purchaseId: 1,
        ...datosValidados,
      };

      mockReq.body = datosCompra;
      mockedCreatePurchaseSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockResolvedValue(compraGuardada);

      await purchaseController.createPurchase(mockReq, mockRes);

      expect(mockedCreatePurchaseSchema.parse).toHaveBeenCalledWith(
        datosCompra,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
