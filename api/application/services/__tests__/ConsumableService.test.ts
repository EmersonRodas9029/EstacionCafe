import { ConsumableService } from "../ConsumableService";
import { Repository } from "typeorm";
import { Consumable } from "../../../core/entities/Consumable";
import { SaveConsumableDTO, UpdateConsumableDTO, ConsumableItemDTO } from "../../DTOs/ConsumableDTO";
import { UnitMeasurement } from "../../../core/enums/UnitMeasurement";

describe("ConsumableService", () => {
  let consumableService: ConsumableService;
  let mockRepository: jest.Mocked<Repository<Consumable>>;

  beforeEach(() => {
    // Create mock repository with all necessary methods
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Consumable>>;

    consumableService = new ConsumableService(mockRepository);

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("should save a consumable successfully", async () => {
      const saveConsumableDTO: SaveConsumableDTO = {
        supplierId: 1,
        name: "Café Molido",
        cosumableTypeId: 1,
        cost: 15.50,
        quantity: 100,
        unitMeasurement: UnitMeasurement.KILOGRAM,
      };

      const expectedConsumable = new Consumable();
      expectedConsumable.consumableId = 1;
      expectedConsumable.supplierId = saveConsumableDTO.supplierId;
      expectedConsumable.name = saveConsumableDTO.name;
      expectedConsumable.cosumableTypeId = saveConsumableDTO.cosumableTypeId;
      expectedConsumable.cost = saveConsumableDTO.cost;
      expectedConsumable.quantity = saveConsumableDTO.quantity;
      expectedConsumable.unitMeasurement = saveConsumableDTO.unitMeasurement;

      mockRepository.save.mockResolvedValue(expectedConsumable);

      const result = await consumableService.save(saveConsumableDTO);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        supplierId: saveConsumableDTO.supplierId,
        name: saveConsumableDTO.name,
        cosumableTypeId: saveConsumableDTO.cosumableTypeId,
        cost: saveConsumableDTO.cost,
        quantity: saveConsumableDTO.quantity,
        unitMeasurement: saveConsumableDTO.unitMeasurement,
      }));
      expect(result).toEqual(expectedConsumable);
    });

    it("should handle database errors during save", async () => {
      const saveConsumableDTO: SaveConsumableDTO = {
        supplierId: 1,
        name: "Café Molido",
        cosumableTypeId: 1,
        cost: 15.50,
        quantity: 100,
        unitMeasurement: UnitMeasurement.KILOGRAM,
      };

      const databaseError = new Error("Database connection failed");
      mockRepository.save.mockRejectedValue(databaseError);

      await expect(consumableService.save(saveConsumableDTO)).rejects.toThrow("Database connection failed");
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveAll", () => {
    it("should save multiple consumables successfully", async () => {
      const saveConsumableDTOs: SaveConsumableDTO[] = [
        {
          supplierId: 1,
          name: "Café Molido",
          cosumableTypeId: 1,
          cost: 15.50,
          quantity: 100,
          unitMeasurement: UnitMeasurement.KILOGRAM,
        },
        {
          supplierId: 2,
          name: "Leche",
          cosumableTypeId: 2,
          cost: 2.75,
          quantity: 50,
          unitMeasurement: UnitMeasurement.LITER,
        },
      ];

      const expectedConsumables = saveConsumableDTOs.map((dto, index) => {
        const consumable = new Consumable();
        consumable.consumableId = index + 1;
        consumable.supplierId = dto.supplierId;
        consumable.name = dto.name;
        consumable.cosumableTypeId = dto.cosumableTypeId;
        consumable.cost = dto.cost;
        consumable.quantity = dto.quantity;
        consumable.unitMeasurement = dto.unitMeasurement;
        return consumable;
      });

      mockRepository.save.mockResolvedValue(expectedConsumables as any);

      const result = await consumableService.saveAll(saveConsumableDTOs);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          supplierId: saveConsumableDTOs[0].supplierId,
          name: saveConsumableDTOs[0].name,
          cosumableTypeId: saveConsumableDTOs[0].cosumableTypeId,
        }),
        expect.objectContaining({
          supplierId: saveConsumableDTOs[1].supplierId,
          name: saveConsumableDTOs[1].name,
          cosumableTypeId: saveConsumableDTOs[1].cosumableTypeId,
        }),
      ]));
      expect(result).toEqual(expectedConsumables);
    });

    it("should handle empty array input", async () => {
      const saveConsumableDTOs: SaveConsumableDTO[] = [];
      const expectedConsumables: Consumable[] = [];

      mockRepository.save.mockResolvedValue(expectedConsumables as any);

      const result = await consumableService.saveAll(saveConsumableDTOs);

      expect(mockRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual(expectedConsumables);
    });

    it("should handle database errors during saveAll", async () => {
      const saveConsumableDTOs: SaveConsumableDTO[] = [
        {
          supplierId: 1,
          name: "Café Molido",
          cosumableTypeId: 1,
          cost: 15.50,
          quantity: 100,
          unitMeasurement: UnitMeasurement.KILOGRAM,
        },
      ];

      const databaseError = new Error("Database connection failed");
      mockRepository.save.mockRejectedValue(databaseError);

      await expect(consumableService.saveAll(saveConsumableDTOs)).rejects.toThrow("Database connection failed");
    });
  });

  describe("getById", () => {
    it("should get a consumable by id successfully", async () => {
      const consumableId = 1;
      const expectedConsumable = new Consumable();
      expectedConsumable.consumableId = consumableId;
      expectedConsumable.name = "Café Molido";
      expectedConsumable.supplierId = 1;
      expectedConsumable.cosumableTypeId = 1;
      expectedConsumable.cost = 15.50;
      expectedConsumable.quantity = 100;
      expectedConsumable.unitMeasurement = UnitMeasurement.KILOGRAM;

      mockRepository.findOne.mockResolvedValue(expectedConsumable);

      const result = await consumableService.getById(consumableId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { consumableId },
        relations: ["consumableType", "supplier"],
      });
      expect(result).toEqual(expectedConsumable);
    });

    it("should throw error when consumable not found", async () => {
      const consumableId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(consumableService.getById(consumableId)).rejects.toThrow(`Consumible con ID ${consumableId} no encontrado`);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { consumableId },
        relations: ["consumableType", "supplier"],
      });
    });

    it("should handle database errors during getById", async () => {
      const consumableId = 1;
      const databaseError = new Error("Database connection failed");
      mockRepository.findOne.mockRejectedValue(databaseError);

      await expect(consumableService.getById(consumableId)).rejects.toThrow("Database connection failed");
    });
  });

  describe("getAll", () => {
    it("should get all consumables successfully and map to ConsumableItemDTO", async () => {
      const mockConsumables = [
        {
          consumableId: 1,
          name: "Café Molido",
          supplierId: 1,
          cosumableTypeId: 1,
          cost: 15.50,
          quantity: 100,
          unitMeasurement: UnitMeasurement.KILOGRAM,
          active: true,
          consumableType: { consumableTypeId: 1, name: "Bebidas" },
          supplier: { supplierId: 1, name: "Proveedor 1", email: "test@test.com", phone: "123456789" },
        },
        {
          consumableId: 2,
          name: "Leche",
          supplierId: 2,
          cosumableTypeId: 2,
          cost: 2.75,
          quantity: 50,
          unitMeasurement: UnitMeasurement.LITER,
          active: true,
          consumableType: { consumableTypeId: 2, name: "Lácteos" },
          supplier: { supplierId: 2, name: "Proveedor 2", email: "test2@test.com", phone: "987654321" },
        },
      ] as Consumable[];

      mockRepository.find.mockResolvedValue(mockConsumables);

      const result = await consumableService.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ["consumableType", "supplier"],
        order: { name: "ASC" },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        consumableId: 1,
        name: "Café Molido",
        supplierId: 1,
        cosumableTypeId: 1,
        cost: 15.50,
        quantity: 100,
        unitMeasurement: UnitMeasurement.KILOGRAM,
        active: true,
        consumableType: { consumableTypeId: 1, name: "Bebidas" },
        supplier: { supplierId: 1, name: "Proveedor 1", email: "test@test.com", phone: "123456789" },
      }));
    });

    it("should return empty array when no consumables found", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await consumableService.getAll();

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it("should handle database errors during getAll", async () => {
      const databaseError = new Error("Database connection failed");
      mockRepository.find.mockRejectedValue(databaseError);

      await expect(consumableService.getAll()).rejects.toThrow("Database connection failed");
    });
  });

  describe("update", () => {
    it("should update a consumable successfully", async () => {
      const updateConsumableDTO: UpdateConsumableDTO = {
        consumableId: 1,
        name: "Café Molido Premium",
        cost: 18.00,
        quantity: 150,
      };

      const existingConsumable = new Consumable();
      existingConsumable.consumableId = 1;
      existingConsumable.name = "Café Molido";
      existingConsumable.supplierId = 1;
      existingConsumable.cosumableTypeId = 1;
      existingConsumable.cost = 15.50;
      existingConsumable.quantity = 100;
      existingConsumable.unitMeasurement = UnitMeasurement.KILOGRAM;

      const updatedConsumable = { ...existingConsumable };
      updatedConsumable.name = updateConsumableDTO.name!;
      updatedConsumable.cost = updateConsumableDTO.cost!;
      updatedConsumable.quantity = updateConsumableDTO.quantity!;

      mockRepository.findOne.mockResolvedValue(existingConsumable);
      mockRepository.save.mockResolvedValue(updatedConsumable);

      const result = await consumableService.update(updateConsumableDTO);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { consumableId: updateConsumableDTO.consumableId },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        consumableId: updateConsumableDTO.consumableId,
        name: updateConsumableDTO.name,
        cost: updateConsumableDTO.cost,
        quantity: updateConsumableDTO.quantity,
      }));
      expect(result).toEqual(updatedConsumable);
    });

    it("should update only specified fields", async () => {
      const updateConsumableDTO: UpdateConsumableDTO = {
        consumableId: 1,
        supplier: 2,
        TypeId: 3,
        unitMeasurement: UnitMeasurement.GRAM,
      };

      const existingConsumable = new Consumable();
      existingConsumable.consumableId = 1;
      existingConsumable.name = "Café Molido";
      existingConsumable.supplierId = 1;
      existingConsumable.cosumableTypeId = 1;
      existingConsumable.cost = 15.50;
      existingConsumable.quantity = 100;
      existingConsumable.unitMeasurement = UnitMeasurement.KILOGRAM;

      const updatedConsumable = { ...existingConsumable };
      updatedConsumable.supplierId = 2;
      updatedConsumable.cosumableTypeId = 3;
      updatedConsumable.unitMeasurement = UnitMeasurement.GRAM;

      mockRepository.findOne.mockResolvedValue(existingConsumable);
      mockRepository.save.mockResolvedValue(updatedConsumable);

      const result = await consumableService.update(updateConsumableDTO);

      expect(result.supplierId).toBe(2);
      expect(result.cosumableTypeId).toBe(3);
      expect(result.unitMeasurement).toBe(UnitMeasurement.GRAM);
      expect(result.name).toBe("Café Molido"); // Should remain unchanged
    });

    it("should throw error when consumableId is not provided", async () => {
      const updateConsumableDTO: UpdateConsumableDTO = {
        name: "Café Molido Premium",
        cost: 18.00,
      };

      await expect(consumableService.update(updateConsumableDTO)).rejects.toThrow("consumableId es requerido para actualizar");
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should throw error when consumable not found for update", async () => {
      const updateConsumableDTO: UpdateConsumableDTO = {
        consumableId: 999,
        name: "Café Inexistente",
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(consumableService.update(updateConsumableDTO)).rejects.toThrow(`Consumible con ID ${updateConsumableDTO.consumableId} no encontrado`);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { consumableId: updateConsumableDTO.consumableId },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should handle database errors during update", async () => {
      const updateConsumableDTO: UpdateConsumableDTO = {
        consumableId: 1,
        name: "Café Molido Premium",
      };

      const databaseError = new Error("Database connection failed");
      mockRepository.findOne.mockRejectedValue(databaseError);

      await expect(consumableService.update(updateConsumableDTO)).rejects.toThrow("Database connection failed");
    });
  });

  describe("delete", () => {
    it("should deactivate a consumable successfully (soft delete)", async () => {
      const consumableId = 1;
      const existingConsumable = new Consumable();
      existingConsumable.consumableId = consumableId;
      existingConsumable.name = "Café Molido";
      existingConsumable.active = true;

      const deactivatedConsumable = { ...existingConsumable, active: false };

      // Mock getById call within delete method
      mockRepository.findOne.mockResolvedValue(existingConsumable);
      mockRepository.save.mockResolvedValue(deactivatedConsumable);

      const result = await consumableService.delete(consumableId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { consumableId },
        relations: ["consumableType", "supplier"],
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        active: false,
      }));
      expect(result).toEqual({
        message: "Consumible desactivado correctamente",
        id: consumableId,
      });
    });

    it("should throw error when consumable not found for deletion", async () => {
      const consumableId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(consumableService.delete(consumableId)).rejects.toThrow(`Consumible con ID ${consumableId} no encontrado`);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { consumableId },
        relations: ["consumableType", "supplier"],
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should handle database errors during delete", async () => {
      const consumableId = 1;
      const databaseError = new Error("Database connection failed");
      mockRepository.findOne.mockRejectedValue(databaseError);

      await expect(consumableService.delete(consumableId)).rejects.toThrow("Database connection failed");
    });
  });

  describe("getBySupplier", () => {
    it("should get consumables by supplier successfully", async () => {
      const supplierId = 1;
      const expectedConsumables = [
        {
          consumableId: 1,
          name: "Café Molido",
          supplierId: supplierId,
          cosumableTypeId: 1,
          cost: 15.50,
          quantity: 100,
          unitMeasurement: UnitMeasurement.KILOGRAM,
        },
        {
          consumableId: 3,
          name: "Azúcar",
          supplierId: supplierId,
          cosumableTypeId: 2,
          cost: 3.25,
          quantity: 50,
          unitMeasurement: UnitMeasurement.KILOGRAM,
        },
      ] as Consumable[];

      mockRepository.find.mockResolvedValue(expectedConsumables);

      const result = await consumableService.getBySupplier(supplierId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { supplierId },
        relations: ["consumableType", "supplier"],
        order: { name: "ASC" },
      });
      expect(result).toEqual(expectedConsumables);
    });

    it("should return empty array when supplier has no consumables", async () => {
      const supplierId = 999;
      mockRepository.find.mockResolvedValue([]);

      const result = await consumableService.getBySupplier(supplierId);

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { supplierId },
        relations: ["consumableType", "supplier"],
        order: { name: "ASC" },
      });
    });

    it("should handle database errors during getBySupplier", async () => {
      const supplierId = 1;
      const databaseError = new Error("Database connection failed");
      mockRepository.find.mockRejectedValue(databaseError);

      await expect(consumableService.getBySupplier(supplierId)).rejects.toThrow("Database connection failed");
    });
  });

  describe("getByConsumableType", () => {
    it("should get consumables by consumable type successfully", async () => {
      const consumableTypeId = 1;
      const expectedConsumables = [
        {
          consumableId: 1,
          name: "Café Molido",
          supplierId: 1,
          cosumableTypeId: consumableTypeId,
          cost: 15.50,
          quantity: 100,
          unitMeasurement: UnitMeasurement.KILOGRAM,
        },
        {
          consumableId: 2,
          name: "Café en Grano",
          supplierId: 2,
          cosumableTypeId: consumableTypeId,
          cost: 20.00,
          quantity: 75,
          unitMeasurement: UnitMeasurement.KILOGRAM,
        },
      ] as Consumable[];

      mockRepository.find.mockResolvedValue(expectedConsumables);

      const result = await consumableService.getByConsumableType(consumableTypeId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { cosumableTypeId: consumableTypeId },
        relations: ["consumableType", "supplier"],
        order: { name: "ASC" },
      });
      expect(result).toEqual(expectedConsumables);
    });

    it("should return empty array when consumable type has no consumables", async () => {
      const consumableTypeId = 999;
      mockRepository.find.mockResolvedValue([]);

      const result = await consumableService.getByConsumableType(consumableTypeId);

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { cosumableTypeId: consumableTypeId },
        relations: ["consumableType", "supplier"],
        order: { name: "ASC" },
      });
    });

    it("should handle database errors during getByConsumableType", async () => {
      const consumableTypeId = 1;
      const databaseError = new Error("Database connection failed");
      mockRepository.find.mockRejectedValue(databaseError);

      await expect(consumableService.getByConsumableType(consumableTypeId)).rejects.toThrow("Database connection failed");
    });
  });

  describe("getLowStockConsumables", () => {
    it("should get low stock consumables with default threshold", async () => {
      const lowStockConsumables = [
        {
          consumableId: 1,
          name: "Café Molido",
          supplierId: 1,
          cosumableTypeId: 1,
          cost: 15.50,
          quantity: 5,
          unitMeasurement: UnitMeasurement.KILOGRAM,
        },
        {
          consumableId: 2,
          name: "Azúcar",
          supplierId: 2,
          cosumableTypeId: 2,
          cost: 3.25,
          quantity: 8,
          unitMeasurement: UnitMeasurement.KILOGRAM,
        },
      ] as Consumable[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(lowStockConsumables),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await consumableService.getLowStockConsumables();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("consumable");
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("consumable.consumableType", "consumableType");
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("consumable.supplier", "supplier");
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("consumable.quantity <= :threshold", { threshold: 10 });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith("consumable.quantity", "ASC");
      expect(result).toEqual(lowStockConsumables);
    });

    it("should get low stock consumables with custom threshold", async () => {
      const customThreshold = 20;
      const lowStockConsumables = [
        {
          consumableId: 1,
          name: "Café Molido",
          supplierId: 1,
          cosumableTypeId: 1,
          cost: 15.50,
          quantity: 15,
          unitMeasurement: UnitMeasurement.KILOGRAM,
        },
      ] as Consumable[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(lowStockConsumables),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await consumableService.getLowStockConsumables(customThreshold);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith("consumable.quantity <= :threshold", { threshold: customThreshold });
      expect(result).toEqual(lowStockConsumables);
    });

    it("should return empty array when no low stock consumables found", async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await consumableService.getLowStockConsumables();

      expect(result).toEqual([]);
    });

    it("should handle database errors during getLowStockConsumables", async () => {
      const databaseError = new Error("Database connection failed");

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(databaseError),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(consumableService.getLowStockConsumables()).rejects.toThrow("Database connection failed");
    });
  });
});
