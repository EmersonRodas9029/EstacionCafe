import * as ingredientController from "../IngredientController";
import { IService } from "../../core/interfaces/IService";
import {
  IngredientSchema,
  updateIngredientSchema,
  ingredientIdSchema,
} from "../../application/validations/IngredientValidations";

jest.mock("../../application/validations/IngredientValidations", () => ({
  IngredientSchema: { parse: jest.fn() },
  updateIngredientSchema: { parse: jest.fn() },
  ingredientIdSchema: { parse: jest.fn() },
}));
const mockedIngredientSchema = IngredientSchema as jest.Mocked<
  typeof IngredientSchema
>;
const mockedUpdateIngredientSchema = updateIngredientSchema as jest.Mocked<
  typeof updateIngredientSchema
>;
const mockedIngredientIdSchema = ingredientIdSchema as jest.Mocked<
  typeof ingredientIdSchema
>;

describe("IngredientController", () => {
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

    // Añadir métodos específicos del IngredientService
    (mockService as any).getByProduct = jest.fn();

    // Establecer el servicio mock
    ingredientController.setService(mockService);

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

  describe("getIngredients", () => {
    it("debería retornar los ingredientes exitosamente", async () => {
      const ingredientesSimulados = [
        {
          ingredientId: 1,
          name: "Azúcar",
          quantity: 100,
          productId: 1,
          consumableId: 1,
        },
        {
          ingredientId: 2,
          name: "Café molido",
          quantity: 50,
          productId: 3,
          consumableId: 2,
        },
      ];

      mockService.getAll.mockResolvedValue(ingredientesSimulados);

      await ingredientController.getIngredients(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Ingredientes obtenidos correctamente",
        data: ingredientesSimulados,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Ingredientes obtenidos correctamente",
      );
    });

    it("debería manejar errores al obtener los ingredientes", async () => {
      const errorServidor = new Error("Error de conexión a la base de datos");

      mockService.getAll.mockRejectedValue(errorServidor);

      await ingredientController.getIngredients(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al conseguir los ingredientes:",
        errorServidor,
      );
      expect(console.log).not.toHaveBeenCalledWith(
        "Ingredientes obtenidos correctamente",
      );
    });

    it("debería retornar un array vacío cuando no hay ingredientes", async () => {
      const ingredientesVacios: any[] = [];

      mockService.getAll.mockResolvedValue(ingredientesVacios);

      await ingredientController.getIngredients(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Ingredientes obtenidos correctamente",
        data: [],
      });
      expect(console.log).toHaveBeenCalledWith(
        "Ingredientes obtenidos correctamente",
      );
    });
  });

  describe("getIngredientById", () => {
    it("debería obtener un ingrediente por ID exitosamente", async () => {
      const ingrediente = {
        ingredientId: 1,
        name: "Azúcar",
        quantity: 100,
        productId: 1,
        consumableId: 1,
      };

      mockReq.params = { id: "1" };
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockResolvedValue(ingrediente);

      await ingredientController.getIngredientById(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Ingrediente obtenido correctamente",
        data: ingrediente,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Ingrediente obtenido correctamente",
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
      mockedIngredientIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await ingredientController.getIngredientById(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({
        id: "invalid",
      });
      expect(mockService.getById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Ingrediente obtenido correctamente",
      );
    });

    it("debería manejar error cuando el ingrediente no existe", async () => {
      const errorNoEncontrado = new Error("Ingrediente no encontrado");

      mockReq.params = { id: "999" };
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.getById.mockRejectedValue(errorNoEncontrado);

      await ingredientController.getIngredientById(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({
        id: "999",
      });
      expect(mockService.getById).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: errorNoEncontrado.message,
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = { id: "1" };
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockRejectedValue(errorServidor);

      await ingredientController.getIngredientById(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener el ingrediente: ${errorServidor.message}`,
      });
    });
  });

  describe("saveIngredient", () => {
    it("debería guardar el ingrediente exitosamente", async () => {
      const datosIngrediente = {
        name: "Azúcar",
        quantity: "100",
        productId: "1",
        consumableId: "1",
      };

      const datosValidados = {
        name: "Azúcar",
        quantity: 100,
        productId: 1,
        consumableId: 1,
      };

      const ingredienteGuardado = {
        ingredientId: 1,
        ...datosValidados,
      };

      mockReq.body = datosIngrediente;
      mockedIngredientSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockResolvedValue(ingredienteGuardado);

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(
        datosIngrediente,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Ingrediente guardado correctamente",
        data: ingredienteGuardado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Ingrediente guardado correctamente",
      );
    });

    it("debería manejar errores de validación ZodError para nombre vacío", async () => {
      const datosInvalidos = {
        name: "",
        quantity: "100",
        productId: "1",
        consumableId: "1",
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
      mockedIngredientSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre es requerido",
        campo: ["name"],
        error: "too_small",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Ingrediente guardado correctamente",
      );
    });

    it("debería manejar errores de validación ZodError para nombre muy largo", async () => {
      const nombreMuyLargo = "a".repeat(256);
      const datosInvalidos = {
        name: nombreMuyLargo,
        quantity: "100",
        productId: "1",
        consumableId: "1",
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
      mockedIngredientSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre no puede exceder 255 caracteres",
        campo: ["name"],
        error: "too_big",
      });
    });

    it("debería manejar errores de validación ZodError para cantidad inválida", async () => {
      const datosInvalidos = {
        name: "Azúcar",
        quantity: "0",
        productId: "1",
        consumableId: "1",
      };

      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "La cantidad debe ser mayor a 0",
            path: ["quantity"],
            code: "custom",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedIngredientSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: La cantidad debe ser mayor a 0",
        campo: ["quantity"],
        error: "custom",
      });
    });

    it("debería manejar errores de validación ZodError para productId inválido", async () => {
      const datosInvalidos = {
        name: "Azúcar",
        quantity: "100",
        productId: "0",
        consumableId: "1",
      };

      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El ID del producto debe ser un número positivo",
            path: ["productId"],
            code: "custom",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedIngredientSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message:
          "Datos inválidos: El ID del producto debe ser un número positivo",
        campo: ["productId"],
        error: "custom",
      });
    });

    it("debería manejar errores de validación ZodError para consumableId inválido", async () => {
      const datosInvalidos = {
        name: "Azúcar",
        quantity: "100",
        productId: "1",
        consumableId: "0",
      };

      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El ID del consumible debe ser un número positivo",
            path: ["consumableId"],
            code: "custom",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedIngredientSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message:
          "Datos inválidos: El ID del consumible debe ser un número positivo",
        campo: ["consumableId"],
        error: "custom",
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const datosIngrediente = {
        name: "Azúcar",
        quantity: "100",
        productId: "1",
        consumableId: "1",
      };

      const datosValidados = {
        name: "Azúcar",
        quantity: 100,
        productId: 1,
        consumableId: 1,
      };

      const errorServidor = new Error("Error interno del servidor");

      mockReq.body = datosIngrediente;
      mockedIngredientSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockRejectedValue(errorServidor);

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(
        datosIngrediente,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al guardar el ingrediente:",
        errorServidor,
      );
      expect(console.log).not.toHaveBeenCalledWith(
        "Ingrediente guardado correctamente",
      );
    });

    it("debería manejar transformaciones de string a number correctamente", async () => {
      const datosIngrediente = {
        name: "Café molido",
        quantity: "50.5",
        productId: "3",
        consumableId: "2",
      };

      const datosValidados = {
        name: "Café molido",
        quantity: 50.5,
        productId: 3,
        consumableId: 2,
      };

      const ingredienteGuardado = {
        ingredientId: 2,
        ...datosValidados,
      };

      mockReq.body = datosIngrediente;
      mockedIngredientSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockResolvedValue(ingredienteGuardado);

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(
        datosIngrediente,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Ingrediente guardado correctamente",
        data: ingredienteGuardado,
      });
    });

    it("debería manejar nombres con espacios (trim)", async () => {
      const datosConEspacios = {
        name: "   Leche entera   ",
        quantity: "200",
        productId: "2",
        consumableId: "3",
      };

      const datosLimpios = {
        name: "Leche entera",
        quantity: 200,
        productId: 2,
        consumableId: 3,
      };

      const ingredienteGuardado = {
        ingredientId: 3,
        ...datosLimpios,
      };

      mockReq.body = datosConEspacios;
      mockedIngredientSchema.parse.mockReturnValue(datosLimpios);
      mockService.save.mockResolvedValue(ingredienteGuardado);

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(
        datosConEspacios,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosLimpios);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateIngredient", () => {
    it("debería actualizar un ingrediente exitosamente", async () => {
      const datosActualizacion = {
        name: "Azúcar refinada",
        quantity: "150",
        productId: "1",
        consumableId: "1",
      };

      const datosValidados = {
        name: "Azúcar refinada",
        quantity: 150,
        productId: 1,
        consumableId: 1,
      };

      const ingredienteActualizado = {
        ingredientId: 1,
        ...datosValidados,
      };

      mockReq.params = { id: "1" };
      mockReq.body = datosActualizacion;
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateIngredientSchema.parse.mockReturnValue(datosValidados);
      mockService.update.mockResolvedValue(ingredienteActualizado);

      await ingredientController.updateIngredient(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockedUpdateIngredientSchema.parse).toHaveBeenCalledWith(
        datosActualizacion,
      );
      expect(mockService.update).toHaveBeenCalledWith({
        ingredientId: 1,
        ...datosValidados,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Ingrediente actualizado correctamente",
        data: ingredienteActualizado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Ingrediente actualizado correctamente",
      );
    });

    it("debería actualizar solo algunos campos", async () => {
      const datosActualizacion = {
        name: "Nuevo nombre",
      };

      const ingredienteActualizado = {
        ingredientId: 1,
        name: "Nuevo nombre",
        quantity: 100,
        productId: 1,
        consumableId: 1,
      };

      mockReq.params = { id: "1" };
      mockReq.body = datosActualizacion;
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateIngredientSchema.parse.mockReturnValue(datosActualizacion);
      mockService.update.mockResolvedValue(ingredienteActualizado);

      await ingredientController.updateIngredient(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        ingredientId: 1,
        ...datosActualizacion,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
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
      mockReq.body = { name: "Test" };
      mockedIngredientIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await ingredientController.updateIngredient(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({
        id: "invalid",
      });
      expect(mockedUpdateIngredientSchema.parse).not.toHaveBeenCalled();
      expect(mockService.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El ID debe ser un número positivo",
        campo: ["id"],
      });
    });

    it("debería manejar errores de validación ZodError para datos de actualización inválidos", async () => {
      const datosInvalidos = {
        name: "",
        quantity: "0",
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

      mockReq.params = { id: "1" };
      mockReq.body = datosInvalidos;
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateIngredientSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await ingredientController.updateIngredient(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockedUpdateIngredientSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre es requerido",
        campo: ["name"],
      });
    });

    it("debería manejar error cuando el ingrediente no existe", async () => {
      const errorNoEncontrado = new Error("Ingrediente no encontrado");

      mockReq.params = { id: "999" };
      mockReq.body = { name: "Test" };
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 999 });
      mockedUpdateIngredientSchema.parse.mockReturnValue({ name: "Test" });
      mockService.update.mockRejectedValue(errorNoEncontrado);

      await ingredientController.updateIngredient(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        ingredientId: 999,
        name: "Test",
      });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: errorNoEncontrado.message,
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = { id: "1" };
      mockReq.body = { name: "Test" };
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateIngredientSchema.parse.mockReturnValue({ name: "Test" });
      mockService.update.mockRejectedValue(errorServidor);

      await ingredientController.updateIngredient(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        ingredientId: 1,
        name: "Test",
      });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al actualizar ingrediente:",
        errorServidor,
      );
    });
  });

  describe("deleteIngredient", () => {
    it("debería eliminar un ingrediente exitosamente", async () => {
      const ingredienteEliminado = {
        ingredientId: 1,
        name: "Azúcar",
        quantity: 100,
        productId: 1,
        consumableId: 1,
      };

      mockReq.params = { id: "1" };
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockResolvedValue(ingredienteEliminado);

      await ingredientController.deleteIngredient(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Ingrediente eliminado correctamente",
        data: ingredienteEliminado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Ingrediente eliminado correctamente",
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
      mockedIngredientIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await ingredientController.deleteIngredient(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({
        id: "invalid",
      });
      expect(mockService.delete).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Ingrediente eliminado correctamente",
      );
    });

    it("debería manejar error cuando el ingrediente no existe", async () => {
      const errorNoEncontrado = new Error("Ingrediente no encontrado");

      mockReq.params = { id: "999" };
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.delete.mockRejectedValue(errorNoEncontrado);

      await ingredientController.deleteIngredient(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({
        id: "999",
      });
      expect(mockService.delete).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: errorNoEncontrado.message,
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = { id: "1" };
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockRejectedValue(errorServidor);

      await ingredientController.deleteIngredient(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al eliminar ingrediente:",
        errorServidor,
      );
    });
  });

  describe("getIngredientsByProduct", () => {
    it("debería obtener ingredientes por producto exitosamente", async () => {
      const ingredientes = [
        {
          ingredientId: 1,
          name: "Azúcar",
          quantity: 100,
          productId: 1,
          consumableId: 1,
        },
        {
          ingredientId: 2,
          name: "Café molido",
          quantity: 50,
          productId: 1,
          consumableId: 2,
        },
      ];

      mockReq.params = { productId: "1" };
      (mockService as any).getByProduct.mockResolvedValue(ingredientes);

      await ingredientController.getIngredientsByProduct(mockReq, mockRes);

      expect((mockService as any).getByProduct).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Ingredientes del producto obtenidos correctamente",
        data: ingredientes,
      });
    });

    it("debería manejar errores del servidor al obtener ingredientes por producto", async () => {
      const errorServidor = new Error("Error de conexión a la base de datos");

      mockReq.params = { productId: "1" };
      (mockService as any).getByProduct.mockRejectedValue(errorServidor);

      await ingredientController.getIngredientsByProduct(mockReq, mockRes);

      expect((mockService as any).getByProduct).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener los ingredientes del producto: ${errorServidor.message}`,
      });
    });

    it("debería retornar array vacío cuando el producto no tiene ingredientes", async () => {
      const ingredientesVacios: any[] = [];

      mockReq.params = { productId: "999" };
      (mockService as any).getByProduct.mockResolvedValue(ingredientesVacios);

      await ingredientController.getIngredientsByProduct(mockReq, mockRes);

      expect((mockService as any).getByProduct).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Ingredientes del producto obtenidos correctamente",
        data: [],
      });
    });

    it("debería manejar números de producto como strings", async () => {
      const ingredientes = [
        {
          ingredientId: 1,
          name: "Leche",
          quantity: 200,
          productId: 42,
          consumableId: 3,
        },
      ];

      mockReq.params = { productId: "42" };
      (mockService as any).getByProduct.mockResolvedValue(ingredientes);

      await ingredientController.getIngredientsByProduct(mockReq, mockRes);

      expect((mockService as any).getByProduct).toHaveBeenCalledWith(42);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Ingredientes del producto obtenidos correctamente",
        data: ingredientes,
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

      // Añadir métodos específicos del IngredientService
      nuevoServicio.getByProduct = jest.fn();

      expect(() =>
        ingredientController.setService(nuevoServicio),
      ).not.toThrow();

      // Verificar que el servicio se estableció correctamente
      nuevoServicio.getAll.mockResolvedValue([]);
      await ingredientController.getIngredients(mockReq, mockRes);

      expect(nuevoServicio.getAll).toHaveBeenCalled();
    });
  });

  describe("Casos con nombres especiales", () => {
    const nombresEspeciales = [
      {
        name: "Café 100% Arábica",
        quantity: 10,
        productId: 1,
        consumableId: 1,
      },
      { name: "Azúcar refinada", quantity: 10, productId: 1, consumableId: 1 },
      {
        name: "Leche descremada 2%",
        quantity: 10,
        productId: 1,
        consumableId: 1,
      },
      { name: "Canela en polvo", quantity: 10, productId: 1, consumableId: 1 },
      {
        name: "Jarabe de vainilla",
        quantity: 10,
        productId: 1,
        consumableId: 1,
      },
      {
        name: "Chocolate semi-amargo",
        quantity: 10,
        productId: 1,
        consumableId: 1,
      },
    ];

    nombresEspeciales.forEach((ingrediente) => {
      it(`debería guardar ingrediente con nombre: "${ingrediente.name}"`, async () => {
        const ingredienteGuardado = {
          ingredientId: 1,
          ...ingrediente,
        };

        mockReq.body = ingrediente;
        mockedIngredientSchema.parse.mockReturnValue(ingrediente);
        mockService.save.mockResolvedValue(ingredienteGuardado);

        await ingredientController.saveIngredient(mockReq, mockRes);

        expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(ingrediente);
        expect(mockService.save).toHaveBeenCalledWith(ingrediente);
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.send).toHaveBeenCalledWith({
          status: "success",
          message: "Ingrediente guardado correctamente",
          data: ingredienteGuardado,
        });
      });
    });
  });

  describe("Casos límite de validación", () => {
    it("debería manejar nombre con exactamente 1 carácter", async () => {
      const datosMinimos = {
        name: "A",
        quantity: 1,
        productId: 1,
        consumableId: 1,
      };

      const ingredienteGuardado = {
        ingredientId: 1,
        ...datosMinimos,
      };

      mockReq.body = datosMinimos;
      mockedIngredientSchema.parse.mockReturnValue(datosMinimos);
      mockService.save.mockResolvedValue(ingredienteGuardado);

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(datosMinimos);
      expect(mockService.save).toHaveBeenCalledWith(datosMinimos);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar nombre con exactamente 255 caracteres", async () => {
      const nombreMaximo = "a".repeat(255);
      const datosMaximos = {
        name: nombreMaximo,
        quantity: 999.99,
        productId: 999,
        consumableId: 999,
      };

      const ingredienteGuardado = {
        ingredientId: 1,
        ...datosMaximos,
      };

      mockReq.body = datosMaximos;
      mockedIngredientSchema.parse.mockReturnValue(datosMaximos);
      mockService.save.mockResolvedValue(ingredienteGuardado);

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(datosMaximos);
      expect(mockService.save).toHaveBeenCalledWith(datosMaximos);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar cantidad con decimales precisos", async () => {
      const datosDecimales = {
        name: "Ingrediente Preciso",
        quantity: 123.456789,
        productId: 1,
        consumableId: 1,
      };

      const ingredienteGuardado = {
        ingredientId: 1,
        ...datosDecimales,
      };

      mockReq.body = datosDecimales;
      mockedIngredientSchema.parse.mockReturnValue(datosDecimales);
      mockService.save.mockResolvedValue(ingredienteGuardado);

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(datosDecimales);
      expect(mockService.save).toHaveBeenCalledWith(datosDecimales);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Transformaciones de tipos", () => {
    it("debería manejar IDs como strings que se convierten a números", async () => {
      const ingrediente = {
        ingredientId: 42,
        name: "Test Ingredient",
        quantity: 100,
        productId: 5,
        consumableId: 3,
      };

      mockReq.params = { id: "42" };
      mockedIngredientIdSchema.parse.mockReturnValue({ id: 42 });
      mockService.getById.mockResolvedValue(ingrediente);

      await ingredientController.getIngredientById(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({ id: "42" });
      expect(mockService.getById).toHaveBeenCalledWith(42);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("debería manejar IDs grandes correctamente", async () => {
      const idGrande = 999999;
      const ingrediente = {
        ingredientId: idGrande,
        name: "Test Ingredient",
        quantity: 100,
        productId: 1,
        consumableId: 1,
      };

      mockReq.params = { id: idGrande.toString() };
      mockedIngredientIdSchema.parse.mockReturnValue({ id: idGrande });
      mockService.getById.mockResolvedValue(ingrediente);

      await ingredientController.getIngredientById(mockReq, mockRes);

      expect(mockedIngredientIdSchema.parse).toHaveBeenCalledWith({
        id: idGrande.toString(),
      });
      expect(mockService.getById).toHaveBeenCalledWith(idGrande);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("debería manejar números y strings mezclados en entrada", async () => {
      const entradaMixta = {
        name: "Ingrediente Mixto",
        quantity: 50.75, // número
        productId: "7", // string
        consumableId: 4, // número
      };

      const datosValidados = {
        name: "Ingrediente Mixto",
        quantity: 50.75,
        productId: 7,
        consumableId: 4,
      };

      const ingredienteGuardado = {
        ingredientId: 1,
        ...datosValidados,
      };

      mockReq.body = entradaMixta;
      mockedIngredientSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockResolvedValue(ingredienteGuardado);

      await ingredientController.saveIngredient(mockReq, mockRes);

      expect(mockedIngredientSchema.parse).toHaveBeenCalledWith(entradaMixta);
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
