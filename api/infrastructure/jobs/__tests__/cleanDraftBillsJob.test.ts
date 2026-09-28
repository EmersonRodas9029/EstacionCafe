import { Repository } from "typeorm";
import { Bill } from "../../../core/entities/Bill";
import { Status } from "../../../core/enums/Status";
import { AppDataSource } from "../../db/Connection";
import { runCleanDraftBillsNow } from "../cleanDraftBillsJob";

jest.mock("../../db/Connection");

describe("cleanDraftBillsJob", () => {
  let mockBillRepository: jest.Mocked<Repository<Bill>>;

  beforeEach(() => {
    // Mock del repositorio de Bill
    mockBillRepository = {
      delete: jest.fn(),
    } as any;

    // Mock del AppDataSource
    (AppDataSource as any).isInitialized = true;
    (AppDataSource as any).getRepository = jest
      .fn()
      .mockReturnValue(mockBillRepository);

    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("runCleanDraftBillsNow", () => {
    it("debería eliminar bills con status DRAFT exitosamente", async () => {
      const mockResult = { affected: 5, raw: [] };
      mockBillRepository.delete.mockResolvedValue(mockResult);

      const result = await runCleanDraftBillsNow();

      expect(AppDataSource.getRepository).toHaveBeenCalledWith(Bill);
      expect(mockBillRepository.delete).toHaveBeenCalledWith({
        status: Status.DRAFT,
      });
      expect(result).toEqual({ deleted: 5 });
    });

    it("debería retornar 0 cuando no hay bills draft para eliminar", async () => {
      const mockResult = { affected: 0, raw: [] };
      mockBillRepository.delete.mockResolvedValue(mockResult);

      const result = await runCleanDraftBillsNow();

      expect(mockBillRepository.delete).toHaveBeenCalledWith({
        status: Status.DRAFT,
      });
      expect(result).toEqual({ deleted: 0 });
    });

    it("debería retornar 0 cuando affected es undefined", async () => {
      const mockResult = { affected: undefined, raw: [] };
      mockBillRepository.delete.mockResolvedValue(mockResult);

      const result = await runCleanDraftBillsNow();

      expect(mockBillRepository.delete).toHaveBeenCalledWith({
        status: Status.DRAFT,
      });
      expect(result).toEqual({ deleted: 0 });
    });

    it("debería lanzar error cuando DataSource no está inicializado", async () => {
      (AppDataSource as any).isInitialized = false;

      await expect(runCleanDraftBillsNow()).rejects.toThrow(
        "DataSource no está inicializado",
      );

      expect(mockBillRepository.delete).not.toHaveBeenCalled();
    });

    it("debería manejar errores del repositorio", async () => {
      const errorDb = new Error("Error de conexión a la base de datos");
      mockBillRepository.delete.mockRejectedValue(errorDb);

      await expect(runCleanDraftBillsNow()).rejects.toThrow(
        "Error de conexión a la base de datos",
      );

      expect(mockBillRepository.delete).toHaveBeenCalledWith({
        status: Status.DRAFT,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error al ejecutar limpieza manual:",
        errorDb.message,
      );
    });

    it("debería eliminar múltiples bills draft", async () => {
      const mockResult = { affected: 15, raw: [] };
      mockBillRepository.delete.mockResolvedValue(mockResult);

      const result = await runCleanDraftBillsNow();

      expect(mockBillRepository.delete).toHaveBeenCalledWith({
        status: Status.DRAFT,
      });
      expect(result).toEqual({ deleted: 15 });
    });

    it("debería llamar al repositorio con el status correcto", async () => {
      const mockResult = { affected: 3, raw: [] };
      mockBillRepository.delete.mockResolvedValue(mockResult);

      await runCleanDraftBillsNow();

      expect(mockBillRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockBillRepository.delete).toHaveBeenCalledWith({
        status: Status.DRAFT,
      });
      // Verificar que NO se llama con otros status
      expect(mockBillRepository.delete).not.toHaveBeenCalledWith({
        status: Status.OPEN,
      });
      expect(mockBillRepository.delete).not.toHaveBeenCalledWith({
        status: Status.CLOSED,
      });
    });
  });
});
