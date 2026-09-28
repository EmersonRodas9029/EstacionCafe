import { Repository } from "typeorm";
import { SupplierService } from "../SupplierService";
import { Supplier } from "../../../core/entities/Supplier";
import { SaveSupplierDTO } from "../../DTOs/SupplierDTO";

describe("SupplierService", () => {
  let supplierService: SupplierService;
  let mockRepository: jest.Mocked<Repository<Supplier>>;

  beforeEach(() => {
    // Crear mock del repositorio
    mockRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    // Crear instancia del servicio con el repositorio mock
    supplierService = new SupplierService(mockRepository);

    // Limpiar console.log
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe("save", () => {
    it("debería guardar un proveedor exitosamente", async () => {
      const supplierData: SaveSupplierDTO = {
        name: "Café del Valle",
        phone: "+50322334455",
        email: "info@cafedelvalle.com",
        active: true,
      };

      const savedSupplier = {
        supplierId: 1,
        name: "Café del Valle",
        phone: "+50322334455",
        email: "info@cafedelvalle.com",
        active: true,
      } as Supplier;

      mockRepository.save.mockResolvedValue(savedSupplier);

      const result = await supplierService.save(supplierData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Café del Valle",
          phone: "+50322334455",
          email: "info@cafedelvalle.com",
          active: true,
        })
      );
      expect(result).toEqual(savedSupplier);
      expect(console.log).toHaveBeenCalledWith("Guardando proveedor...");
    });

    it("debería establecer active como true por defecto cuando no se proporciona", async () => {
      const supplierData: SaveSupplierDTO = {
        name: "Distribuidora El Sol",
        phone: "+50377889900",
        email: "ventas@distribuidoraelsol.com",
      };

      mockRepository.save.mockResolvedValue({} as Supplier);

      await supplierService.save(supplierData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Distribuidora El Sol",
          phone: "+50377889900",
          email: "ventas@distribuidoraelsol.com",
          active: true, // Valor por defecto
        })
      );
    });

    it("debería respetar el valor de active cuando se proporciona explícitamente", async () => {
      const supplierData: SaveSupplierDTO = {
        name: "Proveedor Inactivo",
        phone: "+50311223344",
        email: "contacto@inactivo.com",
        active: false,
      };

      mockRepository.save.mockResolvedValue({} as Supplier);

      await supplierService.save(supplierData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          active: false,
        })
      );
    });

    it("debería crear una entidad Supplier con los datos correctos", async () => {
      const supplierData: SaveSupplierDTO = {
        name: "Importadora ABC",
        phone: "+50366778899",
        email: "admin@importadoraabc.com",
        active: true,
      };

      let savedEntity: any;
      mockRepository.save.mockImplementation((supplier) => {
        savedEntity = supplier;
        return Promise.resolve({ supplierId: 1, ...supplier } as Supplier);
      });

      await supplierService.save(supplierData);

      expect(savedEntity).toBeInstanceOf(Supplier);
      expect(savedEntity.name).toBe("Importadora ABC");
      expect(savedEntity.phone).toBe("+50366778899");
      expect(savedEntity.email).toBe("admin@importadoraabc.com");
      expect(savedEntity.active).toBe(true);
    });

    it("debería manejar errores del repositorio", async () => {
      const supplierData: SaveSupplierDTO = {
        name: "Test Supplier",
        phone: "+50312345678",
        email: "test@supplier.com",
      };

      const repositoryError = new Error("Error de base de datos");
      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(supplierService.save(supplierData)).rejects.toThrow("Error de base de datos");
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("saveAll", () => {
    it("debería guardar múltiples proveedores exitosamente", async () => {
      const suppliersData = [
        {
          name: "Proveedor 1",
          phone: "+50311111111",
          email: "p1@test.com",
          active: true,
        },
        {
          name: "Proveedor 2",
          phone: "+50322222222",
          email: "p2@test.com",
          active: false,
        },
      ];

      const savedSuppliers = [
        { supplierId: 1, ...suppliersData[0] },
        { supplierId: 2, ...suppliersData[1] },
      ] as Supplier[];

      mockRepository.save.mockResolvedValue(savedSuppliers as any);

      const result = await supplierService.saveAll(suppliersData);

      expect(mockRepository.save).toHaveBeenCalledWith(suppliersData);
      expect(result).toEqual(savedSuppliers);
      expect(console.log).toHaveBeenCalledWith("Guardando múltiples proveedores...");
    });

    it("debería manejar array vacío", async () => {
      mockRepository.save.mockResolvedValue([] as any);

      const result = await supplierService.saveAll([]);

      expect(mockRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it("debería manejar errores del repositorio", async () => {
      const suppliersData = [{ name: "Test", phone: "+50312345678", email: "test@test.com" }];
      const repositoryError = new Error("Error de inserción masiva");

      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(supplierService.saveAll(suppliersData)).rejects.toThrow("Error de inserción masiva");
    });
  });

  describe("delete", () => {
    it("debería desactivar un proveedor exitosamente (soft delete)", async () => {
      const supplierId = 1;
      const existingSupplier = {
        supplierId: 1,
        name: "Proveedor Test",
        phone: "+50312345678",
        email: "test@proveedor.com",
        active: true,
      } as Supplier;

      const deactivatedSupplier = {
        ...existingSupplier,
        active: false,
      } as Supplier;

      // Mock the findOne call that getById uses
      mockRepository.findOne.mockResolvedValue(existingSupplier);
      mockRepository.save.mockResolvedValue(deactivatedSupplier);

      const result = await supplierService.delete(supplierId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { supplierId },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        active: false,
      }));
      expect(result).toEqual({
        message: "Proveedor desactivado correctamente",
        id: supplierId,
      });
      expect(console.log).toHaveBeenCalledWith(`Desactivando proveedor con ID: ${supplierId}`);
      expect(console.log).toHaveBeenCalledWith(`Obteniendo proveedor con ID: ${supplierId}`);
    });

    it("debería lanzar error cuando el proveedor no existe", async () => {
      const supplierId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(supplierService.delete(supplierId)).rejects.toThrow(
        `Proveedor con ID ${supplierId} no encontrado`
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { supplierId },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería manejar errores del repositorio", async () => {
      const supplierId = 1;
      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(supplierService.delete(supplierId)).rejects.toThrow("Error de consulta");
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { supplierId },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("debería actualizar un proveedor exitosamente", async () => {
      const updateData = {
        supplierId: 1,
        name: "Nuevo Nombre",
        email: "nuevo@email.com",
      };

      const existingSupplier = {
        supplierId: 1,
        name: "Nombre Anterior",
        phone: "+50312345678",
        email: "anterior@email.com",
        active: true,
      } as Supplier;

      const updatedSupplier = {
        ...existingSupplier,
        name: "Nuevo Nombre",
        email: "nuevo@email.com",
      } as Supplier;

      mockRepository.findOne.mockResolvedValue(existingSupplier);
      mockRepository.save.mockResolvedValue(updatedSupplier);

      const result = await supplierService.update(updateData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { supplierId: 1 },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: 1,
          name: "Nuevo Nombre",
          phone: "+50312345678", // No cambió
          email: "nuevo@email.com",
          active: true, // No cambió
        })
      );
      expect(result).toEqual(updatedSupplier);
      expect(console.log).toHaveBeenCalledWith("Actualizando proveedor con ID: 1");
    });

    it("debería usar Object.assign para actualizar campos", async () => {
      const updateData = {
        supplierId: 1,
        phone: "+50399887766",
        active: false,
      };

      const existingSupplier = {
        supplierId: 1,
        name: "Proveedor Test",
        phone: "+50312345678",
        email: "test@proveedor.com",
        active: true,
      } as Supplier;

      mockRepository.findOne.mockResolvedValue(existingSupplier);
      mockRepository.save.mockResolvedValue(existingSupplier);

      await supplierService.update(updateData);

      // Verificar que Object.assign se aplicó correctamente
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Proveedor Test", // No cambió
          phone: "+50399887766", // Cambió
          email: "test@proveedor.com", // No cambió
          active: false, // Cambió
        })
      );
    });

    it("debería lanzar error cuando el proveedor no existe", async () => {
      const updateData = {
        supplierId: 999,
        name: "No existe",
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(supplierService.update(updateData)).rejects.toThrow(
        "Proveedor con ID 999 no encontrado"
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { supplierId: 999 },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería manejar errores del repositorio en findOne", async () => {
      const updateData = {
        supplierId: 1,
        name: "Test",
      };

      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(supplierService.update(updateData)).rejects.toThrow("Error de consulta");
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería manejar errores del repositorio en save", async () => {
      const updateData = {
        supplierId: 1,
        name: "Test",
      };

      const existingSupplier = {
        supplierId: 1,
        name: "Anterior",
        phone: "+50312345678",
        email: "test@test.com",
        active: true,
      } as Supplier;

      const saveError = new Error("Error de guardado");

      mockRepository.findOne.mockResolvedValue(existingSupplier);
      mockRepository.save.mockRejectedValue(saveError);

      await expect(supplierService.update(updateData)).rejects.toThrow("Error de guardado");
    });
  });

  describe("getAll", () => {
    it("debería obtener todos los proveedores ordenados por nombre", async () => {
      const mockSuppliers = [
        {
          supplierId: 1,
          name: "Café del Valle",
          phone: "+50322334455",
          email: "info@cafedelvalle.com",
          active: true,
        },
        {
          supplierId: 2,
          name: "Distribuidora El Sol",
          phone: "+50377889900",
          email: "ventas@distribuidoraelsol.com",
          active: true,
        },
      ] as Supplier[];

      mockRepository.find.mockResolvedValue(mockSuppliers);

      const result = await supplierService.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { name: "ASC" },
      });
      expect(result).toEqual(mockSuppliers);
      expect(console.log).toHaveBeenCalledWith("Obteniendo todos los proveedores...");
    });

    it("debería retornar array vacío cuando no hay proveedores", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await supplierService.getAll();

      expect(result).toEqual([]);
      expect(console.log).toHaveBeenCalledWith("Obteniendo todos los proveedores...");
    });

    it("debería manejar errores del repositorio", async () => {
      const repositoryError = new Error("Error de conexión");
      mockRepository.find.mockRejectedValue(repositoryError);

      await expect(supplierService.getAll()).rejects.toThrow("Error de conexión");
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("debería obtener un proveedor por ID", async () => {
      const supplierId = 1;
      const mockSupplier = {
        supplierId: 1,
        name: "Café Premium",
        phone: "+50355667788",
        email: "contacto@cafepremium.com",
        active: true,
      } as Supplier;

      mockRepository.findOne.mockResolvedValue(mockSupplier);

      const result = await supplierService.getById(supplierId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { supplierId: 1 },
      });
      expect(result).toEqual(mockSupplier);
      expect(console.log).toHaveBeenCalledWith("Obteniendo proveedor con ID: 1");
    });

    it("debería lanzar error cuando el proveedor no existe", async () => {
      const supplierId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(supplierService.getById(supplierId)).rejects.toThrow(
        "Proveedor con ID 999 no encontrado"
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { supplierId: 999 },
      });
    });

    it("debería manejar errores del repositorio", async () => {
      const supplierId = 1;
      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(supplierService.getById(supplierId)).rejects.toThrow("Error de consulta");
      expect(mockRepository.findOne).toHaveBeenCalled();
    });
  });

  describe("getActiveSuppliers", () => {
    it("debería obtener solo proveedores activos ordenados por nombre", async () => {
      const mockActiveSuppliers = [
        {
          supplierId: 1,
          name: "Café del Valle",
          phone: "+50322334455",
          email: "info@cafedelvalle.com",
          active: true,
        },
        {
          supplierId: 3,
          name: "Importadora XYZ",
          phone: "+50311223344",
          email: "ventas@importadoraxyz.com",
          active: true,
        },
      ] as Supplier[];

      mockRepository.find.mockResolvedValue(mockActiveSuppliers);

      const result = await supplierService.getActiveSuppliers();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { active: true },
        order: { name: "ASC" },
      });
      expect(result).toEqual(mockActiveSuppliers);
      expect(console.log).toHaveBeenCalledWith("Obteniendo proveedores activos...");
    });

    it("debería retornar array vacío cuando no hay proveedores activos", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await supplierService.getActiveSuppliers();

      expect(result).toEqual([]);
      expect(console.log).toHaveBeenCalledWith("Obteniendo proveedores activos...");
    });

    it("debería manejar errores del repositorio", async () => {
      const repositoryError = new Error("Error de consulta activos");
      mockRepository.find.mockRejectedValue(repositoryError);

      await expect(supplierService.getActiveSuppliers()).rejects.toThrow("Error de consulta activos");
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe("Casos de integración", () => {
    it("debería manejar flujo completo de CRUD", async () => {
      const supplierData: SaveSupplierDTO = {
        name: "Nuevo Proveedor",
        phone: "+50388776655",
        email: "nuevo@proveedor.com",
        active: true,
      };

      const savedSupplier = {
        supplierId: 1,
        ...supplierData,
      } as Supplier;

      const updateData = {
        supplierId: 1,
        active: false,
      };

      const updatedSupplier = {
        ...savedSupplier,
        active: false,
      } as Supplier;

      // 1. Guardar
      mockRepository.save.mockResolvedValueOnce(savedSupplier);
      const saveResult = await supplierService.save(supplierData);
      expect(saveResult).toEqual(savedSupplier);

      // 2. Obtener por ID
      mockRepository.findOne.mockResolvedValueOnce(savedSupplier);
      const getResult = await supplierService.getById(1);
      expect(getResult).toEqual(savedSupplier);

      // 3. Actualizar
      mockRepository.findOne.mockResolvedValueOnce(savedSupplier);
      mockRepository.save.mockResolvedValueOnce(updatedSupplier);
      const updateResult = await supplierService.update(updateData);
      expect(updateResult).toEqual(updatedSupplier);

      // 4. Desactivar (soft delete)
      mockRepository.findOne.mockResolvedValueOnce(updatedSupplier);
      mockRepository.save.mockResolvedValueOnce({ ...updatedSupplier, active: false });
      const deleteResult = await supplierService.delete(1);
      expect(deleteResult.message).toBe("Proveedor desactivado correctamente");
    });

    it("debería filtrar correctamente proveedores activos vs todos", async () => {
      const allSuppliers = [
        { supplierId: 1, name: "Activo 1", active: true },
        { supplierId: 2, name: "Inactivo", active: false },
        { supplierId: 3, name: "Activo 2", active: true },
      ] as Supplier[];

      const activeSuppliers = [
        { supplierId: 1, name: "Activo 1", active: true },
        { supplierId: 3, name: "Activo 2", active: true },
      ] as Supplier[];

      mockRepository.find
        .mockResolvedValueOnce(allSuppliers) // getAll
        .mockResolvedValueOnce(activeSuppliers); // getActiveSuppliers

      const allResults = await supplierService.getAll();
      const activeResults = await supplierService.getActiveSuppliers();

      expect(allResults).toHaveLength(3);
      expect(activeResults).toHaveLength(2);
      expect(activeResults.every(s => s.active)).toBe(true);
    });
  });

  describe("Validaciones de datos", () => {
    it("debería manejar nombres largos", async () => {
      const supplierData: SaveSupplierDTO = {
        name: "Distribuidora Internacional de Productos Alimenticios y Bebidas del Pacífico",
        phone: "+50399887766",
        email: "info@distribuidorainternacional.com",
        active: true,
      };

      mockRepository.save.mockResolvedValue({} as Supplier);

      await supplierService.save(supplierData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Distribuidora Internacional de Productos Alimenticios y Bebidas del Pacífico",
        })
      );
    });

    it("debería manejar emails con dominios complejos", async () => {
      const supplierData: SaveSupplierDTO = {
        name: "Proveedor Global",
        phone: "+50311223344",
        email: "ventas.internacionales@proveedor.global.co.uk",
        active: true,
      };

      mockRepository.save.mockResolvedValue({} as Supplier);

      await supplierService.save(supplierData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "ventas.internacionales@proveedor.global.co.uk",
        })
      );
    });

    it("debería manejar teléfonos con diferentes formatos", async () => {
      const phoneFormats = [
        "+50322334455",
        "50322334455",
        "2233-4455",
        "+503 2233-4455",
      ];

      for (const phone of phoneFormats) {
        const supplierData: SaveSupplierDTO = {
          name: `Proveedor ${phone}`,
          phone: phone,
          email: `test${phone.replace(/\D/g, '')}@test.com`,
          active: true,
        };

        mockRepository.save.mockResolvedValue({} as Supplier);

        await supplierService.save(supplierData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: phone,
          })
        );
      }
    });

    it("debería manejar estados activo/inactivo correctamente", async () => {
      const cases = [
        { active: true, expected: true },
        { active: false, expected: false },
        { active: undefined, expected: true }, // Valor por defecto
      ];

      for (const testCase of cases) {
        const supplierData: SaveSupplierDTO = {
          name: "Test Supplier",
          phone: "+50312345678",
          email: "test@supplier.com",
          ...(testCase.active !== undefined && { active: testCase.active }),
        };

        mockRepository.save.mockResolvedValue({} as Supplier);

        await supplierService.save(supplierData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            active: testCase.expected,
          })
        );
      }
    });
  });
});