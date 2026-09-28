import * as supplierController from "../SupplierController";
import { IService } from "../../core/interfaces/IService";
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdSchema,
} from "../../application/validations/SupplierValidations";

jest.mock("../../application/validations/SupplierValidations", () => ({
  createSupplierSchema: { parse: jest.fn() },
  updateSupplierSchema: { parse: jest.fn() },
  supplierIdSchema: { parse: jest.fn() },
}));
const mockedCreateSupplierSchema = createSupplierSchema as jest.Mocked<
  typeof createSupplierSchema
>;
const mockedUpdateSupplierSchema = updateSupplierSchema as jest.Mocked<
  typeof updateSupplierSchema
>;
const mockedSupplierIdSchema = supplierIdSchema as jest.Mocked<
  typeof supplierIdSchema
>;

describe("SupplierController", () => {
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

    // Mock adicional para métodos específicos del SupplierService
    (mockService as any).getActiveSuppliers = jest.fn();

    // Establecer el servicio mock
    supplierController.setService(mockService);

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

  describe("getSuppliers", () => {
    it("debería retornar los proveedores exitosamente", async () => {
      const proveedoresSimulados = [
        {
          supplierId: 1,
          name: "Café del Valle",
          phone: "+50322334455",
          email: "contacto@cafedelvalle.com",
          active: true,
        },
        {
          supplierId: 2,
          name: "Distribuidora Central",
          phone: "+50377889900",
          email: "ventas@distribuidoracentral.com",
          active: true,
        },
      ];

      mockService.getAll.mockResolvedValue(proveedoresSimulados);

      await supplierController.getSuppliers(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Proveedores obtenidos correctamente",
        data: proveedoresSimulados,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Proveedores obtenidos correctamente",
      );
    });

    it("debería manejar errores al obtener los proveedores", async () => {
      const mensajeError = "Error de conexión a la base de datos";
      mockService.getAll.mockRejectedValue(new Error(mensajeError));

      await supplierController.getSuppliers(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener los proveedores: Error: ${mensajeError}`,
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Proveedores obtenidos correctamente",
      );
    });

    it("debería manejar errores sin mensaje específico", async () => {
      const errorSinMensaje = "Error genérico";
      mockService.getAll.mockRejectedValue(errorSinMensaje);

      await supplierController.getSuppliers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener los proveedores: ${errorSinMensaje}`,
      });
    });
  });

  describe("getSupplierById", () => {
    it("debería retornar el proveedor por ID exitosamente", async () => {
      const proveedorSimulado = {
        supplierId: 1,
        name: "Café del Valle",
        phone: "+50322334455",
        email: "contacto@cafedelvalle.com",
        active: true,
      };
      const idParams = { id: "1" };

      mockReq.params = idParams;
      mockedSupplierIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockResolvedValue(proveedorSimulado);

      await supplierController.getSupplierById(mockReq, mockRes);

      expect(mockedSupplierIdSchema.parse).toHaveBeenCalledWith(idParams);
      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Proveedor obtenido correctamente",
        data: proveedorSimulado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Proveedor obtenido correctamente",
      );
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
      mockedSupplierIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await supplierController.getSupplierById(mockReq, mockRes);

      expect(mockedSupplierIdSchema.parse).toHaveBeenCalledWith(idInvalido);
      expect(mockService.getById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Proveedor obtenido correctamente",
      );
    });

    it("debería manejar el caso cuando el proveedor no es encontrado", async () => {
      const idParams = { id: "999" };
      const errorNoEncontrado = new Error("Proveedor no encontrado");

      mockReq.params = idParams;
      mockedSupplierIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.getById.mockRejectedValue(errorNoEncontrado);

      await supplierController.getSupplierById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Proveedor no encontrado",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Proveedor obtenido correctamente",
      );
    });

    it("debería manejar errores generales del servidor", async () => {
      const idParams = { id: "1" };
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = idParams;
      mockedSupplierIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.getById.mockRejectedValue(errorServidor);

      await supplierController.getSupplierById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error al obtener el proveedor: Error interno del servidor",
      });
    });
  });

  describe("createSupplier", () => {
    it("debería crear el proveedor exitosamente", async () => {
      const datosProveedor = {
        name: "Café del Valle",
        phone: "+503 2233-4455",
        email: "CONTACTO@CAFEDELVALLE.COM",
        active: true,
      };

      const datosValidados = {
        name: "Café del Valle",
        phone: "50322334455",
        email: "contacto@cafedelvalle.com",
        active: true,
      };

      const proveedorGuardado = {
        supplierId: 1,
        ...datosValidados,
      };

      mockReq.body = datosProveedor;
      mockedCreateSupplierSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockResolvedValue(proveedorGuardado);

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
        datosProveedor,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Proveedor creado correctamente",
        data: proveedorGuardado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Proveedor creado correctamente",
      );
    });

    it("debería manejar errores de validación ZodError para nombre vacío", async () => {
      const datosInvalidos = {
        name: "",
        phone: "+503 2233-4455",
        email: "contacto@cafedelvalle.com",
        active: true,
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El nombre no puede estar vacío",
            path: ["name"],
            code: "too_small",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreateSupplierSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre no puede estar vacío",
        campo: ["name"],
        error: "too_small",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Proveedor creado correctamente",
      );
    });

    it("debería manejar errores de validación ZodError para nombre muy largo", async () => {
      const nombreMuyLargo = "a".repeat(101);
      const datosInvalidos = {
        name: nombreMuyLargo,
        phone: "+503 2233-4455",
        email: "contacto@cafedelvalle.com",
        active: true,
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
      mockedCreateSupplierSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
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

    it("debería manejar errores de validación ZodError para teléfono inválido", async () => {
      const datosInvalidos = {
        name: "Café del Valle",
        phone: "123456",
        email: "contacto@cafedelvalle.com",
        active: true,
      };
      const errorZod = {
        name: "ZodError",
        issues: [
          {
            message: "El teléfono debe tener formato válido (+503 XXXX-XXXX)",
            path: ["phone"],
            code: "custom",
          },
        ],
      };

      mockReq.body = datosInvalidos;
      mockedCreateSupplierSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message:
          "Datos inválidos: El teléfono debe tener formato válido (+503 XXXX-XXXX)",
        campo: ["phone"],
        error: "custom",
      });
    });

    it("debería manejar errores de validación ZodError para email inválido", async () => {
      const datosInvalidos = {
        name: "Café del Valle",
        phone: "+503 2233-4455",
        email: "email-invalido",
        active: true,
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
      mockedCreateSupplierSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
        datosInvalidos,
      );
      expect(mockService.save).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: Debe ser un email válido",
        campo: ["email"],
        error: "invalid_string",
      });
    });

    it("debería manejar errores generales del servidor", async () => {
      const datosProveedor = {
        name: "Café del Valle",
        phone: "+503 2233-4455",
        email: "contacto@cafedelvalle.com",
        active: true,
      };

      const datosValidados = {
        name: "Café del Valle",
        phone: "50322334455",
        email: "contacto@cafedelvalle.com",
        active: true,
      };

      const errorServidor = new Error("Error interno del servidor");

      mockReq.body = datosProveedor;
      mockedCreateSupplierSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockRejectedValue(errorServidor);

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
        datosProveedor,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Error interno del servidor",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al crear proveedor:",
        errorServidor,
      );
      expect(console.log).not.toHaveBeenCalledWith(
        "Proveedor creado correctamente",
      );
    });

    it("debería manejar el valor por defecto de active", async () => {
      const datosProveedor = {
        name: "Café del Valle",
        phone: "+503 2233-4455",
        email: "contacto@cafedelvalle.com",
        // Sin especificar active
      };

      const datosValidados = {
        name: "Café del Valle",
        phone: "50322334455",
        email: "contacto@cafedelvalle.com",
        active: true, // Valor por defecto
      };

      const proveedorGuardado = {
        supplierId: 1,
        ...datosValidados,
      };

      mockReq.body = datosProveedor;
      mockedCreateSupplierSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockResolvedValue(proveedorGuardado);

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
        datosProveedor,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateSupplier", () => {
    it("debería actualizar el proveedor exitosamente", async () => {
      const idParams = { id: "1" };
      const datosActualizacion = {
        name: "Café del Valle Actualizado",
        email: "nuevo@cafedelvalle.com",
      };

      const datosValidados = {
        name: "Café del Valle Actualizado",
        email: "nuevo@cafedelvalle.com",
      };

      const proveedorActualizado = {
        supplierId: 1,
        phone: "+50322334455",
        active: true,
        ...datosValidados,
      };

      mockReq.params = idParams;
      mockReq.body = datosActualizacion;
      mockedSupplierIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateSupplierSchema.parse.mockReturnValue(datosValidados);
      (mockService as any).update.mockResolvedValue(proveedorActualizado);

      await supplierController.updateSupplier(mockReq, mockRes);

      expect(mockedSupplierIdSchema.parse).toHaveBeenCalledWith(idParams);
      expect(mockedUpdateSupplierSchema.parse).toHaveBeenCalledWith(
        datosActualizacion,
      );
      expect((mockService as any).update).toHaveBeenCalledWith({
        supplierId: 1,
        ...datosValidados,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Proveedor actualizado correctamente",
        data: proveedorActualizado,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Proveedor actualizado correctamente",
      );
    });

    it("debería manejar errores de validación ZodError para ID inválido", async () => {
      const idInvalido = { id: "invalid" };
      const datosActualizacion = { name: "Nuevo nombre" };
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
      mockedSupplierIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await supplierController.updateSupplier(mockReq, mockRes);

      expect(mockedSupplierIdSchema.parse).toHaveBeenCalledWith(idInvalido);
      expect(mockedUpdateSupplierSchema.parse).not.toHaveBeenCalled();
      expect((mockService as any).update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El ID debe ser un número positivo",
        campo: ["id"],
      });
    });

    it("debería manejar el caso cuando el proveedor no es encontrado", async () => {
      const idParams = { id: "999" };
      const datosActualizacion = { name: "Nuevo nombre" };
      const datosValidados = { name: "Nuevo nombre" };
      const errorNoEncontrado = new Error("Proveedor no encontrado");

      mockReq.params = idParams;
      mockReq.body = datosActualizacion;
      mockedSupplierIdSchema.parse.mockReturnValue({ id: 999 });
      mockedUpdateSupplierSchema.parse.mockReturnValue(datosValidados);
      (mockService as any).update.mockRejectedValue(errorNoEncontrado);

      await supplierController.updateSupplier(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Proveedor no encontrado",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Proveedor actualizado correctamente",
      );
    });

    it("debería manejar errores generales del servidor", async () => {
      const idParams = { id: "1" };
      const datosActualizacion = { name: "Nuevo nombre" };
      const datosValidados = { name: "Nuevo nombre" };
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = idParams;
      mockReq.body = datosActualizacion;
      mockedSupplierIdSchema.parse.mockReturnValue({ id: 1 });
      mockedUpdateSupplierSchema.parse.mockReturnValue(datosValidados);
      (mockService as any).update.mockRejectedValue(errorServidor);

      await supplierController.updateSupplier(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Error interno del servidor",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al actualizar proveedor:",
        errorServidor,
      );
    });
  });

  describe("deleteSupplier", () => {
    it("debería eliminar el proveedor exitosamente", async () => {
      const idParams = { id: "1" };
      const resultadoEliminacion = { affected: 1 };

      mockReq.params = idParams;
      mockedSupplierIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockResolvedValue(resultadoEliminacion);

      await supplierController.deleteSupplier(mockReq, mockRes);

      expect(mockedSupplierIdSchema.parse).toHaveBeenCalledWith(idParams);
      expect(mockService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Proveedor eliminado correctamente",
        data: resultadoEliminacion,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Proveedor eliminado correctamente",
      );
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
      mockedSupplierIdSchema.parse.mockImplementation(() => {
        throw errorZod;
      });

      await supplierController.deleteSupplier(mockReq, mockRes);

      expect(mockedSupplierIdSchema.parse).toHaveBeenCalledWith(idInvalido);
      expect(mockService.delete).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Proveedor eliminado correctamente",
      );
    });

    it("debería manejar el caso cuando el proveedor no es encontrado", async () => {
      const idParams = { id: "999" };
      const errorNoEncontrado = new Error("Proveedor no encontrado");

      mockReq.params = idParams;
      mockedSupplierIdSchema.parse.mockReturnValue({ id: 999 });
      mockService.delete.mockRejectedValue(errorNoEncontrado);

      await supplierController.deleteSupplier(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Proveedor no encontrado",
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Proveedor eliminado correctamente",
      );
    });

    it("debería manejar errores generales del servidor", async () => {
      const idParams = { id: "1" };
      const errorServidor = new Error("Error interno del servidor");

      mockReq.params = idParams;
      mockedSupplierIdSchema.parse.mockReturnValue({ id: 1 });
      mockService.delete.mockRejectedValue(errorServidor);

      await supplierController.deleteSupplier(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Error interno del servidor",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al eliminar proveedor:",
        errorServidor,
      );
    });
  });

  describe("getActiveSuppliers", () => {
    it("debería retornar los proveedores activos exitosamente", async () => {
      const proveedoresActivos = [
        {
          supplierId: 1,
          name: "Café del Valle",
          phone: "+50322334455",
          email: "contacto@cafedelvalle.com",
          active: true,
        },
        {
          supplierId: 3,
          name: "Distribuidora Central",
          phone: "+50377889900",
          email: "ventas@distribuidoracentral.com",
          active: true,
        },
      ];

      (mockService as any).getActiveSuppliers.mockResolvedValue(
        proveedoresActivos,
      );

      await supplierController.getActiveSuppliers(mockReq, mockRes);

      expect((mockService as any).getActiveSuppliers).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Proveedores activos obtenidos correctamente",
        data: proveedoresActivos,
      });
      expect(console.log).toHaveBeenCalledWith(
        "Proveedores activos obtenidos correctamente",
      );
    });

    it("debería manejar errores al obtener los proveedores activos", async () => {
      const mensajeError = "Error de conexión a la base de datos";
      (mockService as any).getActiveSuppliers.mockRejectedValue(
        new Error(mensajeError),
      );

      await supplierController.getActiveSuppliers(mockReq, mockRes);

      expect((mockService as any).getActiveSuppliers).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener los proveedores activos: Error: ${mensajeError}`,
      });
      expect(console.log).not.toHaveBeenCalledWith(
        "Proveedores activos obtenidos correctamente",
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

      // Agregar método específico del SupplierService
      (nuevoServicio as any).getActiveSuppliers = jest.fn();

      expect(() => supplierController.setService(nuevoServicio)).not.toThrow();

      // Verificar que el servicio se estableció correctamente
      nuevoServicio.getAll.mockResolvedValue([]);
      await supplierController.getSuppliers(mockReq, mockRes);

      expect(nuevoServicio.getAll).toHaveBeenCalled();
    });
  });

  describe("Casos con diferentes formatos de teléfono", () => {
    const formatosTelefono = [
      { input: "+503 2233-4455", expected: "50322334455" },
      { input: "+50322334455", expected: "50322334455" },
      { input: "2233-4455", expected: "22334455" },
      { input: "22334455", expected: "22334455" },
      { input: "+503 7788 9900", expected: "50377889900" },
    ];

    formatosTelefono.forEach(({ input, expected }) => {
      it(`debería procesar teléfono "${input}" correctamente`, async () => {
        const datosProveedor = {
          name: "Proveedor Test",
          phone: input,
          email: "test@proveedor.com",
          active: true,
        };

        const datosValidados = {
          name: "Proveedor Test",
          phone: expected,
          email: "test@proveedor.com",
          active: true,
        };

        const proveedorGuardado = {
          supplierId: 1,
          ...datosValidados,
        };

        mockReq.body = datosProveedor;
        mockedCreateSupplierSchema.parse.mockReturnValue(datosValidados);
        mockService.save.mockResolvedValue(proveedorGuardado);

        await supplierController.createSupplier(mockReq, mockRes);

        expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
          datosProveedor,
        );
        expect(mockService.save).toHaveBeenCalledWith(datosValidados);
        expect(mockRes.status).toHaveBeenCalledWith(201);
      });
    });
  });

  describe("Casos con diferentes formatos de email", () => {
    const formatosEmail = [
      { input: "CONTACTO@EMPRESA.COM", expected: "contacto@empresa.com" },
      { input: "Ventas@Proveedor.Net", expected: "ventas@proveedor.net" },
      { input: "INFO@CAFETERIA.ORG", expected: "info@cafeteria.org" },
    ];

    formatosEmail.forEach(({ input, expected }) => {
      it(`debería procesar email "${input}" a minúsculas correctamente`, async () => {
        const datosProveedor = {
          name: "Proveedor Test",
          phone: "+503 2233-4455",
          email: input,
          active: true,
        };

        const datosValidados = {
          name: "Proveedor Test",
          phone: "50322334455",
          email: expected,
          active: true,
        };

        const proveedorGuardado = {
          supplierId: 1,
          ...datosValidados,
        };

        mockReq.body = datosProveedor;
        mockedCreateSupplierSchema.parse.mockReturnValue(datosValidados);
        mockService.save.mockResolvedValue(proveedorGuardado);

        await supplierController.createSupplier(mockReq, mockRes);

        expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
          datosProveedor,
        );
        expect(mockService.save).toHaveBeenCalledWith(datosValidados);
        expect(mockRes.status).toHaveBeenCalledWith(201);
      });
    });
  });

  describe("Casos límite de validación", () => {
    it("debería manejar nombre con exactamente 1 carácter", async () => {
      const datosMinimos = {
        name: "A",
        phone: "+503 2233-4455",
        email: "a@b.co",
        active: true,
      };

      const datosValidados = {
        name: "A",
        phone: "50322334455",
        email: "a@b.co",
        active: true,
      };

      const proveedorGuardado = {
        supplierId: 1,
        ...datosValidados,
      };

      mockReq.body = datosMinimos;
      mockedCreateSupplierSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockResolvedValue(proveedorGuardado);

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
        datosMinimos,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar nombre con exactamente 100 caracteres", async () => {
      const nombreMaximo = "a".repeat(100);
      const datosMaximos = {
        name: nombreMaximo,
        phone: "+503 2233-4455",
        email: "test@maxlength.com",
        active: true,
      };

      const datosValidados = {
        name: nombreMaximo,
        phone: "50322334455",
        email: "test@maxlength.com",
        active: true,
      };

      const proveedorGuardado = {
        supplierId: 1,
        ...datosValidados,
      };

      mockReq.body = datosMaximos;
      mockedCreateSupplierSchema.parse.mockReturnValue(datosValidados);
      mockService.save.mockResolvedValue(proveedorGuardado);

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
        datosMaximos,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosValidados);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar nombres con espacios (trim)", async () => {
      const datosConEspacios = {
        name: "   Proveedor con Espacios   ",
        phone: "+503 2233-4455",
        email: "test@espacios.com",
        active: true,
      };

      const datosLimpios = {
        name: "Proveedor con Espacios",
        phone: "50322334455",
        email: "test@espacios.com",
        active: true,
      };

      const proveedorGuardado = {
        supplierId: 1,
        ...datosLimpios,
      };

      mockReq.body = datosConEspacios;
      mockedCreateSupplierSchema.parse.mockReturnValue(datosLimpios);
      mockService.save.mockResolvedValue(proveedorGuardado);

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockedCreateSupplierSchema.parse).toHaveBeenCalledWith(
        datosConEspacios,
      );
      expect(mockService.save).toHaveBeenCalledWith(datosLimpios);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
