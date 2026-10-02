import { ProductService } from "../ProductService";
import { Repository } from "typeorm";
import { Product } from "../../../core/entities/Producto";
import { SaveProductDTO, UpdateProductDTO } from "../../DTOs/ProductDTO";

describe("ProductService", () => {
  let productService: ProductService;
  let mockRepository: jest.Mocked<Repository<Product>>;

  beforeEach(() => {
    // Create mock repository with all necessary methods
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    productService = new ProductService(mockRepository);

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("should save a product successfully with default active true", async () => {
      const saveProductDTO: SaveProductDTO = {
        name: "Café Americano",
        description: "Café negro tradicional",
        price: 3.50,
        cost: 1.20,
      };

      const expectedProduct = new Product();
      expectedProduct.productId = 1;
      expectedProduct.name = saveProductDTO.name;
      expectedProduct.description = saveProductDTO.description;
      expectedProduct.price = saveProductDTO.price;
      expectedProduct.cost = saveProductDTO.cost;
      expectedProduct.active = true;

      mockRepository.save.mockResolvedValue(expectedProduct);

      const result = await productService.save(saveProductDTO);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        name: saveProductDTO.name,
        description: saveProductDTO.description,
        price: saveProductDTO.price,
        cost: saveProductDTO.cost,
        active: true,
      }));
      expect(result).toEqual(expectedProduct);
      expect(console.log).toHaveBeenCalledWith("Guardando producto...");
    });

    it("should save a product with explicit active value", async () => {
      const saveProductDTO: SaveProductDTO = {
        name: "Café Descontinuado",
        description: "Producto fuera de servicio",
        price: 5.00,
        cost: 2.00,
        active: false,
      };

      const expectedProduct = new Product();
      expectedProduct.productId = 1;
      expectedProduct.name = saveProductDTO.name;
      expectedProduct.description = saveProductDTO.description;
      expectedProduct.price = saveProductDTO.price;
      expectedProduct.cost = saveProductDTO.cost;
      expectedProduct.active = false;

      mockRepository.save.mockResolvedValue(expectedProduct);

      const result = await productService.save(saveProductDTO);

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        name: saveProductDTO.name,
        description: saveProductDTO.description,
        price: saveProductDTO.price,
        cost: saveProductDTO.cost,
        active: false,
      }));
      expect(result).toEqual(expectedProduct);
    });

    it("should handle database errors during save", async () => {
      const saveProductDTO: SaveProductDTO = {
        name: "Café Americano",
        description: "Café negro tradicional",
        price: 3.50,
        cost: 1.20,
      };

      const databaseError = new Error("Database connection failed");
      mockRepository.save.mockRejectedValue(databaseError);

      await expect(productService.save(saveProductDTO)).rejects.toThrow("Database connection failed");
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveAll", () => {
    it("should save multiple products successfully", async () => {
      const saveProductDTOs: SaveProductDTO[] = [
        {
          name: "Café Americano",
          description: "Café negro tradicional",
          price: 3.50,
          cost: 1.20,
        },
        {
          name: "Cappuccino",
          description: "Café con leche espumada",
          price: 4.25,
          cost: 1.75,
          active: false,
        },
      ];

      const expectedProducts = saveProductDTOs.map((dto, index) => {
        const product = new Product();
        product.productId = index + 1;
        product.name = dto.name;
        product.description = dto.description;
        product.price = dto.price;
        product.cost = dto.cost;
        product.active = dto.active !== undefined ? dto.active : true;
        return product;
      });

      mockRepository.save.mockResolvedValue(expectedProducts as any);

      const result = await productService.saveAll(saveProductDTOs);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          name: saveProductDTOs[0].name,
          description: saveProductDTOs[0].description,
          price: saveProductDTOs[0].price,
          cost: saveProductDTOs[0].cost,
          active: true,
        }),
        expect.objectContaining({
          name: saveProductDTOs[1].name,
          description: saveProductDTOs[1].description,
          price: saveProductDTOs[1].price,
          cost: saveProductDTOs[1].cost,
          active: false,
        }),
      ]));
      expect(result).toEqual(expectedProducts);
    });

    it("should handle empty array input", async () => {
      const saveProductDTOs: SaveProductDTO[] = [];
      const expectedProducts: Product[] = [];

      mockRepository.save.mockResolvedValue(expectedProducts as any);

      const result = await productService.saveAll(saveProductDTOs);

      expect(mockRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual(expectedProducts);
    });

    it("should handle database errors during saveAll", async () => {
      const saveProductDTOs: SaveProductDTO[] = [
        {
          name: "Café Americano",
          description: "Café negro tradicional",
          price: 3.50,
          cost: 1.20,
        },
      ];

      const databaseError = new Error("Database connection failed");
      mockRepository.save.mockRejectedValue(databaseError);

      await expect(productService.saveAll(saveProductDTOs)).rejects.toThrow("Database connection failed");
    });
  });

  describe("getById", () => {
    it("should get a product by id successfully", async () => {
      const productId = 1;
      const expectedProduct = new Product();
      expectedProduct.productId = productId;
      expectedProduct.name = "Café Americano";
      expectedProduct.description = "Café negro tradicional";
      expectedProduct.price = 3.50;
      expectedProduct.cost = 1.20;
      expectedProduct.active = true;

      mockRepository.findOne.mockResolvedValue(expectedProduct);

      const result = await productService.getById(productId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { productId },
      });
      expect(result).toEqual(expectedProduct);
    });

    it("should throw error when product not found", async () => {
      const productId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(productService.getById(productId)).rejects.toThrow(`Producto con ID ${productId} no encontrado`);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { productId },
      });
    });

    it("should handle database errors during getById", async () => {
      const productId = 1;
      const databaseError = new Error("Database connection failed");
      mockRepository.findOne.mockRejectedValue(databaseError);

      await expect(productService.getById(productId)).rejects.toThrow("Database connection failed");
    });
  });

  describe("getAll", () => {
    it("should get all products successfully", async () => {
      const expectedProducts = [
        {
          productId: 1,
          name: "Café Americano",
          description: "Café negro tradicional",
          price: 3.50,
          cost: 1.20,
          active: true,
        },
        {
          productId: 2,
          name: "Cappuccino",
          description: "Café con leche espumada",
          price: 4.25,
          cost: 1.75,
          active: false,
        },
      ] as Product[];

      mockRepository.find.mockResolvedValue(expectedProducts);

      const result = await productService.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { name: "ASC" },
      });
      expect(result).toEqual(expectedProducts);
      expect(console.log).toHaveBeenCalledWith("Obteniendo productos...");
    });

    it("should return empty array when no products found", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await productService.getAll();

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it("should handle database errors during getAll", async () => {
      const databaseError = new Error("Database connection failed");
      mockRepository.find.mockRejectedValue(databaseError);

      await expect(productService.getAll()).rejects.toThrow("Database connection failed");
    });
  });

  describe("update", () => {
    it("should update a product successfully", async () => {
      const updateProductDTO: UpdateProductDTO = {
        productId: 1,
        name: "Café Americano Premium",
        description: "Café negro de alta calidad",
        price: 4.00,
        cost: 1.50,
      };

      const existingProduct = new Product();
      existingProduct.productId = 1;
      existingProduct.name = "Café Americano";
      existingProduct.description = "Café negro tradicional";
      existingProduct.price = 3.50;
      existingProduct.cost = 1.20;
      existingProduct.active = true;

      const updatedProduct = { ...existingProduct };
      updatedProduct.name = updateProductDTO.name!;
      updatedProduct.description = updateProductDTO.description!;
      updatedProduct.price = updateProductDTO.price!;
      updatedProduct.cost = updateProductDTO.cost!;

      mockRepository.findOne.mockResolvedValue(existingProduct);
      mockRepository.save.mockResolvedValue(updatedProduct);

      const result = await productService.update(updateProductDTO);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { productId: updateProductDTO.productId },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        productId: updateProductDTO.productId,
        name: updateProductDTO.name,
        description: updateProductDTO.description,
        price: updateProductDTO.price,
        cost: updateProductDTO.cost,
      }));
      expect(result).toEqual(updatedProduct);
    });

    it("should update only specified fields", async () => {
      const updateProductDTO: UpdateProductDTO = {
        productId: 1,
        price: 4.00,
        cost: 1.50,
      };

      const existingProduct = new Product();
      existingProduct.productId = 1;
      existingProduct.name = "Café Americano";
      existingProduct.description = "Café negro tradicional";
      existingProduct.price = 3.50;
      existingProduct.cost = 1.20;
      existingProduct.active = true;

      const updatedProduct = { ...existingProduct };
      updatedProduct.price = updateProductDTO.price!;
      updatedProduct.cost = updateProductDTO.cost!;

      mockRepository.findOne.mockResolvedValue(existingProduct);
      mockRepository.save.mockResolvedValue(updatedProduct);

      const result = await productService.update(updateProductDTO);

      expect(result.price).toBe(4.00);
      expect(result.cost).toBe(1.50);
      expect(result.name).toBe("Café Americano"); // Should remain unchanged
      expect(result.description).toBe("Café negro tradicional"); // Should remain unchanged
    });

    it("should handle update with no fields to change", async () => {
      const updateProductDTO: UpdateProductDTO = {
        productId: 1,
      };

      const existingProduct = new Product();
      existingProduct.productId = 1;
      existingProduct.name = "Café Americano";
      existingProduct.description = "Café negro tradicional";
      existingProduct.price = 3.50;
      existingProduct.cost = 1.20;
      existingProduct.active = true;

      mockRepository.findOne.mockResolvedValue(existingProduct);
      mockRepository.save.mockResolvedValue(existingProduct);

      const result = await productService.update(updateProductDTO);

      expect(result).toEqual(existingProduct);
      expect(mockRepository.save).toHaveBeenCalledWith(existingProduct);
    });

    it("should throw error when productId is not provided", async () => {
      const updateProductDTO: UpdateProductDTO = {
        name: "Café Americano Premium",
        price: 4.00,
      };

      await expect(productService.update(updateProductDTO)).rejects.toThrow("productId es requerido para actualizar");
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should throw error when product not found for update", async () => {
      const updateProductDTO: UpdateProductDTO = {
        productId: 999,
        name: "Producto Inexistente",
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(productService.update(updateProductDTO)).rejects.toThrow(`Producto con ID ${updateProductDTO.productId} no encontrado`);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { productId: updateProductDTO.productId },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should handle database errors during update", async () => {
      const updateProductDTO: UpdateProductDTO = {
        productId: 1,
        name: "Café Americano Premium",
      };

      const databaseError = new Error("Database connection failed");
      mockRepository.findOne.mockRejectedValue(databaseError);

      await expect(productService.update(updateProductDTO)).rejects.toThrow("Database connection failed");
    });
  });

  describe("delete", () => {
    it("should deactivate a product successfully (soft delete)", async () => {
      const productId = 1;
      const existingProduct = new Product();
      existingProduct.productId = productId;
      existingProduct.name = "Café Americano";
      existingProduct.description = "Café negro tradicional";
      existingProduct.price = 3.50;
      existingProduct.cost = 1.20;
      existingProduct.active = true;

      const deactivatedProduct = { ...existingProduct, active: false };

      // Mock getById call within delete method (note: there are two getById methods, we need the second one)
      mockRepository.findOne.mockResolvedValue(existingProduct);
      mockRepository.save.mockResolvedValue(deactivatedProduct);

      const result = await productService.delete(productId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { productId },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        active: false,
      }));
      expect(result).toEqual({
        message: "Producto desactivado correctamente",
        id: productId,
      });
    });

    it("should throw error when product not found for deletion", async () => {
      const productId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(productService.delete(productId)).rejects.toThrow(`Producto con ID ${productId} no encontrado`);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { productId },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should handle database errors during delete", async () => {
      const productId = 1;
      const databaseError = new Error("Database connection failed");
      mockRepository.findOne.mockRejectedValue(databaseError);

      await expect(productService.delete(productId)).rejects.toThrow("Database connection failed");
    });
  });

  describe("getActiveProducts", () => {
    it("should get only active products successfully", async () => {
      const expectedActiveProducts = [
        {
          productId: 1,
          name: "Café Americano",
          description: "Café negro tradicional",
          price: 3.50,
          cost: 1.20,
          active: true,
        },
        {
          productId: 3,
          name: "Espresso",
          description: "Café concentrado",
          price: 2.75,
          cost: 1.00,
          active: true,
        },
      ] as Product[];

      mockRepository.find.mockResolvedValue(expectedActiveProducts);

      const result = await productService.getActiveProducts();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { active: true },
        order: { name: "ASC" },
      });
      expect(result).toEqual(expectedActiveProducts);
    });

    it("should return empty array when no active products found", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await productService.getActiveProducts();

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { active: true },
        order: { name: "ASC" },
      });
    });

    it("should handle database errors during getActiveProducts", async () => {
      const databaseError = new Error("Database connection failed");
      mockRepository.find.mockRejectedValue(databaseError);

      await expect(productService.getActiveProducts()).rejects.toThrow("Database connection failed");
    });
  });

  describe("getProductsByPriceRange", () => {
    it("should get products by price range successfully", async () => {
      const minPrice = 3.00;
      const maxPrice = 5.00;
      const expectedProducts = [
        {
          productId: 1,
          name: "Café Americano",
          description: "Café negro tradicional",
          price: 3.50,
          cost: 1.20,
          active: true,
        },
        {
          productId: 2,
          name: "Cappuccino",
          description: "Café con leche espumada",
          price: 4.25,
          cost: 1.75,
          active: true,
        },
      ] as Product[];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(expectedProducts),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await productService.getProductsByPriceRange(minPrice, maxPrice);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("product");
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("product.price >= :minPrice", { minPrice });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("product.price <= :maxPrice", { maxPrice });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("product.active = :active", { active: true });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith("product.price", "ASC");
      expect(result).toEqual(expectedProducts);
    });

    it("should return empty array when no products in price range", async () => {
      const minPrice = 10.00;
      const maxPrice = 15.00;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await productService.getProductsByPriceRange(minPrice, maxPrice);

      expect(result).toEqual([]);
    });

    it("should handle edge case with same min and max price", async () => {
      const price = 3.50;
      const expectedProducts = [
        {
          productId: 1,
          name: "Café Americano",
          description: "Café negro tradicional",
          price: 3.50,
          cost: 1.20,
          active: true,
        },
      ] as Product[];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(expectedProducts),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await productService.getProductsByPriceRange(price, price);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith("product.price >= :minPrice", { minPrice: price });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("product.price <= :maxPrice", { maxPrice: price });
      expect(result).toEqual(expectedProducts);
    });

    it("should handle database errors during getProductsByPriceRange", async () => {
      const minPrice = 3.00;
      const maxPrice = 5.00;
      const databaseError = new Error("Database connection failed");

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(databaseError),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(productService.getProductsByPriceRange(minPrice, maxPrice)).rejects.toThrow("Database connection failed");
    });
  });
});