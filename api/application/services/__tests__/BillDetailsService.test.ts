import { Repository } from "typeorm";
import { BillDetailsService } from "../BillDetailsService";
import { BillDetails } from "../../../core/entities/BillDetails";
import { SaveBillDetailDTO } from "../../DTOs/BillsDTO";
import { IService } from "../../../core/interfaces/IService";
import { Bill } from "../../../core/entities/Bill";
import { Status } from "../../../core/enums/Status";

describe("BillDetailsService", () => {
  let billDetailsService: BillDetailsService;
  let mockDetailRepo: jest.Mocked<Repository<BillDetails>>;
  let mockBillService: jest.Mocked<IService>;
  let mockProductRepo: any;

  beforeEach(() => {
    // Mock del repositorio de detalles
    mockDetailRepo = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      manager: {
        getRepository: jest.fn(),
      } as any,
    } as any;

    // Mock del servicio de facturas
    mockBillService = {
      save: jest.fn(),
      saveAll: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
    };

    // Mock del repositorio de productos
    mockProductRepo = {
      findOne: jest.fn(),
    };

    // Configurar el mock del manager para devolver el repo de productos
    jest
      .spyOn(mockDetailRepo.manager, "getRepository")
      .mockReturnValue(mockProductRepo);

    // Crear instancia del servicio
    billDetailsService = new BillDetailsService(
      mockDetailRepo,
      mockBillService,
    );

    // Silenciar console.log
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getById", () => {
    it("debería obtener detalles de factura por ID con relaciones", async () => {
      const billId = 1;
      const mockDetails = [
        {
          billDetailId: 1,
          billId: 1,
          productId: 1,
          quantity: 2,
          subTotal: 50.0,
          product: { productId: 1, name: "Café Americano", price: 25.0 },
          bill: { billId: 1, customer: "Juan Pérez", total: 100.0 },
        },
        {
          billDetailId: 2,
          billId: 1,
          productId: 2,
          quantity: 1,
          subTotal: 50.0,
          product: { productId: 2, name: "Cappuccino", price: 50.0 },
          bill: { billId: 1, customer: "Juan Pérez", total: 100.0 },
        },
      ] as BillDetails[];

      mockDetailRepo.find.mockResolvedValue(mockDetails);

      const result = await billDetailsService.getById(billId);

      expect(mockDetailRepo.find).toHaveBeenCalledWith({
        where: { billId: 1 },
        relations: ["product", "bill"],
      });
      expect(result).toEqual(mockDetails);
      expect(result).toHaveLength(2);
      expect(console.log).toHaveBeenCalledWith(
        "Obteniendo detalles de la factura 1...",
      );
    });

    it("debería retornar array vacío cuando no hay detalles", async () => {
      const billId = 999;
      mockDetailRepo.find.mockResolvedValue([]);

      const result = await billDetailsService.getById(billId);

      expect(mockDetailRepo.find).toHaveBeenCalledWith({
        where: { billId: 999 },
        relations: ["product", "bill"],
      });
      expect(result).toEqual([]);
      expect(console.log).toHaveBeenCalledWith(
        "Obteniendo detalles de la factura 999...",
      );
    });

    it("debería manejar errores del repositorio", async () => {
      const billId = 1;
      const repositoryError = new Error("Error de base de datos");
      mockDetailRepo.find.mockRejectedValue(repositoryError);

      await expect(billDetailsService.getById(billId)).rejects.toThrow(
        "Error de base de datos",
      );
      expect(mockDetailRepo.find).toHaveBeenCalled();
    });
  });

  describe("saveAll", () => {
    it("debería guardar factura completa con detalles exitosamente", async () => {
      const billDetailData: SaveBillDetailDTO = {
        billId: 1,
        billDetails: [
          {
            productId: 101,
            name: "Café Americano",
            quantity: 2,
            price: 30.0,
            subTotal: 60.0,
          },
          {
            productId: 102,
            name: "Cappuccino",
            quantity: 1,
            price: 40.0,
            subTotal: 40.0,
          },
        ],
      };

      const mockBill = {
        billId: 1,
        customer: "María García",
        cashRegisterId: 1,
        total: 100.0,
        date: new Date("2025-10-20"),
        status: Status.CLOSED,
        billDetails: [],
        cashRegister: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any as Bill;

      const mockProduct1 = {
        product_id: 101,
        name: "Café Americano",
        price: 30.0,
      };
      const mockProduct2 = { product_id: 102, name: "Cappuccino", price: 40.0 };

      const savedDetails = [
        {
          billDetailId: 1,
          billId: 1,
          productId: 101,
          quantity: 2,
          subTotal: 60.0,
        },
        {
          billDetailId: 2,
          billId: 1,
          productId: 102,
          quantity: 1,
          subTotal: 40.0,
        },
      ] as BillDetails[];

      mockBillService.getById.mockResolvedValue(mockBill);
      mockProductRepo.findOne
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);
      mockDetailRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(savedDetails);
      mockDetailRepo.save.mockResolvedValue(savedDetails as any);
      mockBillService.update.mockResolvedValue({ ...mockBill, total: 100.0 });

      const result = await billDetailsService.saveAll(billDetailData);

      // Verificar que se verificó la existencia del bill
      expect(mockBillService.getById).toHaveBeenCalledWith(1);

      // Verificar que se buscaron los productos por ID
      expect(mockProductRepo.findOne).toHaveBeenCalledWith({
        where: { productId: 101 },
      });
      expect(mockProductRepo.findOne).toHaveBeenCalledWith({
        where: { productId: 102 },
      });

      // Verificar que se guardaron los detalles
      expect(mockDetailRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            billId: 1,
            productId: 101,
            quantity: 2,
            subTotal: 60.0,
          }),
          expect.objectContaining({
            billId: 1,
            productId: 102,
            quantity: 1,
            subTotal: 40.0,
          }),
        ]),
      );

      // Verificar que se actualizó el total del bill
      expect(mockBillService.update).toHaveBeenCalledWith({
        billId: 1,
        total: 100.0,
      });

      expect(result).toEqual(savedDetails);
      expect(console.log).toHaveBeenCalledWith(
        "Guardados/actualizados 2 detalles y actualizado total a 100",
      );
    });

    it("debería calcular el total correctamente con múltiples productos", async () => {
      const billDetailData: SaveBillDetailDTO = {
        billId: 1,
        billDetails: [
          {
            productId: 1,
            name: "Producto1",
            quantity: 3,
            price: 25.17,
            subTotal: 75.51,
          },
          {
            productId: 2,
            name: "Producto2",
            quantity: 2,
            price: 30.0,
            subTotal: 60.0,
          },
          {
            productId: 3,
            name: "Producto3",
            quantity: 1,
            price: 25.75,
            subTotal: 25.75,
          },
        ],
      };

      const savedBill = { billId: 1, status: Status.CLOSED } as any as Bill;
      const mockProduct1 = { product_id: 1, name: "Producto1", price: 25.17 };
      const mockProduct2 = { product_id: 2, name: "Producto2", price: 30.0 };
      const mockProduct3 = { product_id: 3, name: "Producto3", price: 25.75 };

      mockBillService.getById.mockResolvedValue(savedBill);
      mockProductRepo.findOne
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2)
        .mockResolvedValueOnce(mockProduct3);
      mockDetailRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { subTotal: 75.51 },
          { subTotal: 60.0 },
          { subTotal: 25.75 },
        ] as any);
      mockDetailRepo.save.mockResolvedValue([] as any);
      mockBillService.update.mockResolvedValue({
        ...savedBill,
        total: 161.26,
      });

      await billDetailsService.saveAll(billDetailData);

      expect(mockBillService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          billId: 1,
          total: 161.26, // 75.51 + 60.00 + 25.75
        }),
      );
    });

    it("debería crear entidades BillDetails correctamente", async () => {
      const billDetailData: SaveBillDetailDTO = {
        billId: 10,
        billDetails: [
          {
            productId: 5,
            name: "Producto Test",
            quantity: 1,
            price: 30.0,
            subTotal: 30.0,
          },
        ],
      };

      const savedBill = {
        billId: 10,
        customer: "",
        cashRegisterId: 1,
        total: 0,
        date: new Date(),
        status: Status.CLOSED,
        billDetails: [],
        cashRegister: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any as Bill;
      let savedDetails: any[];

      const mockProduct = {
        product_id: 5,
        name: "Producto Test",
        price: 30.0,
      };

      mockBillService.getById.mockResolvedValue(savedBill);
      mockProductRepo.findOne.mockResolvedValue(mockProduct);
      mockDetailRepo.save.mockImplementation((details: any) => {
        savedDetails = details as any[];
        return Promise.resolve(details as any);
      });
      mockBillService.update.mockResolvedValue({ ...savedBill, total: 30.0 });

      await billDetailsService.saveAll(billDetailData);

      expect(savedDetails![0]).toBeInstanceOf(BillDetails);
      expect(savedDetails![0].billId).toBe(10);
      expect(savedDetails![0].productId).toBe(5);
      expect(savedDetails![0].quantity).toBe(1);
      expect(savedDetails![0].subTotal).toBe(30.0);
    });

    it("debería manejar factura sin detalles", async () => {
      const billDetailData: SaveBillDetailDTO = {
        billId: 1,
        billDetails: [],
      };

      const savedBill = {
        billId: 1,
        customer: "",
        cashRegisterId: 1,
        total: 0,
        date: new Date(),
        status: Status.CLOSED,
        billDetails: [],
        cashRegister: {} as any,
      } as any as Bill;
      mockBillService.getById.mockResolvedValue(savedBill);
      mockDetailRepo.save.mockResolvedValue([] as any);
      mockBillService.update.mockResolvedValue({ ...savedBill, total: 0 });

      const result = await billDetailsService.saveAll(billDetailData);

      expect(mockBillService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          billId: 1,
          total: 0,
        }),
      );
      expect(mockDetailRepo.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it("debería lanzar error cuando el bill no existe", async () => {
      const billDetailData: SaveBillDetailDTO = {
        billId: 999,
        billDetails: [
          {
            productId: 1,
            name: "Producto",
            quantity: 1,
            price: 10.0,
            subTotal: 10.0,
          },
        ],
      };

      mockBillService.getById.mockResolvedValue(null);

      await expect(billDetailsService.saveAll(billDetailData)).rejects.toThrow(
        "Bill con ID 999 no encontrado",
      );
      expect(mockDetailRepo.save).not.toHaveBeenCalled();
    });

    it("debería lanzar error cuando un producto no existe", async () => {
      const billDetailData: SaveBillDetailDTO = {
        billId: 1,
        billDetails: [
          {
            productId: 999,
            name: "Producto Inexistente",
            quantity: 1,
            price: 10.0,
            subTotal: 10.0,
          },
        ],
      };

      const savedBill = {
        billId: 1,
        customer: "",
        cashRegisterId: 1,
        total: 0,
        date: new Date(),
        status: Status.CLOSED,
        billDetails: [],
        cashRegister: {} as any,
      } as any as Bill;

      mockBillService.getById.mockResolvedValue(savedBill);
      mockProductRepo.findOne.mockResolvedValue(null);

      await expect(billDetailsService.saveAll(billDetailData)).rejects.toThrow(
        "Producto con ID 999 no encontrado",
      );
      expect(mockDetailRepo.save).not.toHaveBeenCalled();
    });

    it("debería manejar errores del repositorio de detalles", async () => {
      const billDetailData: SaveBillDetailDTO = {
        billId: 1,
        billDetails: [
          {
            productId: 1,
            name: "Producto",
            quantity: 1,
            price: 10.0,
            subTotal: 10.0,
          },
        ],
      };

      const savedBill = {
        billId: 1,
        customer: "",
        cashRegisterId: 1,
        total: 0,
        date: new Date(),
        status: Status.CLOSED,
        billDetails: [],
        cashRegister: {} as any,
      } as any as Bill;
      const detailError = new Error("Error al guardar detalles");

      const mockProduct = { product_id: 1, name: "Producto", price: 10.0 };

      mockBillService.getById.mockResolvedValue(savedBill);
      mockProductRepo.findOne.mockResolvedValue(mockProduct);
      mockDetailRepo.save.mockRejectedValue(detailError);

      await expect(billDetailsService.saveAll(billDetailData)).rejects.toThrow(
        "Error al guardar detalles",
      );
    });
  });

  describe("getAll", () => {
    it("debería obtener todos los detalles con relaciones", async () => {
      const mockAllDetails = [
        {
          billDetailId: 1,
          billId: 1,
          productId: 1,
          quantity: 2,
          subTotal: 50.0,
          product: { productId: 1, name: "Espresso" },
          bill: { billId: 1, customer: "Cliente 1" },
        },
        {
          billDetailId: 2,
          billId: 2,
          productId: 2,
          quantity: 1,
          subTotal: 30.0,
          product: { productId: 2, name: "Latte" },
          bill: { billId: 2, customer: "Cliente 2" },
        },
      ] as BillDetails[];

      mockDetailRepo.find.mockResolvedValue(mockAllDetails);

      const result = await billDetailsService.getAll();

      expect(mockDetailRepo.find).toHaveBeenCalledWith({
        relations: ["product", "bill"],
      });
      expect(result).toEqual(mockAllDetails);
      expect(result).toHaveLength(2);
      expect(console.log).toHaveBeenCalledWith("Obteniendo bills details...");
    });

    it("debería retornar array vacío cuando no hay detalles", async () => {
      mockDetailRepo.find.mockResolvedValue([]);

      const result = await billDetailsService.getAll();

      expect(result).toEqual([]);
      expect(console.log).toHaveBeenCalledWith("Obteniendo bills details...");
    });

    it("debería manejar errores del repositorio", async () => {
      const repositoryError = new Error("Error de consulta");
      mockDetailRepo.find.mockRejectedValue(repositoryError);

      await expect(billDetailsService.getAll()).rejects.toThrow(
        "Error de consulta",
      );
    });
  });

  describe("delete", () => {
    it("debería eliminar un detalle de factura exitosamente", async () => {
      const detailId = 1;
      const deleteResult = { affected: 1 };

      mockDetailRepo.delete.mockResolvedValue(deleteResult as any);

      const result = await billDetailsService.delete(detailId);

      expect(mockDetailRepo.delete).toHaveBeenCalledWith(detailId);
      expect(result).toEqual({
        message: "Detalle eliminado correctamente",
        id: detailId,
      });
    });

    it("debería lanzar error cuando el detalle no existe", async () => {
      const detailId = 999;
      const deleteResult = { affected: 0 };

      mockDetailRepo.delete.mockResolvedValue(deleteResult as any);

      await expect(billDetailsService.delete(detailId)).rejects.toThrow(
        `Detalle con ID ${detailId} no encontrado`,
      );
      expect(mockDetailRepo.delete).toHaveBeenCalledWith(detailId);
    });

    it("debería manejar errores del repositorio", async () => {
      const detailId = 1;
      const repositoryError = new Error("Error de eliminación");

      mockDetailRepo.delete.mockRejectedValue(repositoryError);

      await expect(billDetailsService.delete(detailId)).rejects.toThrow(
        "Error de eliminación",
      );
      expect(mockDetailRepo.delete).toHaveBeenCalledWith(detailId);
    });
  });

  describe("save", () => {
    it("debería lanzar error Method not implemented", () => {
      expect(() => billDetailsService.save({})).toThrow(
        "Method not implemented.",
      );
    });
  });

  describe("update", () => {
    it("debería lanzar error Method not implemented", () => {
      expect(() => billDetailsService.update({})).toThrow(
        "Method not implemented.",
      );
    });
  });

  describe("Casos de integración", () => {
    it("debería manejar flujo completo de creación de factura", async () => {
      const billDetailData: SaveBillDetailDTO = {
        billId: 100,
        billDetails: [
          {
            productId: 1,
            name: "Café Latte",
            quantity: 2,
            price: 35.0,
            subTotal: 70.0,
          },
          {
            productId: 3,
            name: "Croissant",
            quantity: 1,
            price: 45.0,
            subTotal: 45.0,
          },
        ],
      };

      const savedBill = {
        billId: 100,
        customer: "Cliente Integración",
        cashRegisterId: 2,
        total: 115.0,
        date: new Date("2025-10-20T10:30:00"),
        status: Status.CLOSED,
        billDetails: [],
        cashRegister: {} as any,
      } as any as Bill;

      const mockProduct1 = { product_id: 1, name: "Café Latte", price: 35.0 };
      const mockProduct2 = { product_id: 3, name: "Croissant", price: 45.0 };

      const savedDetails = [
        {
          billDetailId: 201,
          billId: 100,
          productId: 1,
          quantity: 2,
          subTotal: 70.0,
        },
        {
          billDetailId: 202,
          billId: 100,
          productId: 3,
          quantity: 1,
          subTotal: 45.0,
        },
      ] as BillDetails[];

      mockBillService.getById.mockResolvedValue(savedBill);
      mockProductRepo.findOne
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);
      mockDetailRepo.save.mockResolvedValue(savedDetails as any);
      mockBillService.update.mockResolvedValue({
        ...savedBill,
        total: 115.0,
      });

      // 1. Crear factura con detalles
      const saveResult = await billDetailsService.saveAll(billDetailData);
      expect(saveResult).toEqual(savedDetails);

      // 2. Obtener detalles por ID de factura
      mockDetailRepo.find.mockResolvedValue(savedDetails);
      const getResult = await billDetailsService.getById(100);
      expect(getResult).toEqual(savedDetails);

      // 3. Obtener todos los detalles
      mockDetailRepo.find.mockResolvedValue([...savedDetails]);
      const getAllResult = await billDetailsService.getAll();
      expect(getAllResult).toEqual(savedDetails);
    });

    it("debería manejar múltiples productos con diferentes cantidades", async () => {
      const billDetailData: SaveBillDetailDTO = {
        billId: 1,
        billDetails: [
          {
            productId: 1,
            name: "Producto1",
            quantity: 5,
            price: 25.0,
            subTotal: 125.0,
          },
          {
            productId: 2,
            name: "Producto2",
            quantity: 3,
            price: 60.0,
            subTotal: 180.0,
          },
          {
            productId: 3,
            name: "Producto3",
            quantity: 1,
            price: 35.5,
            subTotal: 35.5,
          },
          {
            productId: 4,
            name: "Producto4",
            quantity: 2,
            price: 40.0,
            subTotal: 80.0,
          },
        ],
      };

      const savedBill = {
        billId: 1,
        customer: "",
        cashRegisterId: 1,
        total: 0,
        date: new Date(),
        status: Status.CLOSED,
        billDetails: [],
        cashRegister: {} as any,
      } as any as Bill;

      const mockProducts = [
        { product_id: 1, name: "Producto1", price: 25.0 },
        { product_id: 2, name: "Producto2", price: 60.0 },
        { product_id: 3, name: "Producto3", price: 35.5 },
        { product_id: 4, name: "Producto4", price: 40.0 },
      ];

      mockBillService.getById.mockResolvedValue(savedBill);
      mockProductRepo.findOne
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[1])
        .mockResolvedValueOnce(mockProducts[2])
        .mockResolvedValueOnce(mockProducts[3]);
      mockDetailRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { subTotal: 125.0 },
          { subTotal: 180.0 },
          { subTotal: 35.5 },
          { subTotal: 80.0 },
        ] as any);
      mockDetailRepo.save.mockResolvedValue([] as any);
      mockBillService.update.mockResolvedValue({
        ...savedBill,
        total: 420.5,
      });

      await billDetailsService.saveAll(billDetailData);

      expect(mockBillService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          billId: 1,
          total: 420.5, // 125.0 + 180.0 + 35.5 + 80.0
        }),
      );
    });

    it("debería validar que los productos se busquen en orden", async () => {
      const billDetailData: SaveBillDetailDTO = {
        billId: 1,
        billDetails: [
          {
            productId: 1,
            name: "Producto A",
            quantity: 1,
            price: 10.0,
            subTotal: 10.0,
          },
          {
            productId: 2,
            name: "Producto B",
            quantity: 1,
            price: 20.0,
            subTotal: 20.0,
          },
          {
            productId: 3,
            name: "Producto C",
            quantity: 1,
            price: 30.0,
            subTotal: 30.0,
          },
        ],
      };

      const savedBill = { billId: 1 } as any as Bill;
      const mockProductA = { product_id: 1, name: "Producto A", price: 10.0 };
      const mockProductB = { product_id: 2, name: "Producto B", price: 20.0 };
      const mockProductC = { product_id: 3, name: "Producto C", price: 30.0 };

      mockBillService.getById.mockResolvedValue(savedBill);
      mockProductRepo.findOne
        .mockResolvedValueOnce(mockProductA)
        .mockResolvedValueOnce(mockProductB)
        .mockResolvedValueOnce(mockProductC);
      mockDetailRepo.save.mockResolvedValue([] as any);
      mockBillService.update.mockResolvedValue({ ...savedBill, total: 60.0 });

      await billDetailsService.saveAll(billDetailData);

      expect(mockProductRepo.findOne).toHaveBeenNthCalledWith(1, {
        where: { productId: 1 },
      });
      expect(mockProductRepo.findOne).toHaveBeenNthCalledWith(2, {
        where: { productId: 2 },
      });
      expect(mockProductRepo.findOne).toHaveBeenNthCalledWith(3, {
        where: { productId: 3 },
      });
    });
  });
});
