import {
  saveDetails,
  getDetails,
  deleteDetail,
  getDetailsByBillId,
  updateDetail,
  setService,
} from "../BillDetailsController";
import { AppError } from "../../application/errors/AppError";
import { IService } from "../../core/interfaces/IService";

// Mock del esquema de validación
jest.mock("../../application/validations/BillDetailsValidations", () => ({
  ...jest.requireActual("../../application/validations/BillDetailsValidations"),
  BillDetailsSchema: {
    parse: jest.fn((data) => data),
  },
}));

import { BillDetailsSchema } from "../../application/validations/BillDetailsValidations";

const ACTOR = { userId: 2, role: "cajero" };

describe("BillDetailsController", () => {
  let mockService: jest.Mocked<IService>;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    // Mock service
    mockService = {
      saveAll: jest.fn(),
      getAll: jest.fn(),
      save: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    setService(mockService);

    // Mock request and response objects
    mockReq = {
      user: ACTOR,
      body: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Mock console methods to avoid test output pollution
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();

    // Resetear el mock del esquema
    (BillDetailsSchema.parse as jest.Mock).mockClear();
    (BillDetailsSchema.parse as jest.Mock).mockImplementation((data) => data);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("saveDetails", () => {
    it("should save details successfully with valid data", async () => {
      const validData = {
        billId: 1,
        billDetails: [
          {
            productId: 1,
            name: "Café Americano",
            quantity: 2,
            price: 30.0,
            subTotal: 60.0,
          },
        ],
      };
      const savedDetails = [{ billDetailId: 1, billId: 1, productId: 1 }];

      mockReq.body = validData;
      mockService.saveAll.mockResolvedValue(savedDetails);

      await saveDetails(mockReq, mockRes);

      expect(BillDetailsSchema.parse).toHaveBeenCalledWith(validData);
      expect(mockService.saveAll).toHaveBeenCalledWith(validData, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Factura y detalles guardados correctamente",
        data: savedDetails,
      });
    });

    it("should handle ZodError validation", async () => {
      const invalidData = { billId: -1, billDetails: [] };
      const zodError = {
        name: "ZodError",
        issues: [
          {
            message: "El ID del bill debe ser un número positivo",
            path: ["billId"],
            code: "invalid_type",
          },
        ],
      };

      mockReq.body = invalidData;
      (BillDetailsSchema.parse as jest.Mock).mockImplementation(() => {
        throw zodError;
      });

      await saveDetails(mockReq, mockRes);

      expect(BillDetailsSchema.parse).toHaveBeenCalledWith(invalidData);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El ID del bill debe ser un número positivo",
        campo: ["billId"],
        error: "invalid_type",
      });
      expect(mockService.saveAll).not.toHaveBeenCalled();
    });

    it("should handle server error", async () => {
      const validData = {
        billId: 1,
        billDetails: [
          {
            productId: 1,
            name: "Café",
            quantity: 1,
            price: 10.0,
            subTotal: 10.0,
          },
        ],
      };
      const serverError = new Error("Database connection failed");

      mockReq.body = validData;
      mockService.saveAll.mockRejectedValue(serverError);

      await saveDetails(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Hubo un error en el servidor al guardar el detalle",
        errors: "Database connection failed",
      });
    });
  });

  describe("getDetails", () => {
    it("should get all details successfully", async () => {
      const mockDetails = [
        { id: 1, billId: 1, productId: 1, quantity: 2 },
        { id: 2, billId: 1, productId: 2, quantity: 1 },
      ];
      (mockService.getAll as jest.Mock).mockResolvedValue(mockDetails);

      await getDetails(mockReq, mockRes);

      expect(mockService.getAll).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Detalles obtenidos corretamente",
        data: mockDetails,
      });
    });

    it("should handle any error when getting details", async () => {
      const zodError = {
        name: "ZodError",
        issues: [
          {
            message: "Invalid data format",
            path: ["id"],
            code: "invalid_type",
          },
        ],
      };
      (mockService.getAll as jest.Mock).mockRejectedValue(zodError);

      await getDetails(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Hubo un error en el servidor",
        errors: zodError,
      });
    });

    it("should handle server error when getting details", async () => {
      const serverError = { error: "Database error" };
      (mockService.getAll as jest.Mock).mockRejectedValue(serverError);

      await getDetails(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Hubo un error en el servidor",
        errors: "Database error",
      });
    });
  });

  describe("deleteDetail", () => {
    it("should delete detail successfully", async () => {
      mockReq.params = { id: "1" };
      mockService.delete.mockResolvedValue({
        message: "Detalle eliminado correctamente",
        id: 1,
      });

      await deleteDetail(mockReq, mockRes);

      expect(mockService.delete).toHaveBeenCalledWith(1, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Detalle eliminado correctamente",
      });
    });

    it("should return error 400 when ID is not a number", async () => {
      mockReq.params = { id: "abc" };

      await deleteDetail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: debe ser un número",
      });
      expect(mockService.delete).not.toHaveBeenCalled();
    });

    it("should handle not found error when deleting detail", async () => {
      mockReq.params = { id: "999" };
      const notFoundError = new Error("Detalle con ID 999 no encontrado");
      mockService.delete.mockRejectedValue(notFoundError);

      await deleteDetail(mockReq, mockRes);

      expect(mockService.delete).toHaveBeenCalledWith(999, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Detalle con ID 999 no encontrado",
      });
    });

    it("should handle server error when deleting detail", async () => {
      mockReq.params = { id: "1" };
      const serverError = new Error("Database connection failed");
      mockService.delete.mockRejectedValue(serverError);

      await deleteDetail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor: Database connection failed",
      });
    });
  });

  describe("getDetailsByBillId", () => {
    it("should get details by billId successfully", async () => {
      mockReq.params = { billId: "1" };
      const mockDetails = [
        {
          billDetailId: 1,
          billId: 1,
          productId: 1,
          quantity: 2,
          unitPrice: 30,
          subTotal: 60.0,
          product: { productId: 1, name: "Café Americano", price: 32 },
        },
        {
          billDetailId: 2,
          billId: 1,
          productId: 2,
          quantity: 1,
          unitPrice: 45,
          subTotal: 45.0,
          product: { productId: 2, name: "Capuccino", price: 45 },
        },
      ];
      mockService.getById.mockResolvedValue(mockDetails);

      await getDetailsByBillId(mockReq, mockRes);

      expect(mockService.getById).toHaveBeenCalledWith(1, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Detalles obtenidos correctamente",
        data: [
          {
            billDetailId: 1,
            productId: 1,
            name: "Café Americano",
            quantity: 2,
            price: 30,
            subTotal: 60,
          },
          {
            billDetailId: 2,
            productId: 2,
            name: "Capuccino",
            quantity: 1,
            price: 45,
            subTotal: 45,
          },
        ],
      });
    });

    it("should return error 400 when billId is not a number", async () => {
      mockReq.params = { billId: "abc" };

      await getDetailsByBillId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID de factura inválido: debe ser un número",
      });
      expect(mockService.getById).not.toHaveBeenCalled();
    });

    it("should return an empty list when the bill has no details", async () => {
      mockReq.params = { billId: "999" };
      mockService.getById.mockResolvedValue([]);

      await getDetailsByBillId(mockReq, mockRes);

      expect(mockService.getById).toHaveBeenCalledWith(999, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Detalles obtenidos correctamente",
        data: [],
      });
    });

    it("should handle server error when getting details by billId", async () => {
      mockReq.params = { billId: "1" };
      const serverError = new Error("Database connection failed");
      mockService.getById.mockRejectedValue(serverError);

      await getDetailsByBillId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Hubo un error en el servidor al obtener los detalles",
        errors: serverError,
      });
    });

    it("should handle error with nested error structure", async () => {
      mockReq.params = { billId: "5" };
      const nestedError = {
        error: {
          message: "Foreign key constraint",
          code: "FK_ERROR",
        },
      };
      mockService.getById.mockRejectedValue(nestedError);

      await getDetailsByBillId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Hubo un error en el servidor al obtener los detalles",
        errors: {
          message: "Foreign key constraint",
          code: "FK_ERROR",
        },
      });
    });
  });

  describe("Edge Cases and Validations", () => {
    it("should handle empty request body in saveDetails", async () => {
      const emptyReq = { body: {} };
      const mockResult = { message: "Saved with defaults" };
      (mockService.saveAll as jest.Mock).mockResolvedValue(mockResult);

      await saveDetails(emptyReq, mockRes);

      expect(mockService.saveAll).toHaveBeenCalledWith({}, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Factura y detalles guardados correctamente",
        data: mockResult,
      });
    });

    it("should handle array of details in saveDetails", async () => {
      const multipleDetails = [
        { billId: 1, productId: 1, quantity: 2 },
        { billId: 1, productId: 2, quantity: 1 },
        { billId: 1, productId: 3, quantity: 3 },
      ];
      mockReq.body = multipleDetails;
      (mockService.saveAll as jest.Mock).mockResolvedValue(multipleDetails);

      await saveDetails(mockReq, mockRes);

      expect(mockService.saveAll).toHaveBeenCalledWith(multipleDetails, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle null response from getAll", async () => {
      (mockService.getAll as jest.Mock).mockResolvedValue(null);

      await getDetails(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "success",
        message: "Detalles obtenidos corretamente",
        data: null,
      });
    });

    it("should handle numeric ID in deleteDetail", async () => {
      const mockReqWithNumericId = {
        ...mockReq,
        params: { id: 123 },
      };
      const mockResult = { affected: 1 };
      (mockService.delete as jest.Mock).mockResolvedValue(mockResult);

      await deleteDetail(mockReqWithNumericId, mockRes);

      expect(mockService.delete).toHaveBeenCalledWith(123, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(202);
    });

    it("should handle error with nested error structure", async () => {
      const nestedError = {
        error: {
          message: "Constraint violation",
          code: "DB_ERROR",
        },
      };
      (mockService.getAll as jest.Mock).mockRejectedValue(nestedError);

      await getDetails(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Hubo un error en el servidor",
        errors: {
          message: "Constraint violation",
          code: "DB_ERROR",
        },
      });
    });

    it("should handle ZodError with multiple issues in saveDetails", async () => {
      const multipleIssuesError = {
        name: "ZodError",
        issues: [
          {
            message: "Required field missing",
            path: ["billId"],
            code: "invalid_type",
          },
          {
            message: "Invalid quantity",
            path: ["quantity"],
            code: "too_small",
          },
        ],
      };
      (mockService.saveAll as jest.Mock).mockRejectedValue(multipleIssuesError);

      await saveDetails(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: Required field missing", // Takes first issue
        campo: ["billId"],
        error: "invalid_type",
      });
    });
  });

  describe("updateDetail", () => {
    it("should update the quantity of a line", async () => {
      mockReq.params = { id: "5" };
      mockReq.body = { quantity: 3 };
      mockService.update.mockResolvedValue({ billDetailId: 5, quantity: 3 });

      await updateDetail(mockReq, mockRes);

      expect(mockService.update).toHaveBeenCalledWith({
        billDetailId: 5,
        quantity: 3,
      }, ACTOR);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should reject a non positive quantity", async () => {
      mockReq.params = { id: "5" };
      mockReq.body = { quantity: 0 };

      await updateDetail(mockReq, mockRes);

      expect(mockService.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return stock errors with type", async () => {
      mockReq.params = { id: "5" };
      mockReq.body = { quantity: 50 };
      mockService.update.mockRejectedValue(
        AppError.badRequest("Stock insuficiente para \"Leche\"", "stock_error"),
      );

      await updateDetail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.objectContaining({ type: "stock_error" }),
      );
    });

    it("should return 409 when the bill is closed", async () => {
      mockReq.params = { id: "5" };
      mockReq.body = { quantity: 2 };
      mockService.update.mockRejectedValue(
        AppError.conflict("La cuenta 1 está closed y no se puede modificar"),
      );

      await updateDetail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });
});
