"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductTypeService = void 0;
const ProductType_1 = require("../../core/entities/ProductType");
class ProductTypeService {
    constructor(productTypeRepository) {
        this.productTypeRepo = productTypeRepository;
    }
    async save(body) {
        const productType = new ProductType_1.ProductType();
        productType.name = body.name;
        console.log("Guardando tipo de producto...");
        return await this.productTypeRepo.save(productType);
    }
    async saveAll(body) {
        const productTypes = body.map((data) => {
            const productType = new ProductType_1.ProductType();
            productType.name = data.name;
            return productType;
        });
        return await this.productTypeRepo.save(productTypes);
    }
    async delete(id) {
        const result = await this.productTypeRepo.delete(id);
        if (result.affected === 0) {
            throw new Error(`Tipo de producto con ID ${id} no encontrado`);
        }
        return { message: "Tipo de producto eliminado correctamente", id };
    }
    async update(body) {
        const { productTypeId, ...updateData } = body;
        if (!productTypeId) {
            throw new Error("productTypeId es requerido para actualizar");
        }
        const productType = await this.productTypeRepo.findOne({
            where: { productTypeId },
        });
        if (!productType) {
            throw new Error(`Tipo de producto con ID ${productTypeId} no encontrado`);
        }
        Object.assign(productType, updateData);
        return await this.productTypeRepo.save(productType);
    }
    async getAll() {
        console.log(`Obteniendo tipos de productos...`);
        return await this.productTypeRepo.find({
            order: { name: "ASC" },
        });
    }
    async getById(id) {
        const productType = await this.productTypeRepo.findOne({
            where: { productTypeId: id },
        });
        if (!productType) {
            throw new Error(`Tipo de producto con ID ${id} no encontrado`);
        }
        return productType;
    }
}
exports.ProductTypeService = ProductTypeService;
