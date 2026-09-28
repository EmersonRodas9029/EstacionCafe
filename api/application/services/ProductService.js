"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const Producto_1 = require("../../core/entities/Producto");
class ProductService {
    constructor(productRepository) {
        this.productRepository = productRepository;
        this.productRepository = productRepository;
    }
    async saveAll(body) {
        const products = body.map((data) => {
            const product = new Producto_1.Product();
            product.name = data.name;
            product.description = data.description;
            product.price = data.price;
            product.cost = data.cost;
            product.productTypeId = data.productTypeId;
            product.active = data.active !== undefined ? data.active : true;
            return product;
        });
        return await this.productRepository.save(products);
    }
    async save(body) {
        const data = body;
        const product = new Producto_1.Product();
        product.name = data.name;
        product.description = data.description;
        product.price = data.price;
        product.cost = data.cost;
        product.productTypeId = data.productTypeId;
        product.active = data.active !== undefined ? data.active : true;
        console.log("Guardando producto...");
        return await this.productRepository.save(product);
    }
    async delete(id) {
        const product = await this.getById(id);
        product.active = false;
        await this.productRepository.save(product);
        return { message: "Producto desactivado correctamente", id };
    }
    async update(body) {
        const { productId, ...updateData } = body;
        if (!productId) {
            throw new Error("productId es requerido para actualizar");
        }
        const product = await this.productRepository.findOne({
            where: { productId },
        });
        if (!product) {
            throw new Error(`Producto con ID ${productId} no encontrado`);
        }
        if (updateData.name !== undefined)
            product.name = updateData.name;
        if (updateData.description !== undefined)
            product.description = updateData.description;
        if (updateData.price !== undefined)
            product.price = updateData.price;
        if (updateData.cost !== undefined)
            product.cost = updateData.cost;
        if (updateData.productTypeId !== undefined)
            product.productTypeId = updateData.productTypeId;
        return await this.productRepository.save(product);
    }
    async getAll() {
        console.log(`Obteniendo productos...`);
        return await this.productRepository.find({
            order: { name: "ASC" },
        });
    }
    async getById(id) {
        const product = await this.productRepository.findOne({
            where: { productId: id },
        });
        if (!product) {
            throw new Error(`Producto con ID ${id} no encontrado`);
        }
        return product;
    }
    async getActiveProducts() {
        return await this.productRepository.find({
            where: { active: true },
            order: { name: "ASC" },
        });
    }
    async getProductsByPriceRange(minPrice, maxPrice) {
        return await this.productRepository
            .createQueryBuilder("product")
            .where("product.price >= :minPrice", { minPrice })
            .andWhere("product.price <= :maxPrice", { maxPrice })
            .andWhere("product.active = :active", { active: true })
            .orderBy("product.price", "ASC")
            .getMany();
    }
}
exports.ProductService = ProductService;
