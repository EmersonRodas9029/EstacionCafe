import * as consumableTypeController from "../ConsumableTypeController";
import { IService } from "../../core/interfaces/IService";

jest.mock("../../application/validations/ConsumableTypeValidations", () => ({
  ConsumableTypeSchema: {
    parse: jest.fn(),
  },
  consumableTypeIdSchema: {
    parse: jest.fn(),
  },
  updateConsumableTypeSchema: {
    parse: jest.fn(),
  },
}));

const {
  ConsumableTypeSchema,
  consumableTypeIdSchema,
  updateConsumableTypeSchema,
} = require("../../application/validations/ConsumableTypeValidations");

describe("ConsumableTypeController", () => {
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
    consumableTypeController.setService(mockService);

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

  describe("saveConsumableType", () => {
    it("debería guardar el tipo de consumible exitosamente", async () => {
      const datosTipoConsumible = {
        name: "Ingredientes secos",
      };

      const tipoConsumibleGuardado = {
        consumableTypeId: 1,
        ...datosTipoConsumible,
      };

      mockReq.body = datosTipoConsumible;
      ConsumableTypeSchema.parse.mockReturnValue(datosTipoConsumible);
      mockService.save.mockResolvedValue(tipoConsumibleGuardado);

      await consumableTypeController.saveConsumableType(mockReq, mockRes);

      expect(ConsumableTypeSchema.parse).toHaveBeenCalledWith(
        datosTipoConsumible,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosTipoConsumible);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipo de consumible guardado correctamente",
        data: tipoConsumibleGuardado,
      });
    });

    it("debería manejar errores de validación ZodError para nombre vacío", async () => {
      const datosInvalidos = {
        name: "",
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
      ConsumableTypeSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await consumableTypeController.saveConsumableType(mockReq, mockRes);

      expect(ConsumableTypeSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre es requerido",
        campo: ["name"],
        error: "too_small",
      });
    });

    it("debería manejar errores de validación ZodError para nombre muy largo", async () => {
      const datosInvalidos = {
        name: "a".repeat(256), // 256 caracteres, excede el límite de 255
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El nombre no puede exceder 255 caracteres",
            path: ["name"],
            code: "too_big",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      ConsumableTypeSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await consumableTypeController.saveConsumableType(mockReq, mockRes);

      expect(ConsumableTypeSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre no puede exceder 255 caracteres",
        campo: ["name"],
        error: "too_big",
      });
    });

    it("debería manejar nombres con espacios al inicio y final (trim)", async () => {
      const datosConEspacios = {
        name: "   Ingredientes líquidos   ",
      };
      const datosLimpios = {
        name: "Ingredientes líquidos",
      };
      const tipoGuardado = { consumableTypeId: 1, ...datosLimpios };

      mockReq.body = datosConEspacios;
      ConsumableTypeSchema.parse.mockReturnValue(datosLimpios);
      mockService.save.mockResolvedValue(tipoGuardado);

      await consumableTypeController.saveConsumableType(mockReq, mockRes);

      expect(ConsumableTypeSchema.parse).toHaveBeenCalledWith(datosConEspacios);
      expect(mockService.save).toHaveBeenCalledWith(datosLimpios);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipo de consumible guardado correctamente",
        data: tipoGuardado,
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const datosTipoConsumible = {
        name: "Ingredientes secos",
      };
      const errorServidor = new Error("Error interno del servidor");

      mockReq.body = datosTipoConsumible;
      ConsumableTypeSchema.parse.mockReturnValue(datosTipoConsumible);
      mockService.save.mockRejectedValue(errorServidor);

      await consumableTypeController.saveConsumableType(mockReq, mockRes);

      expect(ConsumableTypeSchema.parse).toHaveBeenCalledWith(
        datosTipoConsumible,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosTipoConsumible);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Error interno del servidor",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al guardar el tipo de consumible:",
        errorServidor,
      );
    });

    it("debería manejar errores sin mensaje específico", async () => {
      const datosTipoConsumible = {
        name: "Ingredientes secos",
      };
      const errorSinMensaje = {};

      mockReq.body = datosTipoConsumible;
      ConsumableTypeSchema.parse.mockReturnValue(datosTipoConsumible);
      mockService.save.mockRejectedValue(errorSinMensaje);

      await consumableTypeController.saveConsumableType(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: undefined",
      });
    });
  });

  describe("getConsumableTypes", () => {
    it("debería retornar los tipos de consumibles exitosamente", async () => {
      const tiposConsumiblesSimulados = [
        {
          consumableTypeId: 1,
          name: "Ingredientes secos",
        },
        {
          consumableTypeId: 2,
          name: "Ingredientes líquidos",
        },
        {
          consumableTypeId: 3,
          name: "Especias y condimentos",
        },
      ];

      mockService.getAll.mockResolvedValue(tiposConsumiblesSimulados);

      await consumableTypeController.getConsumableTypes(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipos de consumibles obtenidos correctamente",
        data: tiposConsumiblesSimulados,
      });
    });

    it("debería manejar errores al obtener los tipos de consumibles", async () => {
      const mensajeError = "Error de conexión a la base de datos";
      mockService.getAll.mockRejectedValue(new Error(mensajeError));

      await consumableTypeController.getConsumableTypes(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${mensajeError}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al obtener los tipos de consumibles:",
        new Error(mensajeError),
      );
    });

    it("debería manejar errores sin mensaje específico", async () => {
      const errorSinMensaje = {};
      mockService.getAll.mockRejectedValue(errorSinMensaje);

      await consumableTypeController.getConsumableTypes(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: undefined",
      });
    });

    it("debería retornar un array vacío cuando no hay tipos de consumibles", async () => {
      const tiposVacios: any[] = [];

      mockService.getAll.mockResolvedValue(tiposVacios);

      await consumableTypeController.getConsumableTypes(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipos de consumibles obtenidos correctamente",
        data: tiposVacios,
      });
    });
  });

  describe("updateConsumableType", () => {
    it("debería estar definido", () => {
      expect(consumableTypeController.updateConsumableType).toBeDefined();
      expect(typeof consumableTypeController.updateConsumableType).toBe(
        "function",
      );
    });

    it("debería actualizar un tipo de consumible exitosamente", async () => {
      const updateData = {
        name: "Ingredientes líquidos actualizados",
      };
      const updatedConsumableType = { consumableTypeId: 1, ...updateData };

      mockReq.params = { id: "1" };
      mockReq.body = updateData;

      // Mock the schemas
      consumableTypeIdSchema.parse.mockReturnValue({ id: 1 });
      updateConsumableTypeSchema.parse.mockReturnValue(updateData);
      mockService.update.mockResolvedValue(updatedConsumableType);

      await consumableTypeController.updateConsumableType(mockReq, mockRes);

      expect(consumableTypeIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(updateConsumableTypeSchema.parse).toHaveBeenCalledWith(updateData);
      expect(mockService.update).toHaveBeenCalledWith({
        consumableTypeId: 1,
        ...updateData,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipo de consumible actualizado correctamente",
        data: updatedConsumableType,
      });
    });
  });

  describe("deleteConsumableType", () => {
    it("debería estar definido", () => {
      expect(consumableTypeController.deleteConsumableType).toBeDefined();
      expect(typeof consumableTypeController.deleteConsumableType).toBe(
        "function",
      );
    });

    it("debería eliminar un tipo de consumible exitosamente", async () => {
      const deletedConsumableType = { consumableTypeId: 1, deleted: true };

      mockReq.params = { id: "1" };

      // Mock the schema
      consumableTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockResolvedValue(deletedConsumableType);

      await consumableTypeController.deleteConsumableType(mockReq, mockRes);

      expect(consumableTypeIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipo de consumible eliminado correctamente",
        data: deletedConsumableType,
      });
    });
  });

  describe("getConsumableTypeById", () => {
    it("debería obtener un tipo de consumible por ID exitosamente", async () => {
      const tipoConsumible = {
        consumableTypeId: 1,
        name: "Ingredientes secos",
      };

      mockReq.params = { id: "1" };

      // Mock the schema
      consumableTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockResolvedValue(tipoConsumible);

      await consumableTypeController.getConsumableTypeById(mockReq, mockRes);

      expect(consumableTypeIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipo de consumible obtenido correctamente",
        data: tipoConsumible,
      });
    });

    it("debería manejar errores de validación para ID inválido", async () => {
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

      consumableTypeIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await consumableTypeController.getConsumableTypeById(mockReq, mockRes);

      expect(consumableTypeIdSchema.parse).toHaveBeenCalledWith({
        id: "invalid",
      });
      expect(mockService.getById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
    });

    it("debería manejar errores cuando el tipo de consumible no es encontrado", async () => {
      const errorNotFound = new Error("Tipo de consumible no encontrado");

      mockReq.params = { id: "999" };

      consumableTypeIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.getById.mockRejectedValue(errorNotFound);

      await consumableTypeController.getConsumableTypeById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Tipo de consumible no encontrado",
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
        consumableTypeController.setService(nuevoServicio),
      ).not.toThrow();

      // Verificar que el servicio se estableció correctamente
      // ejecutando una función que lo use
      nuevoServicio.getAll.mockResolvedValue([]);
      await consumableTypeController.getConsumableTypes(mockReq, mockRes);

      expect(nuevoServicio.getAll).toHaveBeenCalled();
    });
  });

  describe("Casos con diferentes tipos de nombres", () => {
    const tiposDeNombres = [
      "Ingredientes secos",
      "Ingredientes líquidos",
      "Especias y condimentos",
      "Productos lácteos",
      "Endulzantes artificiales",
      "Conservantes naturales",
      "Aditivos alimentarios",
      "Materiales de empaque",
      "Insumos de limpieza",
      "Utensilios desechables",
    ];

    tiposDeNombres.forEach((nombreTipo) => {
      it(`debería guardar tipo de consumible con nombre: "${nombreTipo}"`, async () => {
        const datosTipoConsumible = {
          name: nombreTipo,
        };

        const tipoConsumibleGuardado = {
          consumableTypeId: 1,
          ...datosTipoConsumible,
        };

        mockReq.body = datosTipoConsumible;
        ConsumableTypeSchema.parse.mockReturnValue(datosTipoConsumible);
        mockService.save.mockResolvedValue(tipoConsumibleGuardado);

        await consumableTypeController.saveConsumableType(mockReq, mockRes);

        expect(ConsumableTypeSchema.parse).toHaveBeenCalledWith(
          datosTipoConsumible,
        );
        expect(mockService.save).toHaveBeenCalledWith(datosTipoConsumible);
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.send).toHaveBeenCalledWith({
          status: "success",
          message: "Tipo de consumible guardado correctamente",
          data: tipoConsumibleGuardado,
        });
      });
    });
  });

  describe("Casos límite de validación", () => {
    it("debería manejar nombre con exactamente 1 carácter", async () => {
      const datosMinimos = {
        name: "A",
      };

      const tipoGuardado = { consumableTypeId: 1, ...datosMinimos };

      mockReq.body = datosMinimos;
      ConsumableTypeSchema.parse.mockReturnValue(datosMinimos);
      mockService.save.mockResolvedValue(tipoGuardado);

      await consumableTypeController.saveConsumableType(mockReq, mockRes);

      expect(ConsumableTypeSchema.parse).toHaveBeenCalledWith(datosMinimos);
      expect(mockService.save).toHaveBeenCalledWith(datosMinimos);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar nombre con exactamente 255 caracteres", async () => {
      const datosMaximos = {
        name: "a".repeat(255), // Exactamente 255 caracteres
      };

      const tipoGuardado = { consumableTypeId: 1, ...datosMaximos };

      mockReq.body = datosMaximos;
      ConsumableTypeSchema.parse.mockReturnValue(datosMaximos);
      mockService.save.mockResolvedValue(tipoGuardado);

      await consumableTypeController.saveConsumableType(mockReq, mockRes);

      expect(ConsumableTypeSchema.parse).toHaveBeenCalledWith(datosMaximos);
      expect(mockService.save).toHaveBeenCalledWith(datosMaximos);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar nombres con caracteres especiales y acentos", async () => {
      const datosEspeciales = {
        name: "Condimentos & Especias Ñoñas (100% Naturales)",
      };

      const tipoGuardado = { consumableTypeId: 1, ...datosEspeciales };

      mockReq.body = datosEspeciales;
      ConsumableTypeSchema.parse.mockReturnValue(datosEspeciales);
      mockService.save.mockResolvedValue(tipoGuardado);

      await consumableTypeController.saveConsumableType(mockReq, mockRes);

      expect(ConsumableTypeSchema.parse).toHaveBeenCalledWith(datosEspeciales);
      expect(mockService.save).toHaveBeenCalledWith(datosEspeciales);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar nombres con números", async () => {
      const datosConNumeros = {
        name: "Tipo 123 - Categoría ABC",
      };

      const tipoGuardado = { consumableTypeId: 1, ...datosConNumeros };

      mockReq.body = datosConNumeros;
      ConsumableTypeSchema.parse.mockReturnValue(datosConNumeros);
      mockService.save.mockResolvedValue(tipoGuardado);

      await consumableTypeController.saveConsumableType(mockReq, mockRes);

      expect(ConsumableTypeSchema.parse).toHaveBeenCalledWith(datosConNumeros);
      expect(mockService.save).toHaveBeenCalledWith(datosConNumeros);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
