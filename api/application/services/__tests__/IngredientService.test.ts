import { Repository } from "typeorm";
import { IngredientService } from "../IngredientService";
import { Ingredient } from "../../../core/entities/Ingredient";
import { SaveIngredientDTO } from "../../DTOs/IngredientDTOs";

describe("IngredientService", () => {
  let ingredientService: IngredientService;
  let mockRepository: jest.Mocked<Repository<Ingredient>>;

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
    ingredientService = new IngredientService(mockRepository);

    // Limpiar console.log
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("debería guardar un ingrediente exitosamente", async () => {
      const ingredientData: SaveIngredientDTO = {
        name: "Leche",
        quantity: 250.5,
        productId: 1,
        consumableId: 2,
      };

      const savedIngredient = {
        ingredientId: 1,
        name: "Leche",
        quantity: 250.5,
        productId: 1,
        consumableId: 2,
      } as Ingredient;

      mockRepository.save.mockResolvedValue(savedIngredient);

      const result = await ingredientService.save(ingredientData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Leche",
          quantity: 250.5,
          productId: 1,
          consumableId: 2,
        })
      );
      expect(result).toEqual(savedIngredient);
      expect(console.log).toHaveBeenCalledWith("Guardando ingrediente...");
    });

    it("debería crear una entidad Ingredient con los datos correctos", async () => {
      const ingredientData: SaveIngredientDTO = {
        name: "Azúcar",
        quantity: 100,
        productId: 3,
        consumableId: 4,
      };

      mockRepository.save.mockResolvedValue({} as Ingredient);

      let savedEntity: any;
      mockRepository.save.mockImplementation((ingredient) => {
        savedEntity = ingredient;
        return Promise.resolve({ ingredientId: 1, ...ingredient } as Ingredient);
      });

      await ingredientService.save(ingredientData);

      expect(savedEntity).toBeInstanceOf(Ingredient);
      expect(savedEntity.name).toBe("Azúcar");
      expect(savedEntity.quantity).toBe(100);
      expect(savedEntity.productId).toBe(3);
      expect(savedEntity.consumableId).toBe(4);
    });

    it("debería manejar errores del repositorio", async () => {
      const ingredientData: SaveIngredientDTO = {
        name: "Café",
        quantity: 50,
        productId: 1,
        consumableId: 1,
      };

      const repositoryError = new Error("Error de base de datos");
      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(ingredientService.save(ingredientData)).rejects.toThrow("Error de base de datos");
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("debería manejar cantidades decimales", async () => {
      const ingredientData: SaveIngredientDTO = {
        name: "Canela",
        quantity: 0.25,
        productId: 5,
        consumableId: 6,
      };

      mockRepository.save.mockResolvedValue({} as Ingredient);

      await ingredientService.save(ingredientData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 0.25,
        })
      );
    });
  });

  describe("saveAll", () => {
    it("debería guardar múltiples ingredientes exitosamente", async () => {
      const ingredientsData: SaveIngredientDTO[] = [
        {
          name: "Leche",
          quantity: 250,
          productId: 1,
          consumableId: 2,
        },
        {
          name: "Azúcar",
          quantity: 50,
          productId: 1,
          consumableId: 3,
        },
      ];

      const savedIngredients = [
        { ingredientId: 1, ...ingredientsData[0] },
        { ingredientId: 2, ...ingredientsData[1] },
      ] as Ingredient[];

      mockRepository.save.mockResolvedValue(savedIngredients as any);

      const result = await ingredientService.saveAll(ingredientsData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Leche",
            quantity: 250,
            productId: 1,
            consumableId: 2,
          }),
          expect.objectContaining({
            name: "Azúcar",
            quantity: 50,
            productId: 1,
            consumableId: 3,
          }),
        ])
      );
      expect(result).toEqual(savedIngredients);
      expect(console.log).toHaveBeenCalledWith("Guardando múltiples ingredientes...");
    });

    it("debería manejar array vacío", async () => {
      mockRepository.save.mockResolvedValue([] as any);

      const result = await ingredientService.saveAll([]);

      expect(mockRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it("debería crear entidades Ingredient para cada elemento", async () => {
      const ingredientsData: SaveIngredientDTO[] = [
        {
          name: "Ingrediente 1",
          quantity: 100,
          productId: 1,
          consumableId: 1,
        },
      ];

      let savedEntities: any[];
      mockRepository.save.mockImplementation((ingredients: any) => {
        savedEntities = ingredients as any[];
        return Promise.resolve(ingredients as any);
      });

      await ingredientService.saveAll(ingredientsData);

      expect(savedEntities![0]).toBeInstanceOf(Ingredient);
      expect(savedEntities![0].name).toBe("Ingrediente 1");
    });
  });

  describe("delete", () => {
    it("debería eliminar un ingrediente exitosamente", async () => {
      const ingredientId = 1;
      const deleteResult = { affected: 1 };

      mockRepository.delete.mockResolvedValue(deleteResult as any);

      const result = await ingredientService.delete(ingredientId);

      expect(mockRepository.delete).toHaveBeenCalledWith(ingredientId);
      expect(result).toEqual({
        message: "Ingrediente eliminado correctamente",
        id: ingredientId,
      });
      expect(console.log).toHaveBeenCalledWith(`Eliminando ingrediente con ID: ${ingredientId}`);
    });

    it("debería lanzar error cuando el ingrediente no existe", async () => {
      const ingredientId = 999;
      const deleteResult = { affected: 0 };

      mockRepository.delete.mockResolvedValue(deleteResult as any);

      await expect(ingredientService.delete(ingredientId)).rejects.toThrow(
        `Ingrediente con ID ${ingredientId} no encontrado`
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(ingredientId);
    });

    it("debería manejar errores del repositorio", async () => {
      const ingredientId = 1;
      const repositoryError = new Error("Error de conexión");

      mockRepository.delete.mockRejectedValue(repositoryError);

      await expect(ingredientService.delete(ingredientId)).rejects.toThrow("Error de conexión");
      expect(mockRepository.delete).toHaveBeenCalledWith(ingredientId);
    });
  });

  describe("update", () => {
    it("debería actualizar un ingrediente exitosamente", async () => {
      const updateData = {
        ingredientId: 1,
        name: "Leche Actualizada",
        quantity: 300,
      };

      const existingIngredient = {
        ingredientId: 1,
        name: "Leche",
        quantity: 250,
        productId: 1,
        consumableId: 2,
      } as Ingredient;

      const updatedIngredient = {
        ...existingIngredient,
        name: "Leche Actualizada",
        quantity: 300,
      } as Ingredient;

      mockRepository.findOne.mockResolvedValue(existingIngredient);
      mockRepository.save.mockResolvedValue(updatedIngredient);

      const result = await ingredientService.update(updateData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { ingredientId: 1 },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredientId: 1,
          name: "Leche Actualizada",
          quantity: 300,
          productId: 1,
          consumableId: 2,
        })
      );
      expect(result).toEqual(updatedIngredient);
      expect(console.log).toHaveBeenCalledWith("Actualizando ingrediente con ID: 1");
    });

    it("debería actualizar solo los campos proporcionados", async () => {
      const updateData = {
        ingredientId: 1,
        quantity: 400,
      };

      const existingIngredient = {
        ingredientId: 1,
        name: "Leche Original",
        quantity: 250,
        productId: 1,
        consumableId: 2,
      } as Ingredient;

      mockRepository.findOne.mockResolvedValue(existingIngredient);
      mockRepository.save.mockResolvedValue(existingIngredient);

      await ingredientService.update(updateData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Leche Original", // No cambió
          quantity: 400, // Cambió
          productId: 1, // No cambió
          consumableId: 2, // No cambió
        })
      );
    });

    it("debería lanzar error cuando el ingrediente no existe", async () => {
      const updateData = {
        ingredientId: 999,
        name: "No existe",
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(ingredientService.update(updateData)).rejects.toThrow(
        "Ingrediente con ID 999 no encontrado"
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { ingredientId: 999 },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería manejar errores del repositorio en findOne", async () => {
      const updateData = {
        ingredientId: 1,
        name: "Test",
      };

      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(ingredientService.update(updateData)).rejects.toThrow("Error de consulta");
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getAll", () => {
    it("debería obtener todos los ingredientes con relaciones", async () => {
      const mockIngredients = [
        {
          ingredientId: 1,
          name: "Leche",
          quantity: 250,
          productId: 1,
          consumableId: 2,
          product: { productId: 1, name: "Café Latte" },
          consumable: { consumableId: 2, name: "Leche Entera" },
        },
        {
          ingredientId: 2,
          name: "Azúcar",
          quantity: 50,
          productId: 1,
          consumableId: 3,
          product: { productId: 1, name: "Café Latte" },
          consumable: { consumableId: 3, name: "Azúcar Blanca" },
        },
      ] as Ingredient[];

      mockRepository.find.mockResolvedValue(mockIngredients);

      const result = await ingredientService.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ["product", "consumable"],
        order: { name: "ASC" },
      });
      expect(result).toEqual(mockIngredients);
      expect(console.log).toHaveBeenCalledWith("Obteniendo ingredientes...");
    });

    it("debería retornar array vacío cuando no hay ingredientes", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await ingredientService.getAll();

      expect(result).toEqual([]);
      expect(console.log).toHaveBeenCalledWith("Obteniendo ingredientes...");
    });

    it("debería manejar errores del repositorio", async () => {
      const repositoryError = new Error("Error de conexión");
      mockRepository.find.mockRejectedValue(repositoryError);

      await expect(ingredientService.getAll()).rejects.toThrow("Error de conexión");
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("debería obtener un ingrediente por ID con relaciones", async () => {
      const ingredientId = 1;
      const mockIngredient = {
        ingredientId: 1,
        name: "Leche",
        quantity: 250,
        productId: 1,
        consumableId: 2,
        product: { productId: 1, name: "Café Latte" },
        consumable: { consumableId: 2, name: "Leche Entera" },
      } as Ingredient;

      mockRepository.findOne.mockResolvedValue(mockIngredient);

      const result = await ingredientService.getById(ingredientId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { ingredientId: 1 },
        relations: ["product", "consumable"],
      });
      expect(result).toEqual(mockIngredient);
      expect(console.log).toHaveBeenCalledWith("Obteniendo ingrediente con ID: 1");
    });

    it("debería retornar null cuando el ingrediente no existe", async () => {
      const ingredientId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      const result = await ingredientService.getById(ingredientId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { ingredientId: 999 },
        relations: ["product", "consumable"],
      });
      expect(result).toBeNull();
    });

    it("debería manejar errores del repositorio", async () => {
      const ingredientId = 1;
      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(ingredientService.getById(ingredientId)).rejects.toThrow("Error de consulta");
      expect(mockRepository.findOne).toHaveBeenCalled();
    });
  });

  describe("getIngredientsByProduct", () => {
    it("debería obtener ingredientes por productId", async () => {
      const productId = 1;
      const mockIngredients = [
        {
          ingredientId: 1,
          name: "Leche",
          quantity: 250,
          productId: 1,
          consumableId: 2,
        },
        {
          ingredientId: 2,
          name: "Azúcar",
          quantity: 50,
          productId: 1,
          consumableId: 3,
        },
      ] as Ingredient[];

      mockRepository.find.mockResolvedValue(mockIngredients);

      const result = await ingredientService.getIngredientsByProduct(productId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { productId: 1 },
        relations: ["product", "consumable"],
        order: { name: "ASC" },
      });
      expect(result).toEqual(mockIngredients);
      expect(console.log).toHaveBeenCalledWith("Obteniendo ingredientes del producto con ID: 1");
    });

    it("debería retornar array vacío cuando no hay ingredientes para el producto", async () => {
      const productId = 999;
      mockRepository.find.mockResolvedValue([]);

      const result = await ingredientService.getIngredientsByProduct(productId);

      expect(result).toEqual([]);
    });
  });

  describe("getIngredientsByConsumable", () => {
    it("debería obtener ingredientes por consumableId", async () => {
      const consumableId = 2;
      const mockIngredients = [
        {
          ingredientId: 1,
          name: "Café con Leche",
          quantity: 250,
          productId: 1,
          consumableId: 2,
        },
        {
          ingredientId: 3,
          name: "Cappuccino",
          quantity: 150,
          productId: 3,
          consumableId: 2,
        },
      ] as Ingredient[];

      mockRepository.find.mockResolvedValue(mockIngredients);

      const result = await ingredientService.getIngredientsByConsumable(consumableId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { consumableId: 2 },
        relations: ["product", "consumable"],
        order: { name: "ASC" },
      });
      expect(result).toEqual(mockIngredients);
      expect(console.log).toHaveBeenCalledWith("Obteniendo ingredientes del consumible con ID: 2");
    });

    it("debería retornar array vacío cuando no hay ingredientes para el consumible", async () => {
      const consumableId = 999;
      mockRepository.find.mockResolvedValue([]);

      const result = await ingredientService.getIngredientsByConsumable(consumableId);

      expect(result).toEqual([]);
    });
  });

  describe("Casos de integración", () => {
    it("debería manejar flujo completo de CRUD", async () => {
      const ingredientData: SaveIngredientDTO = {
        name: "Vainilla",
        quantity: 10,
        productId: 5,
        consumableId: 6,
      };

      const savedIngredient = {
        ingredientId: 1,
        ...ingredientData,
      } as Ingredient;

      const updateData = {
        ingredientId: 1,
        quantity: 20,
      };

      const updatedIngredient = {
        ...savedIngredient,
        quantity: 20,
      } as Ingredient;

      // 1. Guardar
      mockRepository.save.mockResolvedValueOnce(savedIngredient);
      const saveResult = await ingredientService.save(ingredientData);
      expect(saveResult).toEqual(savedIngredient);

      // 2. Obtener por ID
      mockRepository.findOne.mockResolvedValueOnce(savedIngredient);
      const getResult = await ingredientService.getById(1);
      expect(getResult).toEqual(savedIngredient);

      // 3. Actualizar
      mockRepository.findOne.mockResolvedValueOnce(savedIngredient);
      mockRepository.save.mockResolvedValueOnce(updatedIngredient);
      const updateResult = await ingredientService.update(updateData);
      expect(updateResult).toEqual(updatedIngredient);

      // 4. Eliminar
      mockRepository.delete.mockResolvedValueOnce({ affected: 1 } as any);
      const deleteResult = await ingredientService.delete(1);
      expect(deleteResult.message).toBe("Ingrediente eliminado correctamente");
    });

    it("debería manejar relaciones de ingredientes correctamente", async () => {
      const productId = 1;
      const consumableId = 2;

      const ingredientsByProduct = [
        { ingredientId: 1, name: "Ingrediente 1", productId, consumableId: 2 },
        { ingredientId: 2, name: "Ingrediente 2", productId, consumableId: 3 },
      ] as Ingredient[];

      const ingredientsByConsumable = [
        { ingredientId: 1, name: "Ingrediente 1", productId: 1, consumableId },
        { ingredientId: 3, name: "Ingrediente 3", productId: 2, consumableId },
      ] as Ingredient[];

      mockRepository.find
        .mockResolvedValueOnce(ingredientsByProduct)
        .mockResolvedValueOnce(ingredientsByConsumable);

      const productResults = await ingredientService.getIngredientsByProduct(productId);
      const consumableResults = await ingredientService.getIngredientsByConsumable(consumableId);

      expect(productResults).toHaveLength(2);
      expect(consumableResults).toHaveLength(2);
      expect(productResults[0].productId).toBe(productId);
      expect(consumableResults[0].consumableId).toBe(consumableId);
    });
  });

  describe("Validaciones de datos", () => {
    it("debería manejar cantidades con decimales precisos", async () => {
      const ingredientData: SaveIngredientDTO = {
        name: "Esencia",
        quantity: 0.5,
        productId: 1,
        consumableId: 2,
      };

      mockRepository.save.mockResolvedValue({} as Ingredient);

      await ingredientService.save(ingredientData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 0.5,
        })
      );
    });

    it("debería manejar nombres con caracteres especiales", async () => {
      const ingredientData: SaveIngredientDTO = {
        name: "Café 100% Arábica",
        quantity: 25.75,
        productId: 1,
        consumableId: 2,
      };

      mockRepository.save.mockResolvedValue({} as Ingredient);

      await ingredientService.save(ingredientData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Café 100% Arábica",
        })
      );
    });

    it("debería manejar IDs grandes", async () => {
      const ingredientData: SaveIngredientDTO = {
        name: "Test",
        quantity: 100,
        productId: 999999,
        consumableId: 888888,
      };

      mockRepository.save.mockResolvedValue({} as Ingredient);

      await ingredientService.save(ingredientData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 999999,
          consumableId: 888888,
        })
      );
    });
  });
});