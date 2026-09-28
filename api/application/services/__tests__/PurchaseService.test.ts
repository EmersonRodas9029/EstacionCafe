import { Repository, Between } from "typeorm";
import { PurchaseService } from "../PurchaseService";
import { Purchase } from "../../../core/entities/Purchase";
import { SavePurchaseDTO } from "../../DTOs/PurchaseDTO";

// Mock TypeORM Between function
jest.mock("typeorm", () => ({
  ...jest.requireActual("typeorm"),
  Between: jest.fn((start, end) => ({ start, end })),
}));

describe("PurchaseService", () => {
  let purchaseService: PurchaseService;
  let mockRepository: jest.Mocked<Repository<Purchase>>;

  beforeEach(() => {
    // Crear mock del repositorio
    mockRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    // Crear instancia del servicio con el repositorio mock
    purchaseService = new PurchaseService(mockRepository);

    // Limpiar console.log
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("debería guardar una compra exitosamente", async () => {
      const purchaseData: SavePurchaseDTO = {
        date: new Date("2025-10-20T10:30:00"),
        cashRegister: 1,
        supplierId: 2,
        total: 250.50,
      };

      const savedPurchase = {
        purchaseId: 1,
        date: new Date("2025-10-20T10:30:00"),
        cashRegister: 1,
        supplierId: 2,
        total: 250.50,
        supplier: { supplierId: 2, name: "Proveedor Test" },
      } as Purchase;

      mockRepository.save.mockResolvedValue(savedPurchase);

      const result = await purchaseService.save(purchaseData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          date: new Date("2025-10-20T10:30:00"),
          cashRegister: 1,
          supplierId: 2,
          total: 250.50,
        })
      );
      expect(result).toEqual(savedPurchase);
    });

    it("debería crear una entidad Purchase con los datos correctos", async () => {
      const purchaseData: SavePurchaseDTO = {
        date: new Date("2025-10-20T15:45:00"),
        cashRegister: 3,
        supplierId: 5,
        total: 180.75,
      };

      let savedEntity: any;
      mockRepository.save.mockImplementation((purchase) => {
        savedEntity = purchase;
        return Promise.resolve({ purchaseId: 1, ...purchase } as Purchase);
      });

      await purchaseService.save(purchaseData);

      expect(savedEntity).toBeInstanceOf(Purchase);
      expect(savedEntity.date).toEqual(new Date("2025-10-20T15:45:00"));
      expect(savedEntity.cashRegister).toBe(3);
      expect(savedEntity.supplierId).toBe(5);
      expect(savedEntity.total).toBe(180.75);
    });

    it("debería manejar diferentes proveedores y cajas", async () => {
      const casos = [
        { supplierId: 1, cashRegister: 1, total: 100.00 },
        { supplierId: 5, cashRegister: 2, total: 500.50 },
        { supplierId: 10, cashRegister: 3, total: 75.25 },
      ];

      for (const caso of casos) {
        const purchaseData: SavePurchaseDTO = {
          date: new Date(),
          ...caso,
        };

        mockRepository.save.mockResolvedValue({} as Purchase);

        await purchaseService.save(purchaseData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            supplierId: caso.supplierId,
            cashRegister: caso.cashRegister,
            total: caso.total,
          })
        );
      }
    });

    it("debería manejar totales con decimales precisos", async () => {
      const purchaseData: SavePurchaseDTO = {
        date: new Date(),
        cashRegister: 1,
        supplierId: 1,
        total: 999.99,
      };

      mockRepository.save.mockResolvedValue({} as Purchase);

      await purchaseService.save(purchaseData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 999.99,
        })
      );
    });

    it("debería manejar errores del repositorio", async () => {
      const purchaseData: SavePurchaseDTO = {
        date: new Date(),
        cashRegister: 1,
        supplierId: 1,
        total: 100.00,
      };

      const repositoryError = new Error("Error de base de datos");
      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(purchaseService.save(purchaseData)).rejects.toThrow("Error de base de datos");
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("saveAll", () => {
    it("debería guardar múltiples compras exitosamente", async () => {
      const purchasesData = [
        {
          date: new Date("2025-10-20"),
          cashRegister: 1,
          supplierId: 1,
          total: 150.00,
        },
        {
          date: new Date("2025-10-21"),
          cashRegister: 2,
          supplierId: 2,
          total: 200.50,
        },
      ];

      const savedPurchases = [
        { purchaseId: 1, ...purchasesData[0] },
        { purchaseId: 2, ...purchasesData[1] },
      ] as Purchase[];

      mockRepository.save.mockResolvedValue(savedPurchases as any);

      const result = await purchaseService.saveAll(purchasesData);

      expect(mockRepository.save).toHaveBeenCalledWith(purchasesData);
      expect(result).toEqual(savedPurchases);
    });

    it("debería manejar array vacío", async () => {
      mockRepository.save.mockResolvedValue([] as any);

      const result = await purchaseService.saveAll([]);

      expect(mockRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it("debería manejar errores del repositorio", async () => {
      const purchasesData = [{ date: new Date(), cashRegister: 1, supplierId: 1, total: 100 }];
      const repositoryError = new Error("Error al guardar múltiples compras");

      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(purchaseService.saveAll(purchasesData)).rejects.toThrow("Error al guardar múltiples compras");
    });
  });

  describe("delete", () => {
    it("debería eliminar una compra exitosamente", async () => {
      const purchaseId = 1;
      const deleteResult = { affected: 1 };

      mockRepository.delete.mockResolvedValue(deleteResult as any);

      const result = await purchaseService.delete(purchaseId);

      expect(mockRepository.delete).toHaveBeenCalledWith(purchaseId);
      expect(result).toEqual({
        message: "Compra eliminada correctamente",
        id: purchaseId,
      });
    });

    it("debería lanzar error cuando la compra no existe", async () => {
      const purchaseId = 999;
      const deleteResult = { affected: 0 };

      mockRepository.delete.mockResolvedValue(deleteResult as any);

      await expect(purchaseService.delete(purchaseId)).rejects.toThrow(
        `Compra con ID ${purchaseId} no encontrada`
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(purchaseId);
    });

    it("debería manejar errores del repositorio", async () => {
      const purchaseId = 1;
      const repositoryError = new Error("Error de eliminación");

      mockRepository.delete.mockRejectedValue(repositoryError);

      await expect(purchaseService.delete(purchaseId)).rejects.toThrow("Error de eliminación");
      expect(mockRepository.delete).toHaveBeenCalledWith(purchaseId);
    });
  });

  describe("update", () => {
    it("debería actualizar una compra exitosamente", async () => {
      const updateData = {
        purchaseId: 1,
        total: 300.00,
        cashRegister: 2,
      };

      const existingPurchase = {
        purchaseId: 1,
        date: new Date("2025-10-20"),
        cashRegister: 1,
        supplierId: 2,
        total: 250.00,
      } as Purchase;

      const updatedPurchase = {
        ...existingPurchase,
        total: 300.00,
        cashRegister: 2,
      } as Purchase;

      mockRepository.findOne.mockResolvedValue(existingPurchase);
      mockRepository.save.mockResolvedValue(updatedPurchase);

      const result = await purchaseService.update(updateData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { purchaseId: 1 },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 300.00,
          cashRegister: 2,
          supplierId: 2, // No cambió
        })
      );
      expect(result).toEqual(updatedPurchase);
    });

    it("debería actualizar solo los campos proporcionados", async () => {
      const updateData = {
        purchaseId: 1,
        date: new Date("2025-10-25"),
      };

      const existingPurchase = {
        purchaseId: 1,
        date: new Date("2025-10-20"),
        cashRegister: 1,
        supplierId: 2,
        total: 250.00,
      } as Purchase;

      mockRepository.findOne.mockResolvedValue(existingPurchase);
      mockRepository.save.mockResolvedValue(existingPurchase);

      await purchaseService.update(updateData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          date: new Date("2025-10-25"), // Cambió
          cashRegister: 1, // No cambió
          supplierId: 2, // No cambió
          total: 250.00, // No cambió
        })
      );
    });

    it("debería lanzar error cuando no se proporciona purchaseId", async () => {
      const updateData = {
        total: 300.00,
      };

      await expect(purchaseService.update(updateData)).rejects.toThrow(
        "purchaseId es requerido para actualizar"
      );
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it("debería lanzar error cuando la compra no existe", async () => {
      const updateData = {
        purchaseId: 999,
        total: 300.00,
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(purchaseService.update(updateData)).rejects.toThrow(
        "Compra con ID 999 no encontrada"
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería manejar errores del repositorio", async () => {
      const updateData = {
        purchaseId: 1,
        total: 300.00,
      };

      const repositoryError = new Error("Error de actualización");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(purchaseService.update(updateData)).rejects.toThrow("Error de actualización");
    });
  });

  describe("getAll", () => {
    it("debería obtener todas las compras con relaciones y orden", async () => {
      const mockPurchases = [
        {
          purchaseId: 2,
          date: new Date("2025-10-21"),
          cashRegister: 1,
          supplierId: 1,
          total: 200.00,
          supplier: { supplierId: 1, name: "Proveedor A" },
        },
        {
          purchaseId: 1,
          date: new Date("2025-10-20"),
          cashRegister: 2,
          supplierId: 2,
          total: 150.00,
          supplier: { supplierId: 2, name: "Proveedor B" },
        },
      ] as Purchase[];

      mockRepository.find.mockResolvedValue(mockPurchases);

      const result = await purchaseService.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ["supplier"],
        order: { date: "DESC" },
      });
      expect(result).toEqual(mockPurchases);
      expect(result).toHaveLength(2);
    });

    it("debería retornar array vacío cuando no hay compras", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await purchaseService.getAll();

      expect(result).toEqual([]);
    });

    it("debería manejar errores del repositorio", async () => {
      const repositoryError = new Error("Error de consulta");
      mockRepository.find.mockRejectedValue(repositoryError);

      await expect(purchaseService.getAll()).rejects.toThrow("Error de consulta");
    });
  });

  describe("getById", () => {
    it("debería obtener una compra por ID con relaciones", async () => {
      const purchaseId = 1;
      const mockPurchase = {
        purchaseId: 1,
        date: new Date("2025-10-20"),
        cashRegister: 1,
        supplierId: 2,
        total: 275.50,
        supplier: { supplierId: 2, name: "Café Premium S.A." },
      } as Purchase;

      mockRepository.findOne.mockResolvedValue(mockPurchase);

      const result = await purchaseService.getById(purchaseId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { purchaseId: 1 },
        relations: ["supplier"],
      });
      expect(result).toEqual(mockPurchase);
    });

    it("debería lanzar error cuando la compra no existe", async () => {
      const purchaseId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(purchaseService.getById(purchaseId)).rejects.toThrow(
        `Compra con ID ${purchaseId} no encontrada`
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { purchaseId: 999 },
        relations: ["supplier"],
      });
    });

    it("debería manejar errores del repositorio", async () => {
      const purchaseId = 1;
      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(purchaseService.getById(purchaseId)).rejects.toThrow("Error de consulta");
    });
  });

  describe("getBySupplier", () => {
    it("debería obtener compras por proveedor", async () => {
      const supplierId = 2;
      const mockPurchases = [
        {
          purchaseId: 3,
          date: new Date("2025-10-21"),
          cashRegister: 1,
          supplierId: 2,
          total: 300.00,
          supplier: { supplierId: 2, name: "Proveedor Principal" },
        },
        {
          purchaseId: 1,
          date: new Date("2025-10-20"),
          cashRegister: 2,
          supplierId: 2,
          total: 150.00,
          supplier: { supplierId: 2, name: "Proveedor Principal" },
        },
      ] as Purchase[];

      mockRepository.find.mockResolvedValue(mockPurchases);

      const result = await purchaseService.getBySupplier(supplierId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { supplierId: 2 },
        relations: ["supplier"],
        order: { date: "DESC" },
      });
      expect(result).toEqual(mockPurchases);
      expect(result.every(p => p.supplierId === supplierId)).toBe(true);
    });

    it("debería retornar array vacío para proveedor sin compras", async () => {
      const supplierId = 999;
      mockRepository.find.mockResolvedValue([]);

      const result = await purchaseService.getBySupplier(supplierId);

      expect(result).toEqual([]);
    });

    it("debería manejar errores del repositorio", async () => {
      const supplierId = 1;
      const repositoryError = new Error("Error de consulta por proveedor");
      mockRepository.find.mockRejectedValue(repositoryError);

      await expect(purchaseService.getBySupplier(supplierId)).rejects.toThrow("Error de consulta por proveedor");
    });
  });

  describe("getByDateRange", () => {
    it("debería obtener compras por rango de fechas", async () => {
      const startDate = new Date("2025-10-20");
      const endDate = new Date("2025-10-22");
      
      const mockPurchases = [
        {
          purchaseId: 2,
          date: new Date("2025-10-21"),
          cashRegister: 1,
          supplierId: 1,
          total: 200.00,
          supplier: { supplierId: 1, name: "Proveedor A" },
        },
        {
          purchaseId: 1,
          date: new Date("2025-10-20"),
          cashRegister: 2,
          supplierId: 2,
          total: 150.00,
          supplier: { supplierId: 2, name: "Proveedor B" },
        },
      ] as Purchase[];

      mockRepository.find.mockResolvedValue(mockPurchases);

      const result = await purchaseService.getByDateRange(startDate, endDate);

      expect(Between).toHaveBeenCalledWith(startDate, endDate);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          date: { start: startDate, end: endDate },
        },
        relations: ["supplier"],
        order: { date: "DESC" },
      });
      expect(result).toEqual(mockPurchases);
    });

    it("debería retornar array vacío para rango sin compras", async () => {
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-02");
      
      mockRepository.find.mockResolvedValue([]);

      const result = await purchaseService.getByDateRange(startDate, endDate);

      expect(result).toEqual([]);
    });

    it("debería manejar errores del repositorio", async () => {
      const startDate = new Date("2025-10-20");
      const endDate = new Date("2025-10-22");
      const repositoryError = new Error("Error de consulta por rango de fechas");
      
      mockRepository.find.mockRejectedValue(repositoryError);

      await expect(purchaseService.getByDateRange(startDate, endDate)).rejects.toThrow("Error de consulta por rango de fechas");
    });
  });

  describe("Casos de integración", () => {
    it("debería manejar flujo completo de CRUD", async () => {
      const purchaseData: SavePurchaseDTO = {
        date: new Date("2025-10-20T12:00:00"),
        cashRegister: 1,
        supplierId: 3,
        total: 425.75,
      };

      const savedPurchase = {
        purchaseId: 10,
        ...purchaseData,
        supplier: { supplierId: 3, name: "Proveedor Integración" },
      } as Purchase;

      const updateData = {
        purchaseId: 10,
        total: 450.00,
      };

      const updatedPurchase = {
        ...savedPurchase,
        total: 450.00,
      } as Purchase;

      // 1. Guardar compra
      mockRepository.save.mockResolvedValueOnce(savedPurchase);
      const saveResult = await purchaseService.save(purchaseData);
      expect(saveResult).toEqual(savedPurchase);

      // 2. Obtener por ID
      mockRepository.findOne.mockResolvedValueOnce(savedPurchase);
      const getResult = await purchaseService.getById(10);
      expect(getResult).toEqual(savedPurchase);

      // 3. Actualizar
      mockRepository.findOne.mockResolvedValueOnce(savedPurchase);
      mockRepository.save.mockResolvedValueOnce(updatedPurchase);
      const updateResult = await purchaseService.update(updateData);
      expect(updateResult).toEqual(updatedPurchase);

      // 4. Obtener por proveedor
      mockRepository.find.mockResolvedValueOnce([updatedPurchase]);
      const getBySupplierResult = await purchaseService.getBySupplier(3);
      expect(getBySupplierResult).toContain(updatedPurchase);

      // 5. Eliminar
      mockRepository.delete.mockResolvedValueOnce({ affected: 1 } as any);
      const deleteResult = await purchaseService.delete(10);
      expect(deleteResult.message).toBe("Compra eliminada correctamente");
    });

    it("debería manejar múltiples compras de diferentes proveedores", async () => {
      const compras = [
        { supplierId: 1, total: 100.00, cashRegister: 1 },
        { supplierId: 2, total: 200.50, cashRegister: 2 },
        { supplierId: 3, total: 350.75, cashRegister: 1 },
      ];

      for (let i = 0; i < compras.length; i++) {
        const purchaseData: SavePurchaseDTO = {
          date: new Date(`2025-10-2${i + 1}`),
          ...compras[i],
        };

        const savedPurchase = {
          purchaseId: i + 1,
          ...purchaseData,
          supplier: { supplierId: compras[i].supplierId, name: `Proveedor ${compras[i].supplierId}` },
        } as Purchase;

        mockRepository.save.mockResolvedValueOnce(savedPurchase);

        const result = await purchaseService.save(purchaseData);
        expect(result.supplierId).toBe(compras[i].supplierId);
        expect(result.total).toBe(compras[i].total);
      }
    });

    it("debería manejar consultas por rango de fechas amplio", async () => {
      const fechas = [
        new Date("2025-10-20"),
        new Date("2025-10-21"),
        new Date("2025-10-22"),
      ];

      const comprasEnRango = fechas.map((fecha, index) => ({
        purchaseId: index + 1,
        date: fecha,
        cashRegister: 1,
        supplierId: 1,
        total: (index + 1) * 100,
        supplier: { supplierId: 1, name: "Proveedor Regular" },
      })) as Purchase[];

      mockRepository.find.mockResolvedValue(comprasEnRango);

      const result = await purchaseService.getByDateRange(
        new Date("2025-10-20"),
        new Date("2025-10-23")
      );

      expect(result).toEqual(comprasEnRango);
      expect(result).toHaveLength(3);
      expect(result.every(c => c.supplierId === 1)).toBe(true);
    });
  });

  describe("Validaciones de datos", () => {
    it("debería manejar diferentes rangos de totales", async () => {
      const totales = [0.01, 50.00, 500.50, 1000.00, 9999.99];

      for (const total of totales) {
        const purchaseData: SavePurchaseDTO = {
          date: new Date(),
          cashRegister: 1,
          supplierId: 1,
          total: total,
        };

        mockRepository.save.mockResolvedValue({} as Purchase);

        await purchaseService.save(purchaseData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            total: total,
          })
        );
      }
    });

    it("debería manejar diferentes fechas", async () => {
      const fechas = [
        new Date("2025-01-01T00:00:00"),
        new Date("2025-06-15T12:30:00"),
        new Date("2025-10-20T23:59:59"),
        new Date("2025-12-31T18:00:00"),
      ];

      for (const fecha of fechas) {
        const purchaseData: SavePurchaseDTO = {
          date: fecha,
          cashRegister: 1,
          supplierId: 1,
          total: 100.00,
        };

        mockRepository.save.mockResolvedValue({} as Purchase);

        await purchaseService.save(purchaseData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            date: fecha,
          })
        );
      }
    });

    it("debería manejar diferentes IDs de proveedor", async () => {
      const proveedores = [1, 5, 10, 99, 100, 999];

      for (const supplierId of proveedores) {
        const purchaseData: SavePurchaseDTO = {
          date: new Date(),
          cashRegister: 1,
          supplierId: supplierId,
          total: 100.00,
        };

        mockRepository.save.mockResolvedValue({} as Purchase);

        await purchaseService.save(purchaseData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            supplierId: supplierId,
          })
        );
      }
    });

    it("debería manejar diferentes cajas registradoras", async () => {
      const cajas = [1, 2, 3, 5, 10, 99];

      for (const cashRegister of cajas) {
        const purchaseData: SavePurchaseDTO = {
          date: new Date(),
          cashRegister: cashRegister,
          supplierId: 1,
          total: 100.00,
        };

        mockRepository.save.mockResolvedValue({} as Purchase);

        await purchaseService.save(purchaseData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            cashRegister: cashRegister,
          })
        );
      }
    });
  });
});