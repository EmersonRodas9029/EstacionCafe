import {
  getTables,
  getTableById,
  saveTable,
  updateTable,
  deleteTable,
  getTablesByZone,
  getTablesByStatus,
  getAvailableTables,
  updateTableStatus,
  setService,
} from "../TableController";
import { IService } from "../../core/interfaces/IService";
import {
  createTableSchema,
  updateTableSchema,
  tableIdSchema,
} from "../../application/validations/TableValidations";
import { TableStatus } from "../../core/entities/Table";

// Mock the validation schemas
jest.mock("../../application/validations/TableValidations", () => ({
  createTableSchema: {
    parse: jest.fn(),
  },
  updateTableSchema: {
    parse: jest.fn(),
  },
  tableIdSchema: {
    parse: jest.fn(),
  },
}));

const mockService: jest.Mocked<
  IService & {
    getByZone: jest.Mock;
    getByStatus: jest.Mock;
    getAvailableTables: jest.Mock;
    updateTableStatus: jest.Mock;
  }
> = {
  save: jest.fn(),
  saveAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  getByZone: jest.fn(),
  getByStatus: jest.fn(),
  getAvailableTables: jest.fn(),
  updateTableStatus: jest.fn(),
} as any;

const mockRequest = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query,
});

const mockResponse = () => {
  const res: any = {
    status: jest.fn(() => res),
    send: jest.fn(() => res),
  };
  return res;
};

describe("TableController", () => {
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

  describe("getTables", () => {
    it("should return all tables successfully", async () => {
      const mockTables = [
        {
          tableId: "A1",
          zone: "ZONA A",
          status: TableStatus.DISPONIBLE,
          bills: [],
        },
        {
          tableId: "B2",
          zone: "ZONA B",
          status: TableStatus.OCUPADA,
          bills: [],
        },
      ];

      mockService.getAll.mockResolvedValue(mockTables);
      const req = mockRequest();
      const res = mockResponse();

      await getTables(req, res);

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Mesas obtenidas correctamente",
        data: mockTables,
      });
      expect(console.log).toHaveBeenCalledWith("Mesas obtenidas correctamente");
    });

    it("should handle errors when getting all tables", async () => {
      const errorMessage = "Database error";
      mockService.getAll.mockRejectedValue(new Error(errorMessage));
      const req = mockRequest();
      const res = mockResponse();

      await getTables(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: `Error al obtener las mesas: ${errorMessage}`,
      });
    });
  });

  describe("getTableById", () => {
    it("should return a table by id successfully", async () => {
      const tableId = "A1";
      const mockTable = {
        tableId: "A1",
        zone: "ZONA A",
        status: TableStatus.DISPONIBLE,
        bills: [],
      };

      (tableIdSchema.parse as jest.Mock).mockReturnValue({ id: tableId });
      mockService.getById.mockResolvedValue(mockTable);
      const req = mockRequest({}, { id: tableId });
      const res = mockResponse();

      await getTableById(req, res);

      expect(tableIdSchema.parse).toHaveBeenCalledWith({ id: tableId });
      expect(mockService.getById).toHaveBeenCalledWith(tableId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Mesa obtenida correctamente",
        data: mockTable,
      });
    });

    it("should handle validation error for invalid id", async () => {
      const error = {
        name: "ZodError",
        issues: [{ message: "ID inválido", path: ["id"] }],
      };
      (tableIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });
      const req = mockRequest({}, { id: "invalid" });
      const res = mockResponse();

      await getTableById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "ID inválido: ID inválido",
      });
    });

    it("should handle table not found error", async () => {
      const tableId = "Z99";
      (tableIdSchema.parse as jest.Mock).mockReturnValue({ id: tableId });
      mockService.getById.mockRejectedValue(
        new Error(`Mesa con ID ${tableId} no encontrada`),
      );
      const req = mockRequest({}, { id: tableId });
      const res = mockResponse();

      await getTableById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: `Mesa con ID ${tableId} no encontrada`,
      });
    });
  });

  describe("saveTable", () => {
    it("should create a table successfully", async () => {
      const tableData = {
        tableId: "C3",
        zone: "ZONA C",
        status: TableStatus.DISPONIBLE,
      };

      (createTableSchema.parse as jest.Mock).mockReturnValue(tableData);
      mockService.save.mockResolvedValue(tableData);
      const req = mockRequest(tableData);
      const res = mockResponse();

      await saveTable(req, res);

      expect(createTableSchema.parse).toHaveBeenCalledWith(tableData);
      expect(mockService.save).toHaveBeenCalledWith(tableData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Mesa creada correctamente",
        data: tableData,
      });
    });

    it("should handle validation errors", async () => {
      const tableData = {
        tableId: "",
        zone: "ZONA A",
      };
      const error = {
        name: "ZodError",
        issues: [
          {
            message: "El ID de la mesa es requerido",
            path: ["tableId"],
            code: "invalid_string",
          },
        ],
      };
      (createTableSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });
      const req = mockRequest(tableData);
      const res = mockResponse();

      await saveTable(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Datos inválidos: El ID de la mesa es requerido",
        campo: ["tableId"],
        error: "invalid_string",
      });
    });

    it("should handle duplicate table error", async () => {
      const tableData = {
        tableId: "A1",
        zone: "ZONA A",
      };
      (createTableSchema.parse as jest.Mock).mockReturnValue(tableData);
      mockService.save.mockRejectedValue(
        new Error("La mesa con ID A1 ya existe"),
      );
      const req = mockRequest(tableData);
      const res = mockResponse();

      await saveTable(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "La mesa con ID A1 ya existe",
      });
    });
  });

  describe("updateTable", () => {
    it("should update a table successfully", async () => {
      const tableId = "A1";
      const updateData = {
        zone: "ZONA A PREMIUM",
        status: TableStatus.RESERVADA,
      };
      const updatedTable = {
        tableId: "A1",
        ...updateData,
      };

      (tableIdSchema.parse as jest.Mock).mockReturnValue({ id: tableId });
      (updateTableSchema.parse as jest.Mock).mockReturnValue(updateData);
      mockService.update.mockResolvedValue(updatedTable);
      const req = mockRequest(updateData, { id: tableId });
      const res = mockResponse();

      await updateTable(req, res);

      expect(tableIdSchema.parse).toHaveBeenCalledWith({ id: tableId });
      expect(updateTableSchema.parse).toHaveBeenCalledWith(updateData);
      expect(mockService.update).toHaveBeenCalledWith({
        tableId,
        ...updateData,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Mesa actualizada correctamente",
        data: updatedTable,
      });
    });

    it("should handle table not found during update", async () => {
      const tableId = "Z99";
      const updateData = { zone: "ZONA Z" };
      (tableIdSchema.parse as jest.Mock).mockReturnValue({ id: tableId });
      (updateTableSchema.parse as jest.Mock).mockReturnValue(updateData);
      mockService.update.mockRejectedValue(
        new Error(`Mesa con ID ${tableId} no encontrada`),
      );
      const req = mockRequest(updateData, { id: tableId });
      const res = mockResponse();

      await updateTable(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: `Mesa con ID ${tableId} no encontrada`,
      });
    });
  });

  describe("deleteTable", () => {
    it("should delete a table successfully", async () => {
      const tableId = "A1";
      const deleteResult = {
        message: "Mesa eliminada correctamente",
        id: tableId,
      };

      (tableIdSchema.parse as jest.Mock).mockReturnValue({ id: tableId });
      mockService.delete.mockResolvedValue(deleteResult);
      const req = mockRequest({}, { id: tableId });
      const res = mockResponse();

      await deleteTable(req, res);

      expect(tableIdSchema.parse).toHaveBeenCalledWith({ id: tableId });
      expect(mockService.delete).toHaveBeenCalledWith(tableId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Mesa eliminada correctamente",
        data: deleteResult,
      });
    });

    it("should handle table not found during delete", async () => {
      const tableId = "Z99";
      (tableIdSchema.parse as jest.Mock).mockReturnValue({ id: tableId });
      mockService.delete.mockRejectedValue(
        new Error(`Mesa con ID ${tableId} no encontrada`),
      );
      const req = mockRequest({}, { id: tableId });
      const res = mockResponse();

      await deleteTable(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: `Mesa con ID ${tableId} no encontrada`,
      });
    });
  });

  describe("getTablesByZone", () => {
    it("should return tables by zone successfully", async () => {
      const zone = "ZONA A";
      const mockTables = [
        {
          tableId: "A1",
          zone: "ZONA A",
          status: TableStatus.DISPONIBLE,
          bills: [],
        },
        {
          tableId: "A2",
          zone: "ZONA A",
          status: TableStatus.OCUPADA,
          bills: [],
        },
      ];

      mockService.getByZone.mockResolvedValue(mockTables);
      const req = mockRequest({}, { zone });
      const res = mockResponse();

      await getTablesByZone(req, res);

      expect(mockService.getByZone).toHaveBeenCalledWith(zone);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Mesas de la zona obtenidas correctamente",
        data: mockTables,
      });
    });

    it("should handle errors when getting tables by zone", async () => {
      const zone = "ZONA X";
      mockService.getByZone.mockRejectedValue(new Error("Database error"));
      const req = mockRequest({}, { zone });
      const res = mockResponse();

      await getTablesByZone(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error al obtener las mesas de la zona: Database error",
      });
    });
  });

  describe("getTablesByStatus", () => {
    it("should return tables by status successfully", async () => {
      const status = TableStatus.DISPONIBLE;
      const mockTables = [
        {
          tableId: "A1",
          zone: "ZONA A",
          status: TableStatus.DISPONIBLE,
          bills: [],
        },
      ];

      mockService.getByStatus.mockResolvedValue(mockTables);
      const req = mockRequest({}, { status });
      const res = mockResponse();

      await getTablesByStatus(req, res);

      expect(mockService.getByStatus).toHaveBeenCalledWith(status);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: `Mesas con estado ${status} obtenidas correctamente`,
        data: mockTables,
      });
    });

    it("should handle invalid status", async () => {
      const invalidStatus = "invalid_status";
      const req = mockRequest({}, { status: invalidStatus });
      const res = mockResponse();

      await getTablesByStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: `Estado inválido. Debe ser uno de: ${Object.values(TableStatus).join(", ")}`,
      });
    });
  });

  describe("getAvailableTables", () => {
    it("should return available tables successfully", async () => {
      const mockTables = [
        {
          tableId: "A1",
          zone: "ZONA A",
          status: TableStatus.DISPONIBLE,
          bills: [],
        },
        {
          tableId: "B1",
          zone: "ZONA B",
          status: TableStatus.DISPONIBLE,
          bills: [],
        },
      ];

      mockService.getAvailableTables.mockResolvedValue(mockTables);
      const req = mockRequest();
      const res = mockResponse();

      await getAvailableTables(req, res);

      expect(mockService.getAvailableTables).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Mesas disponibles obtenidas correctamente",
        data: mockTables,
      });
    });

    it("should handle errors when getting available tables", async () => {
      mockService.getAvailableTables.mockRejectedValue(
        new Error("Database error"),
      );
      const req = mockRequest();
      const res = mockResponse();

      await getAvailableTables(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error al obtener las mesas disponibles: Database error",
      });
    });
  });

  describe("updateTableStatus", () => {
    it("should update table status successfully", async () => {
      const tableId = "A1";
      const status = TableStatus.OCUPADA;
      const updatedTable = {
        tableId: "A1",
        zone: "ZONA A",
        status: TableStatus.OCUPADA,
        bills: [],
      };

      (tableIdSchema.parse as jest.Mock).mockReturnValue({ id: tableId });
      mockService.updateTableStatus.mockResolvedValue(updatedTable);
      const req = mockRequest({ status }, { id: tableId });
      const res = mockResponse();

      await updateTableStatus(req, res);

      expect(tableIdSchema.parse).toHaveBeenCalledWith({ id: tableId });
      expect(mockService.updateTableStatus).toHaveBeenCalledWith(
        tableId,
        status,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        status: "success",
        message: "Estado de mesa actualizado correctamente",
        data: updatedTable,
      });
    });

    it("should handle invalid status", async () => {
      const tableId = "A1";
      const invalidStatus = "invalid_status";

      (tableIdSchema.parse as jest.Mock).mockReturnValue({ id: tableId });
      const req = mockRequest({ status: invalidStatus }, { id: tableId });
      const res = mockResponse();

      await updateTableStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: `Estado inválido. Debe ser uno de: ${Object.values(TableStatus).join(", ")}`,
      });
    });

    it("should handle missing status", async () => {
      const tableId = "A1";

      (tableIdSchema.parse as jest.Mock).mockReturnValue({ id: tableId });
      const req = mockRequest({}, { id: tableId });
      const res = mockResponse();

      await updateTableStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: `Estado inválido. Debe ser uno de: ${Object.values(TableStatus).join(", ")}`,
      });
    });

    it("should handle table not found during status update", async () => {
      const tableId = "Z99";
      const status = TableStatus.OCUPADA;

      (tableIdSchema.parse as jest.Mock).mockReturnValue({ id: tableId });
      mockService.updateTableStatus.mockRejectedValue(
        new Error(`Mesa con ID ${tableId} no encontrada`),
      );
      const req = mockRequest({ status }, { id: tableId });
      const res = mockResponse();

      await updateTableStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        status: "error",
        message: `Mesa con ID ${tableId} no encontrada`,
      });
    });
  });
});
