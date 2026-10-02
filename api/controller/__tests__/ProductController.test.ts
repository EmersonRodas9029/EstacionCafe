import {
  getProducts,
  getProductById,
  saveProduct,
  updateProduct,
  deleteProduct,
  getActiveProducts,
  setService,
} from "../ProductController";
import { IService } from "../../core/interfaces/IService";
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
} from "../../application/validations/ProductValidations";

// Mock the validation schemas
jest.mock("../../application/validations/ProductValidations", () => ({
  createProductSchema: {
    parse: jest.fn(),
  },
  updateProductSchema: {
    parse: jest.fn(),
  },
  productIdSchema: {
    parse: jest.fn(),
  },
}));

const mockService: jest.Mocked<IService & { getActiveProducts: jest.Mock }> = {
  save: jest.fn(),
  saveAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  getActiveProducts: jest.fn(),
} as any;

const mockRequest = (body = {}, params = {}) => ({
  body,
  params,
});

const mockResponse = () => {
  const res: any = {
    status: jest.fn(() => res),
    send: jest.fn(() => res),
  };
  return res;
};

describe("ProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setService(mockService);

    // Mock console.log and console.error to avoid test output pollution
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getProducts", () => {
    it("should return all products successfully", async () => {
      const mockProducts = [
        {
          productId: 1,
          name: "Café Americano",
          description: "Café negro tradicional",
          price: 5.5,
          cost: 2.0,
          active: true,
        },
        {
          productId: 2,
          name: "Cappuccino",
          description: "Café con leche y espuma",
          price: 7.0,
          cost: 3.0,
          active: false,
        },
      ];

      mockService.getAll.mockResolvedValue(mockProducts);
      const req = mockRequest();
      const res = mockResponse();

      await getProducts(req, res);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Productos obtenidos correctamente",
        data: [
          {
            productId: 1,
            name: "Café Americano",
            description: "Café negro tradicional",
            price: 5.5,
            cost: 2.0,
            active: true,
          },
          {
            productId: 2,
            name: "Cappuccino",
            description: "Café con leche y espuma",
            price: 7.0,
            cost: 3.0,
            active: false,
          },
        ],
      });
    });

    it("should handle service errors", async () => {
      const errorMessage = "Database connection failed";
      mockService.getAll.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest();
      const res = mockResponse();

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener los productos: ${errorMessage}`,
      });
    });

    it("should handle empty products list", async () => {
      mockService.getAll.mockResolvedValue([]);

      const req = mockRequest();
      const res = mockResponse();

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Productos obtenidos correctamente",
        data: [],
      });
    });
  });

  describe("getProductById", () => {
    it("should return a product by id successfully", async () => {
      const productId = 1;
      const mockProduct = {
        productId: 1,
        name: "Café Americano",
        description: "Café negro tradicional",
        price: 5.5,
        cost: 2.0,
        active: true,
      };

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });
      mockService.getById.mockResolvedValue(mockProduct);

      const req = mockRequest({}, { id: productId });
      const res = mockResponse();

      await getProductById(req, res);

      expect(productIdSchema.parse).toHaveBeenCalledWith({ id: productId });
      expect(mockService.getById).toHaveBeenCalledWith(productId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Producto obtenido correctamente",
        data: mockProduct,
      });
    });

    it("should handle validation errors", async () => {
      const validationError = {
        name: "ZodError",
        issues: [{ message: "ID debe ser un número positivo", path: ["id"] }],
      };

      (productIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      const req = mockRequest({}, { id: "invalid" });
      const res = mockResponse();

      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: ID debe ser un número positivo",
      });
    });

    it("should handle product not found", async () => {
      const productId = 999;
      const notFoundError = new Error("Producto no encontrado");

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });
      mockService.getById.mockRejectedValue(notFoundError);

      const req = mockRequest({}, { id: productId });
      const res = mockResponse();

      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Producto no encontrado",
      });
    });

    it("should handle general service errors", async () => {
      const productId = 1;
      const serviceError = new Error("Database error");

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });
      mockService.getById.mockRejectedValue(serviceError);

      const req = mockRequest({}, { id: productId });
      const res = mockResponse();

      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error al obtener el producto: Database error",
      });
    });
  });

  describe("saveProduct", () => {
    it("should save a product successfully", async () => {
      const productData = {
        name: "Café Americano",
        description: "Café negro tradicional",
        price: 5.5,
        cost: 2.0,
      };

      const validatedData = {
        name: "Café Americano",
        description: "Café negro tradicional",
        price: 5.5,
        cost: 2.0,
      };

      const savedProduct = {
        productId: 1,
        ...validatedData,
        active: true,
      };

      (createProductSchema.parse as jest.Mock).mockReturnValue(validatedData);
      mockService.save.mockResolvedValue(savedProduct);

      const req = mockRequest(productData);
      const res = mockResponse();

      await saveProduct(req, res);

      expect(createProductSchema.parse).toHaveBeenCalledWith(productData);
      expect(mockService.save).toHaveBeenCalledWith(validatedData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "El producto se guardó correctamente",
        data: savedProduct,
      });
    });

    it("should handle validation errors", async () => {
      const invalidData = {
        name: "",
        description: "Descripción",
        price: -5,
        cost: 2,
      };

      const validationError = {
        name: "ZodError",
        issues: [
          {
            message: "El nombre no puede estar vacío",
            path: ["name"],
            code: "too_small",
          },
        ],
      };

      (createProductSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      const req = mockRequest(invalidData);
      const res = mockResponse();

      await saveProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre no puede estar vacío",
        campo: ["name"],
        error: "too_small",
      });
    });

    it("should handle service errors", async () => {
      const productData = {
        name: "Café Americano",
        description: "Café negro tradicional",
        price: 5.5,
        cost: 2.0,
      };

      (createProductSchema.parse as jest.Mock).mockReturnValue(productData);
      mockService.save.mockRejectedValue(new Error("Database error"));

      const req = mockRequest(productData);
      const res = mockResponse();

      await saveProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Database error",
      });
    });

    it("should validate price greater than cost", async () => {
      const invalidData = {
        name: "Café Americano",
        description: "Café negro tradicional",
        price: 2.0,
        cost: 5.5,
      };

      const validationError = {
        name: "ZodError",
        issues: [
          {
            message: "El precio debe ser mayor al costo",
            path: ["price"],
            code: "custom",
          },
        ],
      };

      (createProductSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      const req = mockRequest(invalidData);
      const res = mockResponse();

      await saveProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El precio debe ser mayor al costo",
        campo: ["price"],
        error: "custom",
      });
    });
  });

  describe("updateProduct", () => {
    it("should update a product successfully", async () => {
      const productId = 1;
      const updateData = {
        name: "Café Americano Premium",
        price: 6.0,
      };

      const updatedProduct = {
        productId: 1,
        name: "Café Americano Premium",
        description: "Café negro tradicional",
        price: 6.0,
        cost: 2.0,
        active: true,
      };

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });
      (updateProductSchema.parse as jest.Mock).mockReturnValue(updateData);
      mockService.update.mockResolvedValue(updatedProduct);

      const req = mockRequest(updateData, { id: productId });
      const res = mockResponse();

      await updateProduct(req, res);

      expect(productIdSchema.parse).toHaveBeenCalledWith({ id: productId });
      expect(updateProductSchema.parse).toHaveBeenCalledWith(updateData);
      expect(mockService.update).toHaveBeenCalledWith({
        productId: productId,
        ...updateData,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Producto actualizado correctamente",
        data: updatedProduct,
      });
    });

    it("should handle validation errors for ID", async () => {
      const validationError = {
        name: "ZodError",
        issues: [
          {
            message: "El ID debe ser un número positivo",
            path: ["id"],
          },
        ],
      };

      (productIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      const req = mockRequest({ name: "Test" }, { id: "invalid" });
      const res = mockResponse();

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El ID debe ser un número positivo",
        campo: ["id"],
      });
    });

    it("should handle validation errors for update data", async () => {
      const productId = 1;
      const invalidUpdateData = {
        name: "",
        price: -5,
      };

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });

      const validationError = {
        name: "ZodError",
        issues: [
          {
            message: "El nombre no puede estar vacío",
            path: ["name"],
          },
        ],
      };

      (updateProductSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      const req = mockRequest(invalidUpdateData, { id: productId });
      const res = mockResponse();

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El nombre no puede estar vacío",
        campo: ["name"],
      });
    });

    it("should handle product not found", async () => {
      const productId = 999;
      const updateData = { name: "Test" };

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });
      (updateProductSchema.parse as jest.Mock).mockReturnValue(updateData);
      mockService.update.mockRejectedValue(new Error("Producto no encontrado"));

      const req = mockRequest(updateData, { id: productId });
      const res = mockResponse();

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Producto no encontrado",
      });
    });

    it("should handle general service errors", async () => {
      const productId = 1;
      const updateData = { name: "Test" };

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });
      (updateProductSchema.parse as jest.Mock).mockReturnValue(updateData);
      mockService.update.mockRejectedValue(new Error("Database error"));

      const req = mockRequest(updateData, { id: productId });
      const res = mockResponse();

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Database error",
      });
    });
  });

  describe("deleteProduct", () => {
    it("should delete a product successfully", async () => {
      const productId = 1;
      const deleteResult = { affected: 1 };

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });
      mockService.delete.mockResolvedValue(deleteResult);

      const req = mockRequest({}, { id: productId });
      const res = mockResponse();

      await deleteProduct(req, res);

      expect(productIdSchema.parse).toHaveBeenCalledWith({ id: productId });
      expect(mockService.delete).toHaveBeenCalledWith(productId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Producto eliminado correctamente",
        data: deleteResult,
      });
    });

    it("should handle validation errors", async () => {
      const validationError = {
        name: "ZodError",
        issues: [
          {
            message: "El ID debe ser un número positivo",
          },
        ],
      };

      (productIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      const req = mockRequest({}, { id: "invalid" });
      const res = mockResponse();

      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: El ID debe ser un número positivo",
      });
    });

    it("should handle product not found", async () => {
      const productId = 999;

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });
      mockService.delete.mockRejectedValue(new Error("Producto no encontrado"));

      const req = mockRequest({}, { id: productId });
      const res = mockResponse();

      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Producto no encontrado",
      });
    });

    it("should handle general service errors", async () => {
      const productId = 1;

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });
      mockService.delete.mockRejectedValue(new Error("Database error"));

      const req = mockRequest({}, { id: productId });
      const res = mockResponse();

      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Database error",
      });
    });

    it("should handle string ID conversion", async () => {
      const productId = "5";
      const deleteResult = { affected: 1 };

      (productIdSchema.parse as jest.Mock).mockReturnValue({ id: productId });
      mockService.delete.mockResolvedValue(deleteResult);

      const req = mockRequest({}, { id: productId });
      const res = mockResponse();

      await deleteProduct(req, res);

      expect(mockService.delete).toHaveBeenCalledWith(
        parseInt(String(productId)),
      );
    });
  });

  describe("getActiveProducts", () => {
    it("should return active products successfully", async () => {
      const activeProducts = [
        {
          productId: 1,
          name: "Café Americano",
          description: "Café negro tradicional",
          price: 5.5,
          cost: 2.0,
          active: true,
        },
        {
          productId: 3,
          name: "Latte",
          description: "Café con leche",
          price: 6.5,
          cost: 2.5,
          active: true,
        },
      ];

      mockService.getActiveProducts.mockResolvedValue(activeProducts);

      const req = mockRequest();
      const res = mockResponse();

      await getActiveProducts(req, res);

      expect(mockService.getActiveProducts).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Productos activos obtenidos correctamente",
        data: activeProducts,
      });
    });

    it("should handle service errors", async () => {
      const errorMessage = "Database connection failed";
      mockService.getActiveProducts.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest();
      const res = mockResponse();

      await getActiveProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener los productos activos: ${errorMessage}`,
      });
    });

    it("should handle empty active products list", async () => {
      mockService.getActiveProducts.mockResolvedValue([]);

      const req = mockRequest();
      const res = mockResponse();

      await getActiveProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Productos activos obtenidos correctamente",
        data: [],
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle products with special characters in name", async () => {
      const productData = {
        name: "Café Ñoño & Special",
        description: "Café con caracteres especiales",
        price: 5.5,
        cost: 2.0,
      };

      (createProductSchema.parse as jest.Mock).mockReturnValue(productData);
      mockService.save.mockResolvedValue({
        productId: 1,
        ...productData,
        active: true,
      });

      const req = mockRequest(productData);
      const res = mockResponse();

      await saveProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle decimal price and cost transformations", async () => {
      const productData = {
        name: "Café Test",
        description: "Test description",
        price: "5.99999",
        cost: "2.11111",
      };

      const transformedData = {
        name: "Café Test",
        description: "Test description",
        price: 6.0,
        cost: 2.11,
      };

      (createProductSchema.parse as jest.Mock).mockReturnValue(transformedData);
      mockService.save.mockResolvedValue({
        productId: 1,
        ...transformedData,
        active: true,
      });

      const req = mockRequest(productData);
      const res = mockResponse();

      await saveProduct(req, res);

      expect(createProductSchema.parse).toHaveBeenCalledWith(productData);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle maximum length validation for name and description", async () => {
      const longName = "A".repeat(51);
      const longDescription = "B".repeat(101);

      const invalidData = {
        name: longName,
        description: longDescription,
        price: 5.5,
        cost: 2.0,
      };

      const validationError = {
        name: "ZodError",
        issues: [
          {
            message: "El nombre no puede ser mayor a 50 caracteres",
            path: ["name"],
            code: "too_big",
          },
        ],
      };

      (createProductSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      const req = mockRequest(invalidData);
      const res = mockResponse();

      await saveProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message:
          "Datos inválidos: El nombre no puede ser mayor a 50 caracteres",
        campo: ["name"],
        error: "too_big",
      });
    });
  });
});
