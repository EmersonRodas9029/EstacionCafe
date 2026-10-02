import * as userTypeController from "../UserTypeController";
import { IService } from "../../core/interfaces/IService";
import {
  createUserTypeSchema,
  updateUserTypeSchema,
  userTypeIdSchema,
} from "../../application/validations/UserTypeValidations";

jest.mock("../../application/validations/UserTypeValidations", () => ({
  createUserTypeSchema: { parse: jest.fn() },
  updateUserTypeSchema: { parse: jest.fn() },
  userTypeIdSchema: { parse: jest.fn() },
}));
const mockedCreateUserTypeSchema = createUserTypeSchema as jest.Mocked<
  typeof createUserTypeSchema
>;
const mockedUpdateUserTypeSchema = updateUserTypeSchema as jest.Mocked<
  typeof updateUserTypeSchema
>;
const mockedUserTypeIdSchema = userTypeIdSchema as jest.Mocked<
  typeof userTypeIdSchema
>;

describe("UserTypeController", () => {
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
    userTypeController.setService(mockService);

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

  describe("getUserTypes", () => {
    it("debería obtener todos los tipos de usuario exitosamente", async () => {
      const tiposUsuarioSimulados = [
        {
          userTypeId: 1,
          name: "Administrador",
          permissionLevel: 10,
        },
        {
          userTypeId: 2,
          name: "Cajero",
          permissionLevel: 5,
        },
      ];

      mockService.getAll.mockResolvedValue(tiposUsuarioSimulados);

      await userTypeController.getUserTypes(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipos de usuario obtenidos correctamente",
        data: tiposUsuarioSimulados,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Tipos de usuario obtenidos correctamente",
      );
    });

    it("debería manejar errores del servidor al obtener tipos de usuario", async () => {
      const errorServidor = new Error("Error de conexión a la base de datos");

      mockService.getAll.mockRejectedValue(errorServidor);

      await userTypeController.getUserTypes(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener los tipos de usuario: ${errorServidor.message}`,
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Tipos de usuario obtenidos correctamente",
      );
    });

    it("debería retornar un array vacío cuando no hay tipos de usuario", async () => {
      const tiposVacios: any[] = [];

      mockService.getAll.mockResolvedValue(tiposVacios);

      await userTypeController.getUserTypes(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipos de usuario obtenidos correctamente",
        data: tiposVacios,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Tipos de usuario obtenidos correctamente",
      );
    });
  });

  describe("getUserTypeById", () => {
    it("debería obtener un tipo de usuario por ID exitosamente", async () => {
      const tipoUsuario = {
        userTypeId: 1,
        name: "Administrador",
        permissionLevel: 10,
      };

      mockReq.params = { id: "1" };
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockResolvedValue(tipoUsuario);

      await userTypeController.getUserTypeById(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipo de usuario obtenido correctamente",
        data: tipoUsuario,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Tipo de usuario obtenido correctamente",
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
      mockedUserTypeIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userTypeController.getUserTypeById(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({
        id: "invalid",
      });
      expect(mockService.getById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Tipo de usuario obtenido correctamente",
      );
    });

    it("debería manejar error cuando el tipo de usuario no existe", async () => {
      const errorNoEncontrado = new Error("Tipo de usuario no encontrado");

      mockReq.params = { id: "999" };
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.getById.mockRejectedValue(errorNoEncontrado);

      await userTypeController.getUserTypeById(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({ id: "999" });
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
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockRejectedValue(errorServidor);

      await userTypeController.getUserTypeById(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener el tipo de usuario: ${errorServidor.message}`,
      });
    });
  });

  describe("saveUserType", () => {
    it("debería guardar un tipo de usuario exitosamente", async () => {
      const datosTipoUsuario = {
        name: "Administrador",
        permissionLevel: 10,
      };

      const tipoUsuarioGuardado = {
        userTypeId: 1,
        ...datosTipoUsuario,
      };

      mockReq.body = datosTipoUsuario;
      mockedCreateUserTypeSchema.parse.mockReturnValue(datosTipoUsuario as any);
      mockService.save.mockResolvedValue(tipoUsuarioGuardado);

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosTipoUsuario,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosTipoUsuario);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipo de usuario creado correctamente",
        data: tipoUsuarioGuardado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Tipo de usuario creado correctamente",
      );
    });

    it("debería manejar errores de validación ZodError para nombre vacío", async () => {
      const datosInvalidos = {
        name: "",
        permissionLevel: 5,
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
      mockedCreateUserTypeSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre es requerido",
        campo: ["name"],
        error: "too_small",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Tipo de usuario creado correctamente",
      );
    });

    it("debería manejar errores de validación ZodError para nombre muy largo", async () => {
      const nombreMuyLargo = "a".repeat(51);
      const datosInvalidos = {
        name: nombreMuyLargo,
        permissionLevel: 5,
      };

      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El nombre es muy largo",
            path: ["name"],
            code: "too_big",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreateUserTypeSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre es muy largo",
        campo: ["name"],
        error: "too_big",
      });
    });

    it("debería manejar errores de validación ZodError para nivel de permisos inválido", async () => {
      const datosInvalidos = {
        name: "Admin",
        permissionLevel: 11,
      };

      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El nivel de permisos no puede ser mayor a 10",
            path: ["permissionLevel"],
            code: "too_big",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreateUserTypeSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message:
          "Datos inválidos: El nivel de permisos no puede ser mayor a 10",
        campo: ["permissionLevel"],
        error: "too_big",
      });
    });

    it("debería manejar errores de validación ZodError para nivel de permisos negativo", async () => {
      const datosInvalidos = {
        name: "Admin",
        permissionLevel: -1,
      };

      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El nivel de permisos no puede ser negativo",
            path: ["permissionLevel"],
            code: "too_small",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreateUserTypeSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nivel de permisos no puede ser negativo",
        campo: ["permissionLevel"],
        error: "too_small",
      });
    });

    it("debería manejar errores de validación ZodError para nivel de permisos no entero", async () => {
      const datosInvalidos = {
        name: "Admin",
        permissionLevel: 5.5,
      };

      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El nivel de permisos debe ser un número entero",
            path: ["permissionLevel"],
            code: "invalid_type",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreateUserTypeSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message:
          "Datos inválidos: El nivel de permisos debe ser un número entero",
        campo: ["permissionLevel"],
        error: "invalid_type",
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const datosTipoUsuario = {
        name: "Administrador",
        permissionLevel: 10,
      };

      const errorServidor = new Error("Error interno del servidor");

      mockReq.body = datosTipoUsuario;
      mockedCreateUserTypeSchema.parse.mockReturnValue(datosTipoUsuario as any);
      mockService.save.mockRejectedValue(errorServidor);

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosTipoUsuario,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosTipoUsuario);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al crear tipo de usuario:",
        errorServidor,
      );
      expect(console.log).not.toHaveBeenCalledWith(
        "Tipo de usuario creado correctamente",
      );
    });

    it("debería manejar nombres con espacios (trim)", async () => {
      const datosConEspacios = {
        name: "   Supervisor   ",
        permissionLevel: 7,
      };

      const datosLimpios = {
        name: "Supervisor",
        permissionLevel: 7,
      };

      const tipoUsuarioGuardado = {
        userTypeId: 1,
        ...datosLimpios,
      };

      mockReq.body = datosConEspacios;
      mockedCreateUserTypeSchema.parse.mockReturnValue(datosLimpios as any);
      mockService.save.mockResolvedValue(tipoUsuarioGuardado);

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosConEspacios,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosLimpios);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateUserType", () => {
    it("debería actualizar un tipo de usuario exitosamente", async () => {
      const datosActualizacion = {
        name: "Administrador Actualizado",
        permissionLevel: 9,
      };

      const tipoUsuarioActualizado = {
        userTypeId: 1,
        ...datosActualizacion,
      };

      mockReq.params = { id: "1" };
      mockReq.body = datosActualizacion;
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateUserTypeSchema.parse.mockReturnValue(datosActualizacion);
      mockService.update.mockResolvedValue(tipoUsuarioActualizado);

      await userTypeController.updateUserType(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockedUpdateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosActualizacion,
      );
      expect(mockService.update).toHaveBeenCalledWith({
        userTypeId: 1,
        ...datosActualizacion,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipo de usuario actualizado correctamente",
        data: tipoUsuarioActualizado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Tipo de usuario actualizado correctamente",
      );
    });

    it("debería actualizar solo el nombre", async () => {
      const datosActualizacion = {
        name: "Nuevo Nombre",
      };

      const tipoUsuarioActualizado = {
        userTypeId: 1,
        name: "Nuevo Nombre",
        permissionLevel: 5,
      };

      mockReq.params = { id: "1" };
      mockReq.body = datosActualizacion;
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateUserTypeSchema.parse.mockReturnValue(datosActualizacion);
      mockService.update.mockResolvedValue(tipoUsuarioActualizado);

      await userTypeController.updateUserType(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        userTypeId: 1,
        ...datosActualizacion,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("debería actualizar solo el nivel de permisos", async () => {
      const datosActualizacion = {
        permissionLevel: 8,
      };

      const tipoUsuarioActualizado = {
        userTypeId: 1,
        name: "Administrador",
        permissionLevel: 8,
      };

      mockReq.params = { id: "1" };
      mockReq.body = datosActualizacion;
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateUserTypeSchema.parse.mockReturnValue(datosActualizacion);
      mockService.update.mockResolvedValue(tipoUsuarioActualizado);

      await userTypeController.updateUserType(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        userTypeId: 1,
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
      mockedUserTypeIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userTypeController.updateUserType(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({
        id: "invalid",
      });
      expect(mockedUpdateUserTypeSchema.parse).not.toHaveBeenCalled();
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
        permissionLevel: 11,
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
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateUserTypeSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userTypeController.updateUserType(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockedUpdateUserTypeSchema.parse).toHaveBeenCalledWith(
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

    it("debería manejar error cuando el tipo de usuario no existe", async () => {
      const errorNoEncontrado = new Error("Tipo de usuario no encontrado");

      mockReq.params = { id: "999" };
      mockReq.body = { name: "Test" };
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 999 });
      mockedUpdateUserTypeSchema.parse.mockReturnValue({ name: "Test" });
      mockService.update.mockRejectedValue(errorNoEncontrado);

      await userTypeController.updateUserType(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        userTypeId: 999,
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
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateUserTypeSchema.parse.mockReturnValue({ name: "Test" });
      mockService.update.mockRejectedValue(errorServidor);

      await userTypeController.updateUserType(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        userTypeId: 1,
        name: "Test",
      });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al actualizar tipo de usuario:",
        errorServidor,
      );
    });
  });

  describe("deleteUserType", () => {
    it("debería eliminar un tipo de usuario exitosamente", async () => {
      const tipoUsuarioEliminado = {
        userTypeId: 1,
        name: "Administrador",
        permissionLevel: 10,
      };

      mockReq.params = { id: "1" };
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockResolvedValue(tipoUsuarioEliminado);

      await userTypeController.deleteUserType(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Tipo de usuario eliminado correctamente",
        data: tipoUsuarioEliminado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Tipo de usuario eliminado correctamente",
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
      mockedUserTypeIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userTypeController.deleteUserType(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({
        id: "invalid",
      });
      expect(mockService.delete).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Tipo de usuario eliminado correctamente",
      );
    });

    it("debería manejar error cuando el tipo de usuario no existe", async () => {
      const errorNoEncontrado = new Error("Tipo de usuario no encontrado");

      mockReq.params = { id: "999" };
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.delete.mockRejectedValue(errorNoEncontrado);

      await userTypeController.deleteUserType(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({ id: "999" });
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
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockRejectedValue(errorServidor);

      await userTypeController.deleteUserType(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al eliminar tipo de usuario:",
        errorServidor,
      );
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

      expect(() => userTypeController.setService(nuevoServicio)).not.toThrow();

      // Verificar que el servicio se estableció correctamente
      // ejecutando una función que lo use
      nuevoServicio.getAll.mockResolvedValue([]);
      await userTypeController.getUserTypes(mockReq, mockRes);

      expect(nuevoServicio.getAll).toHaveBeenCalled();
    });
  });

  describe("Casos con diferentes tipos de usuario", () => {
    const tiposDeUsuario = [
      { name: "Administrador", permissionLevel: 10 },
      { name: "Gerente", permissionLevel: 8 },
      { name: "Supervisor", permissionLevel: 6 },
      { name: "Cajero", permissionLevel: 4 },
      { name: "Barista", permissionLevel: 2 },
      { name: "Invitado", permissionLevel: 0 },
    ];

    tiposDeUsuario.forEach((tipoUsuario) => {
      it(`debería guardar tipo de usuario: "${tipoUsuario.name}"`, async () => {
        const tipoUsuarioGuardado = {
          userTypeId: 1,
          ...tipoUsuario,
        };

        mockReq.body = tipoUsuario;
        mockedCreateUserTypeSchema.parse.mockReturnValue(tipoUsuario as any);
        mockService.save.mockResolvedValue(tipoUsuarioGuardado);

        await userTypeController.saveUserType(mockReq, mockRes);

        expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
          tipoUsuario,
        );
        expect(mockService.save).toHaveBeenCalledWith(tipoUsuario);
        expect(mockRes.status).toHaveBeenCalledWith(201);
      });
    });
  });

  describe("Casos límite de validación", () => {
    it("debería manejar nombre con exactamente 1 carácter", async () => {
      const datosMinimos = {
        name: "A",
        permissionLevel: 0,
      };

      const tipoUsuarioGuardado = {
        userTypeId: 1,
        ...datosMinimos,
      };

      mockReq.body = datosMinimos;
      mockedCreateUserTypeSchema.parse.mockReturnValue(datosMinimos as any);
      mockService.save.mockResolvedValue(tipoUsuarioGuardado);

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosMinimos,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosMinimos);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar nombre con exactamente 50 caracteres", async () => {
      const nombreMaximo = "a".repeat(50);
      const datosMaximos = {
        name: nombreMaximo,
        permissionLevel: 10,
      };

      const tipoUsuarioGuardado = {
        userTypeId: 1,
        ...datosMaximos,
      };

      mockReq.body = datosMaximos;
      mockedCreateUserTypeSchema.parse.mockReturnValue(datosMaximos as any);
      mockService.save.mockResolvedValue(tipoUsuarioGuardado);

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosMaximos,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosMaximos);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar nivel de permisos en el límite inferior (0)", async () => {
      const datosLimiteInferior = {
        name: "Usuario Limitado",
        permissionLevel: 0,
      };

      const tipoUsuarioGuardado = {
        userTypeId: 1,
        ...datosLimiteInferior,
      };

      mockReq.body = datosLimiteInferior;
      mockedCreateUserTypeSchema.parse.mockReturnValue(datosLimiteInferior as any);
      mockService.save.mockResolvedValue(tipoUsuarioGuardado);

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosLimiteInferior,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosLimiteInferior);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar nivel de permisos en el límite superior (10)", async () => {
      const datosLimiteSuperior = {
        name: "Super Administrador",
        permissionLevel: 10,
      };

      const tipoUsuarioGuardado = {
        userTypeId: 1,
        ...datosLimiteSuperior,
      };

      mockReq.body = datosLimiteSuperior;
      mockedCreateUserTypeSchema.parse.mockReturnValue(datosLimiteSuperior as any);
      mockService.save.mockResolvedValue(tipoUsuarioGuardado);

      await userTypeController.saveUserType(mockReq, mockRes);

      expect(mockedCreateUserTypeSchema.parse).toHaveBeenCalledWith(
        datosLimiteSuperior,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosLimiteSuperior);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Transformaciones de ID", () => {
    it("debería manejar IDs como strings que se convierten a números", async () => {
      const tipoUsuario = {
        userTypeId: 42,
        name: "Test User Type",
        permissionLevel: 5,
      };

      mockReq.params = { id: "42" };
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: 42 });
      mockService.getById.mockResolvedValue(tipoUsuario);

      await userTypeController.getUserTypeById(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({ id: "42" });
      expect(mockService.getById).toHaveBeenCalledWith(42);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("debería manejar IDs grandes correctamente", async () => {
      const idGrande = 999999;
      const tipoUsuario = {
        userTypeId: idGrande,
        name: "Test User Type",
        permissionLevel: 5,
      };

      mockReq.params = { id: idGrande.toString() };
      mockedUserTypeIdSchema.parse.mockReturnValue({ id: idGrande });
      mockService.getById.mockResolvedValue(tipoUsuario);

      await userTypeController.getUserTypeById(mockReq, mockRes);

      expect(mockedUserTypeIdSchema.parse).toHaveBeenCalledWith({
        id: idGrande.toString(),
      });
      expect(mockService.getById).toHaveBeenCalledWith(idGrande);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
