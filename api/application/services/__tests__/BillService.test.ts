import { BillService } from "../BillService";
import { Repository } from "typeorm";
import { Bill } from "../../../core/entities/Bill";
import { SaveBillDTO, UpdateBillDTO } from "../../DTOs/BillsDTO";

describe("BillService", () => {
  let billService: BillService;
  let mockRepository: jest.Mocked<Repository<Bill>>;

  beforeEach(() => {
    // Create mock repository with all necessary methods
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Bill>>;

    billService = new BillService(mockRepository);

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("should save a bill successfully", async () => {
      const saveBillDTO: SaveBillDTO = {
        billId: 1,
        cashRegister: 1,
        customer: "Juan Pérez",
        tableId: "A1",
        total: 150.75,
        date: new Date("2025-10-20"),
      };

      const expectedBill = new Bill();
      expectedBill.billId = 1;
      expectedBill.cashRegisterId = saveBillDTO.cashRegister;
      expectedBill.customer = saveBillDTO.customer;
      expectedBill.total = saveBillDTO.total;
      expectedBill.date = saveBillDTO.date;

      mockRepository.save.mockResolvedValue(expectedBill);

      const result = await billService.save(saveBillDTO);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cashRegisterId: saveBillDTO.cashRegister,
          customer: saveBillDTO.customer,
          total: saveBillDTO.total,
          date: saveBillDTO.date,
        }),
      );
      expect(result).toEqual(expectedBill);
      expect(console.log).toHaveBeenCalledWith("Guardando factura...");
    });

    it("should handle database errors during save", async () => {
      const saveBillDTO: SaveBillDTO = {
        billId: 1,
        cashRegister: 1,
        customer: "Juan Pérez",
        tableId: "A1",
        total: 150.75,
        date: new Date("2025-10-20"),
      };

      const databaseError = new Error("Database connection failed");
      mockRepository.save.mockRejectedValue(databaseError);

      await expect(billService.save(saveBillDTO)).rejects.toThrow(
        "Database connection failed",
      );
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveAll", () => {
    it("should save multiple bills successfully", async () => {
      const saveBillDTOs: SaveBillDTO[] = [
        {
          billId: 1,
          cashRegister: 1,
          customer: "Juan Pérez",
          tableId: "A1",
          total: 150.75,
          date: new Date("2025-10-20"),
        },
        {
          billId: 2,
          cashRegister: 2,
          customer: "María García",
          tableId: "A1",
          total: 200.5,
          date: new Date("2025-10-21"),
        },
      ];

      const expectedBills = saveBillDTOs.map((dto) => {
        const bill = new Bill();
        bill.cashRegisterId = dto.cashRegister;
        bill.customer = dto.customer;
        bill.total = dto.total;
        bill.date = dto.date;
        return bill;
      });

      mockRepository.save.mockResolvedValue(expectedBills as any);

      const result = await billService.saveAll(saveBillDTOs);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            cashRegisterId: saveBillDTOs[0].cashRegister,
            customer: saveBillDTOs[0].customer,
            total: saveBillDTOs[0].total,
            date: saveBillDTOs[0].date,
          }),
          expect.objectContaining({
            cashRegisterId: saveBillDTOs[1].cashRegister,
            customer: saveBillDTOs[1].customer,
            total: saveBillDTOs[1].total,
            date: saveBillDTOs[1].date,
          }),
        ]),
      );
      expect(result).toEqual(expectedBills);
    });

    it("should handle empty array input", async () => {
      const saveBillDTOs: SaveBillDTO[] = [];
      const expectedBills: Bill[] = [];

      mockRepository.save.mockResolvedValue(expectedBills as any);

      const result = await billService.saveAll(saveBillDTOs);

      expect(mockRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual(expectedBills);
    });
  });

  describe("getById", () => {
    it("should get a bill by id successfully", async () => {
      const billId = 1;
      const expectedBill = new Bill();
      expectedBill.billId = billId;
      expectedBill.customer = "Juan Pérez";
      expectedBill.total = 150.75;

      mockRepository.findOne.mockResolvedValue(expectedBill);

      const result = await billService.getById(billId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { billId },
        relations: ["cashRegister", "table"],
      });
      expect(result).toEqual(expectedBill);
    });

    it("should throw error when bill not found", async () => {
      const billId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(billService.getById(billId)).rejects.toThrow(
        `Factura con ID ${billId} no encontrada`,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { billId },
        relations: ["cashRegister", "table"],
      });
    });

    it("should handle database errors during getById", async () => {
      const billId = 1;
      const databaseError = new Error("Database connection failed");
      mockRepository.findOne.mockRejectedValue(databaseError);

      await expect(billService.getById(billId)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("getAll", () => {
    it("should get all bills successfully", async () => {
      const expectedBills = [
        { billId: 1, customer: "Juan Pérez", total: 150.75 },
        { billId: 2, customer: "María García", total: 200.5 },
      ] as Bill[];

      mockRepository.find.mockResolvedValue(expectedBills);

      const result = await billService.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ["cashRegister", "table"],
        order: { date: "DESC" },
      });
      expect(result).toEqual(expectedBills);
      expect(console.log).toHaveBeenCalledWith("Obteniendo facturas...");
    });

    it("should handle database errors during getAll", async () => {
      const databaseError = new Error("Database connection failed");
      mockRepository.find.mockRejectedValue(databaseError);

      await expect(billService.getAll()).rejects.toThrow(
        "Database connection failed",
      );
      expect(console.log).toHaveBeenCalledWith(databaseError);
    });

    it("should return empty array when no bills found", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await billService.getAll();

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("should update a bill successfully", async () => {
      const updateBillDTO: UpdateBillDTO = {
        billId: 1,
        customer: "Juan Pérez Actualizado",
        total: 175.0,
      };

      const existingBill = new Bill();
      existingBill.billId = 1;
      existingBill.customer = "Juan Pérez";
      existingBill.total = 150.75;
      existingBill.cashRegisterId = 1;
      existingBill.date = new Date("2025-10-20");

      const updatedBill = { ...existingBill, ...updateBillDTO };

      mockRepository.findOne.mockResolvedValue(existingBill);
      mockRepository.save.mockResolvedValue(updatedBill);

      const result = await billService.update(updateBillDTO);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { billId: updateBillDTO.billId },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          billId: updateBillDTO.billId,
          customer: updateBillDTO.customer,
          total: updateBillDTO.total,
        }),
      );
      expect(result).toEqual(updatedBill);
    });

    it("should throw error when billId is not provided", async () => {
      const updateBillDTO: UpdateBillDTO = {
        customer: "Juan Pérez",
        total: 175.0,
      };

      await expect(billService.update(updateBillDTO)).rejects.toThrow(
        "billId es requerido para actualizar",
      );
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should throw error when bill not found for update", async () => {
      const updateBillDTO: UpdateBillDTO = {
        billId: 999,
        customer: "Juan Pérez",
        total: 175.0,
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(billService.update(updateBillDTO)).rejects.toThrow(
        `Factura con ID ${updateBillDTO.billId} no encontrada`,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { billId: updateBillDTO.billId },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should handle database errors during update", async () => {
      const updateBillDTO: UpdateBillDTO = {
        billId: 1,
        customer: "Juan Pérez",
      };

      const databaseError = new Error("Database connection failed");
      mockRepository.findOne.mockRejectedValue(databaseError);

      await expect(billService.update(updateBillDTO)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("delete", () => {
    it("should delete a bill successfully", async () => {
      const billId = 1;
      const deleteResult = { affected: 1, raw: {} };

      mockRepository.delete.mockResolvedValue(deleteResult);

      const result = await billService.delete(billId);

      expect(mockRepository.delete).toHaveBeenCalledWith(billId);
      expect(result).toEqual({
        message: "Factura eliminada correctamente",
        id: billId,
      });
    });

    it("should throw error when bill not found for deletion", async () => {
      const billId = 999;
      const deleteResult = { affected: 0, raw: {} };

      mockRepository.delete.mockResolvedValue(deleteResult);

      await expect(billService.delete(billId)).rejects.toThrow(
        `Factura con ID ${billId} no encontrada`,
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(billId);
    });

    it("should handle database errors during delete", async () => {
      const billId = 1;
      const databaseError = new Error("Database connection failed");
      mockRepository.delete.mockRejectedValue(databaseError);

      await expect(billService.delete(billId)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("getByDateRange", () => {
    it("should get bills by date range successfully", async () => {
      const startDate = new Date("2025-10-01");
      const endDate = new Date("2025-10-31");
      const expectedBills = [
        { billId: 1, customer: "Juan Pérez", date: new Date("2025-10-15") },
        { billId: 2, customer: "María García", date: new Date("2025-10-20") },
      ] as Bill[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(expectedBills),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await billService.getByDateRange(startDate, endDate);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("bill");
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "bill.cashRegister",
        "cashRegister",
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "bill.date >= :startDate",
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "bill.date <= :endDate",
        { endDate },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        "bill.date",
        "DESC",
      );
      expect(result).toEqual(expectedBills);
    });

    it("should return empty array when no bills in date range", async () => {
      const startDate = new Date("2025-12-01");
      const endDate = new Date("2025-12-31");

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await billService.getByDateRange(startDate, endDate);

      expect(result).toEqual([]);
    });

    it("should handle database errors during getByDateRange", async () => {
      const startDate = new Date("2025-10-01");
      const endDate = new Date("2025-10-31");
      const databaseError = new Error("Database connection failed");

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(databaseError),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await expect(
        billService.getByDateRange(startDate, endDate),
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("getBillsByCustomer", () => {
    it("should get bills by customer successfully", async () => {
      const customerName = "Juan Pérez";
      const expectedBills = [
        { billId: 1, customer: customerName, total: 150.75 },
        { billId: 3, customer: customerName, total: 75.25 },
      ] as Bill[];

      mockRepository.find.mockResolvedValue(expectedBills);

      const result = await billService.getBillsByCustomer(customerName);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { customer: customerName },
        relations: ["cashRegister", "table"],
        order: { date: "DESC" },
      });
      expect(result).toEqual(expectedBills);
    });

    it("should return empty array when customer has no bills", async () => {
      const customerName = "Cliente Sin Facturas";
      mockRepository.find.mockResolvedValue([]);

      const result = await billService.getBillsByCustomer(customerName);

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { customer: customerName },
        relations: ["cashRegister", "table"],
        order: { date: "DESC" },
      });
    });

    it("should handle database errors during getBillsByCustomer", async () => {
      const customerName = "Juan Pérez";
      const databaseError = new Error("Database connection failed");
      mockRepository.find.mockRejectedValue(databaseError);

      await expect(
        billService.getBillsByCustomer(customerName),
      ).rejects.toThrow("Database connection failed");
    });
  });
});
