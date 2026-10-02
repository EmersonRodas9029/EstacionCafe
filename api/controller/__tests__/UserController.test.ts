import * as userController from "../UserController";
import { IService } from "../../core/interfaces/IService";
import { ITokenService } from "../../core/interfaces/ITokenService";
import { AppError } from "../../application/errors/AppError";
import { TOKEN_TTL_MS } from "../../infrastructure/security/TokenService";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from "../../application/validations/UserValidations";

jest.mock("../../application/validations/UserValidations", () => ({
  createUserSchema: { parse: jest.fn() },
  updateUserSchema: { parse: jest.fn() },
  userIdSchema: { parse: jest.fn() },
  loginSchema: jest.requireActual(
    "../../application/validations/UserValidations",
  ).loginSchema,
}));
const mockedCreateUserSchema = createUserSchema as jest.Mocked<
  typeof createUserSchema
>;
const mockedUpdateUserSchema = updateUserSchema as jest.Mocked<
  typeof updateUserSchema
>;
const mockedUserIdSchema = userIdSchema as jest.Mocked<typeof userIdSchema>;

describe("UserController", () => {
  let mockService: jest.Mocked<IService>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    // Crear el mock del servicio de usuarios
    mockService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      save: jest.fn(),
      saveAll: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    } as any;

    // Añadir métodos específicos del UserService
    (mockService as any).getUsersByType = jest.fn();

    // Crear el mock del servicio de token
    mockTokenService = {
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
    } as any;

    // Establecer los servicios mock
    userController.setServices(mockService, mockTokenService);

    mockReq = {
      body: {},
      params: {},
      cookies: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };

    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUsers", () => {
    it("debería obtener todos los usuarios exitosamente", async () => {
      const usuariosSimulados = [
        {
          userId: 1,
          email: "usuario1@example.com",
          name: "Usuario 1",
          userTypeId: 1,
        },
        {
          userId: 2,
          email: "usuario2@example.com",
          name: "Usuario 2",
          userTypeId: 2,
        },
      ];

      mockService.getAll.mockResolvedValue(usuariosSimulados);

      await userController.getUsers(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Usuarios obtenidos correctamente",
        data: usuariosSimulados,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Usuarios obtenidos correctamente",
      );
    });

    it("debería manejar errores al obtener usuarios", async () => {
      const mensajeError = "Error de conexión a la base de datos";
      mockService.getAll.mockRejectedValue(new Error(mensajeError));

      await userController.getUsers(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener los usuarios: ${mensajeError}`,
      });
    });

    it("debería retornar un array vacío cuando no hay usuarios", async () => {
      const usuariosVacios: any[] = [];

      mockService.getAll.mockResolvedValue(usuariosVacios);

      await userController.getUsers(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Usuarios obtenidos correctamente",
        data: usuariosVacios,
      });
    });
  });

  describe("getUserById", () => {
    it("debería obtener un usuario por ID exitosamente", async () => {
      const usuario = {
        userId: 1,
        email: "usuario@example.com",
        name: "Juan Pérez",
        userTypeId: 1,
      };

      mockReq.params = { id: "1" };
      mockedUserIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockResolvedValue(usuario);

      await userController.getUserById(mockReq, mockRes);

      expect(mockedUserIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Usuario obtenido correctamente",
        data: usuario,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Usuario obtenido correctamente",
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
      mockedUserIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userController.getUserById(mockReq, mockRes);

      expect(mockedUserIdSchema.parse).toHaveBeenCalledWith({ id: "invalid" });
      expect(mockService.getById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
    });

    it("debería manejar error cuando el usuario no existe", async () => {
      const errorNoEncontrado = new Error("Usuario no encontrado");

      mockReq.params = { id: "999" };
      mockedUserIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.getById.mockRejectedValue(errorNoEncontrado);

      await userController.getUserById(mockReq, mockRes);

      expect(mockedUserIdSchema.parse).toHaveBeenCalledWith({ id: "999" });
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
      mockedUserIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockRejectedValue(errorServidor);

      await userController.getUserById(mockReq, mockRes);

      expect(mockedUserIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener el usuario: ${errorServidor.message}`,
      });
    });
  });

  describe("saveUser", () => {
    it("debería guardar un usuario exitosamente", async () => {
      const datosUsuario = {
        email: "usuario@example.com",
        password: "password123",
        username: "juanperez",
        typeId: 1,
      };

      const usuarioGuardado = { userId: 1, ...datosUsuario };

      mockReq.body = datosUsuario;
      mockedCreateUserSchema.parse.mockReturnValue(datosUsuario);
      mockService.save.mockResolvedValue(usuarioGuardado);

      await userController.saveUser(mockReq, mockRes);

      expect(mockedCreateUserSchema.parse).toHaveBeenCalledWith(datosUsuario);
      expect(mockService.save).toHaveBeenCalledWith(datosUsuario);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Usuario creado correctamente",
        data: usuarioGuardado,
      });
      expect(console.log).toHaveBeenCalledWith("Usuario creado correctamente");
    });

    it("debería manejar errores de validación ZodError para email inválido", async () => {
      const datosInvalidos = {
        email: "invalid-email",
        password: "password123",
        username: "juanperez",
        typeId: 1,
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "Debe ser un email válido",
            path: ["email"],
            code: "invalid_string",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreateUserSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userController.saveUser(mockReq, mockRes);

      expect(mockedCreateUserSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: Debe ser un email válido",
        campo: ["email"],
        error: "invalid_string",
      });
    });

    it("debería manejar errores de validación ZodError para contraseña corta", async () => {
      const datosInvalidos = {
        email: "usuario@example.com",
        password: "123",
        username: "juanperez",
        typeId: 1,
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "La contraseña debe tener al menos 6 caracteres",
            path: ["password"],
            code: "too_small",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreateUserSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userController.saveUser(mockReq, mockRes);

      expect(mockedCreateUserSchema.parse).toHaveBeenCalledWith(datosInvalidos);
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message:
          "Datos inválidos: La contraseña debe tener al menos 6 caracteres",
        campo: ["password"],
        error: "too_small",
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const datosUsuario = {
        email: "usuario@example.com",
        password: "password123",
        username: "juanperez",
        typeId: 1,
      };
      const errorServidor = new Error("Error interno del servidor");

      mockReq.body = datosUsuario;
      mockedCreateUserSchema.parse.mockReturnValue(datosUsuario);
      mockService.save.mockRejectedValue(errorServidor);

      await userController.saveUser(mockReq, mockRes);

      expect(mockedCreateUserSchema.parse).toHaveBeenCalledWith(datosUsuario);
      expect(mockService.save).toHaveBeenCalledWith(datosUsuario);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Error interno del servidor",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al crear usuario:",
        errorServidor,
      );
    });

    it("debería manejar errores sin mensaje específico", async () => {
      const datosUsuario = {
        email: "usuario@example.com",
        password: "password123",
        username: "juanperez",
        typeId: 1,
      };
      const errorSinMensaje = {};

      mockReq.body = datosUsuario;
      mockedCreateUserSchema.parse.mockReturnValue(datosUsuario);
      mockService.save.mockRejectedValue(errorSinMensaje);

      await userController.saveUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: undefined",
      });
    });
  });

  describe("updateUser", () => {
    it("debería actualizar un usuario exitosamente", async () => {
      const datosActualizacion = {
        email: "usuarioactualizado@example.com",
        username: "juanperezactualizado",
      };

      const usuarioActualizado = {
        userId: 1,
        ...datosActualizacion,
        password: "password123",
        typeId: 1,
      };

      mockReq.params = { id: "1" };
      mockReq.body = datosActualizacion;
      mockedUserIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateUserSchema.parse.mockReturnValue(datosActualizacion);
      mockService.update.mockResolvedValue(usuarioActualizado);

      await userController.updateUser(mockReq, mockRes);

      expect(mockedUserIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockedUpdateUserSchema.parse).toHaveBeenCalledWith(
        datosActualizacion,
      );
      expect(mockService.update).toHaveBeenCalledWith({
        userId: 1,
        ...datosActualizacion,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Usuario actualizado correctamente",
        data: usuarioActualizado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Usuario actualizado correctamente",
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
      mockReq.body = { email: "test@example.com" };
      mockedUserIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userController.updateUser(mockReq, mockRes);

      expect(mockedUserIdSchema.parse).toHaveBeenCalledWith({ id: "invalid" });
      expect(mockedUpdateUserSchema.parse).not.toHaveBeenCalled();
      expect(mockService.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El ID debe ser un número positivo",
        campo: ["id"],
      });
    });

    it("debería manejar error cuando el usuario no existe", async () => {
      const errorNoEncontrado = new Error("Usuario no encontrado");

      mockReq.params = { id: "999" };
      mockReq.body = { email: "test@example.com" };
      mockedUserIdSchema.parse.mockReturnValue({ id: 999 });
      mockedUpdateUserSchema.parse.mockReturnValue({
        email: "test@example.com",
      });
      mockService.update.mockRejectedValue(errorNoEncontrado);

      await userController.updateUser(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        userId: 999,
        email: "test@example.com",
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
      mockReq.body = { email: "test@example.com" };
      mockedUserIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateUserSchema.parse.mockReturnValue({
        email: "test@example.com",
      });
      mockService.update.mockRejectedValue(errorServidor);

      await userController.updateUser(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        userId: 1,
        email: "test@example.com",
      });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al actualizar usuario:",
        errorServidor,
      );
    });
  });

  describe("deleteUser", () => {
    it("debería eliminar un usuario exitosamente", async () => {
      const usuarioEliminado = {
        userId: 1,
        email: "usuario@example.com",
        name: "Juan Pérez",
      };

      mockReq.params = { id: "1" };
      mockedUserIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockResolvedValue(usuarioEliminado);

      await userController.deleteUser(mockReq, mockRes);

      expect(mockedUserIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.delete).toHaveBeenCalledWith(1, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Usuario eliminado correctamente",
        data: usuarioEliminado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Usuario eliminado correctamente",
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
      mockedUserIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await userController.deleteUser(mockReq, mockRes);

      expect(mockedUserIdSchema.parse).toHaveBeenCalledWith({ id: "invalid" });
      expect(mockService.delete).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
    });

    it("debería manejar error cuando el usuario no existe", async () => {
      const errorNoEncontrado = new Error("Usuario no encontrado");

      mockReq.params = { id: "999" };
      mockedUserIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.delete.mockRejectedValue(errorNoEncontrado);

      await userController.deleteUser(mockReq, mockRes);

      expect(mockedUserIdSchema.parse).toHaveBeenCalledWith({ id: "999" });
      expect(mockService.delete).toHaveBeenCalledWith(999, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: errorNoEncontrado.message,
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = { id: "1" };
      mockedUserIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockRejectedValue(errorServidor);

      await userController.deleteUser(mockReq, mockRes);

      expect(mockedUserIdSchema.parse).toHaveBeenCalledWith({ id: "1" });
      expect(mockService.delete).toHaveBeenCalledWith(1, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error interno del servidor: ${errorServidor.message}`,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al eliminar usuario:",
        errorServidor,
      );
    });
  });

  describe("getUsersByType", () => {
    it("debería obtener usuarios por tipo exitosamente", async () => {
      const usuarios = [
        {
          userId: 1,
          email: "admin@example.com",
          name: "Admin",
          userTypeId: 1,
        },
        {
          userId: 2,
          email: "admin2@example.com",
          name: "Admin 2",
          userTypeId: 1,
        },
      ];

      mockReq.params = { typeId: "1" };
      (mockService as any).getUsersByType.mockResolvedValue(usuarios);

      await userController.getUsersByType(mockReq, mockRes);

      expect((mockService as any).getUsersByType).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Usuarios por tipo obtenidos correctamente",
        data: usuarios,
      });
    });

    it("debería manejar errores al obtener usuarios por tipo", async () => {
      const errorServidor = new Error("Error de conexión a la base de datos");

      mockReq.params = { typeId: "1" };
      (mockService as any).getUsersByType.mockRejectedValue(errorServidor);

      await userController.getUsersByType(mockReq, mockRes);

      expect((mockService as any).getUsersByType).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener los usuarios por tipo: ${errorServidor.message}`,
      });
    });

    it("debería retornar array vacío cuando no hay usuarios de ese tipo", async () => {
      const usuariosVacios: any[] = [];

      mockReq.params = { typeId: "99" };
      (mockService as any).getUsersByType.mockResolvedValue(usuariosVacios);

      await userController.getUsersByType(mockReq, mockRes);

      expect((mockService as any).getUsersByType).toHaveBeenCalledWith(99);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Usuarios por tipo obtenidos correctamente",
        data: usuariosVacios,
      });
    });
  });

  describe("login", () => {
    const datosLogin = { username: "admin.demo", password: "password123" };
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

    it("debería iniciar sesión exitosamente y generar token", async () => {
      mockReq.body = datosLogin;
      mockTokenService.generateToken.mockResolvedValue(token);

      await userController.login(mockReq, mockRes);

      expect(mockTokenService.generateToken).toHaveBeenCalledWith(datosLogin);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        "auth_token",
        token,
        expect.objectContaining({
          httpOnly: true,
          sameSite: "strict",
          maxAge: TOKEN_TTL_MS,
        }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Inicio de sesión exitoso",
        data: { token, expiresIn: TOKEN_TTL_MS / 1000 },
      });
    });

    it("debería responder 400 si faltan credenciales", async () => {
      mockReq.body = { username: "" };

      await userController.login(mockReq, mockRes);

      expect(mockTokenService.generateToken).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("debería responder 401 con credenciales inválidas", async () => {
      mockReq.body = datosLogin;
      mockTokenService.generateToken.mockRejectedValue(
        AppError.unauthorized("Usuario o contraseña incorrectos"),
      );

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Usuario o contraseña incorrectos",
      });
    });

    it("debería manejar errores inesperados con 500", async () => {
      const errorServidor = new Error("Error al generar token");
      mockReq.body = datosLogin;
      mockTokenService.generateToken.mockRejectedValue(errorServidor);

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al iniciar sesión: ${errorServidor.message}`,
      });
    });
  });

  describe("me", () => {
    it("debería devolver el usuario autenticado con su rol", async () => {
      const usuario = { userId: 1, username: "admin.demo", email: "a@b.c" };
      mockReq.user = { userId: 1, username: "admin.demo", role: "admin" };
      mockService.getById.mockResolvedValue(usuario);

      await userController.me(mockReq, mockRes);

      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Usuario autenticado",
        data: { ...usuario, role: "admin" },
      });
    });
  });

  describe("setServices", () => {
    it("debería establecer los servicios correctamente", async () => {
      const nuevoServicio = {
        getAll: jest.fn(),
        getById: jest.fn(),
        save: jest.fn(),
        saveAll: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      } as any;

      const nuevoTokenService = {
        generateToken: jest.fn(),
        verifyToken: jest.fn(),
      } as any;

      expect(() =>
        userController.setServices(nuevoServicio, nuevoTokenService),
      ).not.toThrow();

      // Verificar que los servicios se establecieron correctamente
      nuevoServicio.getAll.mockResolvedValue([]);
      await userController.getUsers(mockReq, mockRes);

      expect(nuevoServicio.getAll).toHaveBeenCalled();
    });
  });

  describe("Casos límite y validaciones", () => {
    it("debería manejar usuario con email en diferentes formatos", async () => {
      const emailsValidos = [
        "usuario@example.com",
        "usuario.nombre@example.co.uk",
        "usuario+tag@example.com",
        "usuario_123@example.com",
      ];

      for (const email of emailsValidos) {
        const datosUsuario = {
          email,
          password: "password123",
          username: "usuariotest",
          typeId: 1,
        };

        mockReq.body = datosUsuario;
        mockedCreateUserSchema.parse.mockReturnValue(datosUsuario);
        mockService.save.mockResolvedValue({ userId: 1, ...datosUsuario });

        await userController.saveUser(mockReq, mockRes);

        expect(mockedCreateUserSchema.parse).toHaveBeenCalledWith(datosUsuario);
      }
    });

    it("debería manejar nombres de usuario con caracteres especiales", async () => {
      const datosUsuario = {
        email: "usuario@example.com",
        password: "password123",
        username: "juanmariajosee",
        typeId: 1,
      };

      mockReq.body = datosUsuario;
      mockedCreateUserSchema.parse.mockReturnValue(datosUsuario);
      mockService.save.mockResolvedValue({ userId: 1, ...datosUsuario });

      await userController.saveUser(mockReq, mockRes);

      expect(mockedCreateUserSchema.parse).toHaveBeenCalledWith(datosUsuario);
      expect(mockService.save).toHaveBeenCalledWith(datosUsuario);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería retornar un usuario con todos los campos requeridos", async () => {
      const usuario = {
        userId: 1,
        email: "usuario@example.com",
        password: "password123",
        username: "juanperez",
        typeId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReq.params = { id: "1" };
      mockedUserIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockResolvedValue(usuario);

      await userController.getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const callArgs = mockRes.send.mock.calls[0][0];
      expect(callArgs.data).toHaveProperty("userId");
      expect(callArgs.data).toHaveProperty("email");
      expect(callArgs.data).toHaveProperty("username");
      expect(callArgs.data).toHaveProperty("typeId");
    });
  });
});
