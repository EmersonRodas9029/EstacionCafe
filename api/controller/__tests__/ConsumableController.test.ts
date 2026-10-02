import * as consumableController from "../ConsumableController";
import { IService } from "../../core/interfaces/IService";
import { UnitMeasurement } from "../../core/enums/UnitMeasurement";

jest.mock("../../application/validations/ConsumableValidations", () => ({
  ConsumableSchema: {
    parse: jest.fn(),
  },
  consumableIdSchema: {
    parse: jest.fn(),
  },
  updateConsumableSchema: {
    parse: jest.fn(),
  },
}));

const {
  ConsumableSchema,
  consumableIdSchema,
  updateConsumableSchema,
} = require("../../application/validations/ConsumableValidations");

describe("ConsumableController", () => {
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

    // Establecer el servicio mock
    consumableController.setService(mockService);

    mockReq = {
      body: {},
      params: {},
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

  describe("saveConsumable", () => {
    it("debería guardar el consumible exitosamente", async () => {
      const datosConsumible = {
        supplierId: 1,
        name: "Azúcar",
        cosumableTypeId: 1,
        quantity: 100,
        unitMeasurement: UnitMeasurement.KILOGRAM,
        cost: 25.5,
      };

      const consumibleGuardado = { consumableId: 1, ...datosConsumible };

      mockReq.body = datosConsumible;
      ConsumableSchema.parse.mockReturnValue(datosConsumible);
      mockService.save.mockResolvedValue(consumibleGuardado);

      await consumableController.saveConsumable(mockReq, mockRes);

      expect(ConsumableSchema.parse).toHaveBeenCalledWith(datosConsumible);
      expect(mockService.save).toHaveBeenCalledWith(datosConsumible);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Consumible guardado correctamente",
        data: consumibleGuardado,
      });
    });

    it("debería manejar errores de validación ZodError para supplierId inválido", async () => {
      const datosInvalidos = {
        supplierId: -1,
        name: "Azúcar",
        cosumableTypeId: 1,
        quantity: 100,
        unitMeasurement: UnitMeasurement.KILOGRAM,
        cost: 25.5,
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El ID del proveedor debe ser un número positivo",
            path: ["supplierId"],
            code: "too_small",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      ConsumableSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await consumableController.saveConsumable(mockReq, mockRes);

      expect(ConsumableSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message:
          "Datos inválidos: El ID del proveedor debe ser un número positivo",
        campo: ["supplierId"],
        error: "too_small",
      });
    });

    it("debería manejar errores de validación ZodError para nombre vacío", async () => {
      const datosInvalidos = {
        supplierId: 1,
        name: "",
        cosumableTypeId: 1,
        quantity: 100,
        unitMeasurement: UnitMeasurement.KILOGRAM,
        cost: 25.5,
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El nombre es requerido",
            path: ["name"],
            code: "too_small",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      ConsumableSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await consumableController.saveConsumable(mockReq, mockRes);

      expect(ConsumableSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre es requerido",
        campo: ["name"],
        error: "too_small",
      });
    });

    it("debería manejar errores de validación ZodError para cantidad negativa", async () => {
      const datosInvalidos = {
        supplierId: 1,
        name: "Azúcar",
        cosumableTypeId: 1,
        quantity: -10,
        unitMeasurement: UnitMeasurement.KILOGRAM,
        cost: 25.5,
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "La cantidad no puede ser negativa",
            path: ["quantity"],
            code: "too_small",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      ConsumableSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await consumableController.saveConsumable(mockReq, mockRes);

      expect(ConsumableSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: La cantidad no puede ser negativa",
        campo: ["quantity"],
        error: "too_small",
      });
    });

    it("debería manejar errores de validación ZodError para costo negativo", async () => {
      const datosInvalidos = {
        supplierId: 1,
        name: "Azúcar",
        cosumableTypeId: 1,
        quantity: 100,
        unitMeasurement: UnitMeasurement.KILOGRAM,
        cost: -5.5,
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El costo no puede ser negativo",
            path: ["cost"],
            code: "too_small",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      ConsumableSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await consumableController.saveConsumable(mockReq, mockRes);

      expect(ConsumableSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El costo no puede ser negativo",
        campo: ["cost"],
        error: "too_small",
      });
    });

    it("debería manejar errores de validación ZodError para unidad de medida inválida", async () => {
      const datosInvalidos = {
        supplierId: 1,
        name: "Azúcar",
        cosumableTypeId: 1,
        quantity: 100,
        unitMeasurement: "invalid_unit" as any,
        cost: 25.5,
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "Unidad de medida inválida",
            path: ["unitMeasurement"],
            code: "invalid_enum_value",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      ConsumableSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await consumableController.saveConsumable(mockReq, mockRes);

      expect(ConsumableSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: Unidad de medida inválida",
        campo: ["unitMeasurement"],
        error: "invalid_enum_value",
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const datosConsumible = {
        supplierId: 1,
        name: "Azúcar",
        cosumableTypeId: 1,
        quantity: 100,
        unitMeasurement: UnitMeasurement.KILOGRAM,
        cost: 25.5,
      };
      const errorServidor = new Error("Error interno del servidor");

      mockReq.body = datosConsumible;
      ConsumableSchema.parse.mockReturnValue(datosConsumible);
      mockService.save.mockRejectedValue(errorServidor);

      await consumableController.saveConsumable(mockReq, mockRes);

      expect(ConsumableSchema.parse).toHaveBeenCalledWith(datosConsumible);
      expect(mockService.save).toHaveBeenCalledWith(datosConsumible);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Error interno del servidor",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al guardar el consumible:",
        errorServidor,
      );
    });

    it("debería manejar errores sin mensaje específico", async () => {
      const datosConsumible = {
        supplierId: 1,
        name: "Azúcar",
        cosumableTypeId: 1,
        quantity: 100,
        unitMeasurement: UnitMeasurement.KILOGRAM,
        cost: 25.5,
      };
      const errorSinMensaje = {};

      mockReq.body = datosConsumible;
      ConsumableSchema.parse.mockReturnValue(datosConsumible);
      mockService.save.mockRejectedValue(errorSinMensaje);

      await consumableController.saveConsumable(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: undefined",
      });
    });
  });

  describe("getConsumables", () => {
    it("debería retornar los consumibles exitosamente", async () => {
      const consumiblesSimulados = [
        {
          consumableId: 1,
          supplierId: 1,
          name: "Azúcar",
          cosumableTypeId: 1,
          quantity: 100,
          unitMeasurement: UnitMeasurement.KILOGRAM,
          cost: 25.5,
        },
        {
          consumableId: 2,
          supplierId: 2,
          name: "Café",
          cosumableTypeId: 2,
          quantity: 50,
          unitMeasurement: UnitMeasurement.KILOGRAM,
          cost: 150.0,
        },
      ];

      mockService.getAll.mockResolvedValue(consumiblesSimulados);

      await consumableController.getConsumables(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Consumibles obtenidos correctamente",
        data: consumiblesSimulados,
      });
    });

    it("debería manejar errores al obtener los consumibles", async () => {
      const mensajeError = "Error de conexión a la base de datos";
      mockService.getAll.mockRejectedValue(new Error(mensajeError));

      await consumableController.getConsumables(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${mensajeError}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al obtener los consumibles:",
        new Error(mensajeError),
      );
    });

    it("debería manejar errores sin mensaje específico", async () => {
      const errorSinMensaje = {};
      mockService.getAll.mockRejectedValue(errorSinMensaje);

      await consumableController.getConsumables(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: undefined",
      });
    });

    it("debería retornar un array vacío cuando no hay consumibles", async () => {
      const consumiblesVacios: any[] = [];

      mockService.getAll.mockResolvedValue(consumiblesVacios);

      await consumableController.getConsumables(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Consumibles obtenidos correctamente",
        data: consumiblesVacios,
      });
    });
  });

  describe("updateConsumable", () => {
    it("debería estar definido", () => {
      expect(consumableController.updateConsumable).toBeDefined();
      expect(typeof consumableController.updateConsumable).toBe("function");
    });

    it("debería actualizar un consumible exitosamente", async () => {
      const updateData = {
        name: "Azúcar actualizado",
        quantity: 200,
        cost: 30.0,
      };
      const updatedConsumable = { consumableId: 1, ...updateData };

      mockReq.params = { id: "1" };
      mockReq.body = updateData;

      // Mock the schemas
      consumableIdSchema.parse.mockReturnValue({ id: 1 });
      updateConsumableSchema.parse.mockReturnValue(updateData);
      mockService.update.mockResolvedValue(updatedConsumable);

      await consumableController.updateConsumable(mockReq, mockRes);

      expect(consumableIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(updateConsumableSchema.parse).toHaveBeenCalledWith(updateData);
      expect(mockService.update).toHaveBeenCalledWith({
        consumableId: 1,
        ...updateData,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Consumible actualizado correctamente",
        data: updatedConsumable,
      });
    });
  });

  describe("deleteConsumable", () => {
    it("debería estar definido", () => {
      expect(consumableController.deleteConsumable).toBeDefined();
      expect(typeof consumableController.deleteConsumable).toBe("function");
    });

    it("debería eliminar un consumible exitosamente", async () => {
      const deletedConsumable = { consumableId: 1, deleted: true };

      mockReq.params = { id: "1" };

      // Mock the schema
      consumableIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockResolvedValue(deletedConsumable);

      await consumableController.deleteConsumable(mockReq, mockRes);

      expect(consumableIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Consumible eliminado correctamente",
        data: deletedConsumable,
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

      expect(() =>
        consumableController.setService(nuevoServicio),
      ).not.toThrow();

      // Verificar que el servicio se estableció correctamente
      // ejecutando una función que lo use
      nuevoServicio.getAll.mockResolvedValue([]);
      await consumableController.getConsumables(mockReq, mockRes);

      expect(nuevoServicio.getAll).toHaveBeenCalled();
    });
  });

  describe("Pruebas con diferentes unidades de medida", () => {
    const unidadesDeMedida = [
      UnitMeasurement.GRAM,
      UnitMeasurement.KILOGRAM,
      UnitMeasurement.LITER,
      UnitMeasurement.MILLILITER,
      UnitMeasurement.OUNCE,
      UnitMeasurement.POUND,
      UnitMeasurement.UNIT,
      UnitMeasurement.TABLESPOON,
      UnitMeasurement.TEASPOON,
      UnitMeasurement.CUP,
      UnitMeasurement.PIECE,
    ];

    unidadesDeMedida.forEach((unidad) => {
      it(`debería guardar consumible con unidad de medida ${unidad}`, async () => {
        const datosConsumible = {
          supplierId: 1,
          name: `Ingrediente con ${unidad}`,
          cosumableTypeId: 1,
          quantity: 50,
          unitMeasurement: unidad,
          cost: 10.99,
        };

        const consumibleGuardado = { consumableId: 1, ...datosConsumible };

        mockReq.body = datosConsumible;
        ConsumableSchema.parse.mockReturnValue(datosConsumible);
        mockService.save.mockResolvedValue(consumibleGuardado);

        await consumableController.saveConsumable(mockReq, mockRes);

        expect(ConsumableSchema.parse).toHaveBeenCalledWith(datosConsumible);
        expect(mockService.save).toHaveBeenCalledWith(datosConsumible);
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.send).toHaveBeenCalledWith({
          status: "success",
          message: "Consumible guardado correctamente",
          data: consumibleGuardado,
        });
      });
    });
  });
});
