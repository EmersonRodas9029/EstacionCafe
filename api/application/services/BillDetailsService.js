"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillDetailsService = void 0;
const BillDetails_1 = require("../../core/entities/BillDetails");
const Producto_1 = require("../../core/entities/Producto");
const Ingredient_1 = require("../../core/entities/Ingredient");
const Consumable_1 = require("../../core/entities/Consumable");
class BillDetailsService {
    constructor(detailRepo, billService) {
        this.detailRepo = detailRepo;
        this.billService = billService;
        this.detailRepo = detailRepo;
        this.billService = billService;
    }
    async getById(id) {
        console.log(`Obteniendo detalles de la factura ${id}...`);
        return this.detailRepo.find({
            where: { billId: id },
            relations: ["product", "bill"],
        });
    }
    save(_body) {
        throw new Error("Method not implemented.");
    }
    async saveAll(body) {
        const data = body;
        const bill = await this.billService.getById(data.billId);
        if (!bill) {
            throw new Error(`Bill con ID ${data.billId} no encontrado`);
        }
        const existingDetails = (await this.detailRepo.find({
            where: { billId: data.billId },
        })) ?? [];
        const detailsToSave = [];
        const productRepo = this.detailRepo.manager.getRepository(Producto_1.Product);
        const ingredientRepo = this.detailRepo.manager.getRepository(Ingredient_1.Ingredient);
        const consumableRepo = this.detailRepo.manager.getRepository(Consumable_1.Consumable);
        const stockAdjustments = new Map();
        const supportsIngredientQueries = typeof ingredientRepo.find === "function";
        const supportsConsumableQueries = typeof consumableRepo.findOne === "function" &&
            typeof consumableRepo.save === "function";
        for (const item of data.billDetails) {
            // Validar que el producto existe por ID
            const product = await productRepo.findOne({
                where: { productId: item.productId },
            });
            if (!product) {
                throw new Error(`Producto con ID ${item.productId} no encontrado`);
            }
            if (product.name !== item.name) {
                throw new Error(`El nombre del producto no coincide: esperado "${product.name}", recibido "${item.name}"`);
            }
            if (Math.abs(product.price - item.price) > 0.01) {
                throw new Error(`El precio del producto "${item.name}" no coincide: esperado ${product.price}, recibido ${item.price}`);
            }
            const expectedSubTotal = item.quantity * item.price;
            if (Math.abs(expectedSubTotal - item.subTotal) > 0.01) {
                throw new Error(`El subtotal del producto "${item.name}" no es correcto: esperado ${expectedSubTotal}, recibido ${item.subTotal}`);
            }
            // Verificar si ya existe un detalle con este producto
            const existingDetail = existingDetails.find((detail) => detail.productId === item.productId);
            const quantityDelta = existingDetail
                ? item.quantity - existingDetail.quantity
                : item.quantity;
            const ingredients = supportsIngredientQueries
                ? ((await ingredientRepo.find({
                    where: { productId: item.productId },
                })) ?? [])
                : [];
            for (const ingredient of ingredients) {
                const currentAdjustment = stockAdjustments.get(ingredient.consumableId) ?? 0;
                stockAdjustments.set(ingredient.consumableId, currentAdjustment + ingredient.quantity * quantityDelta);
            }
            if (existingDetail) {
                // Actualizar detalle existente
                existingDetail.quantity = item.quantity;
                existingDetail.subTotal = expectedSubTotal;
                detailsToSave.push(existingDetail);
                console.log(`Actualizando detalle existente para producto ${item.productId}: nueva cantidad ${existingDetail.quantity}`);
            }
            else {
                // Crear nuevo detalle
                const newDetail = new BillDetails_1.BillDetails();
                newDetail.billId = data.billId;
                newDetail.productId = item.productId;
                newDetail.quantity = item.quantity;
                newDetail.subTotal = item.subTotal;
                detailsToSave.push(newDetail);
                console.log(`Creando nuevo detalle para producto ${item.productId}`);
            }
        }
        // Validar stock y aplicar descuentos/reposiciones en consumibles
        if (supportsConsumableQueries) {
            const consumablesToUpdate = [];
            for (const [consumableId, adjustment] of stockAdjustments.entries()) {
                if (adjustment === 0) {
                    continue;
                }
                const consumable = await consumableRepo.findOne({
                    where: { consumableId },
                });
                if (!consumable) {
                    throw new Error(`Consumible con ID ${consumableId} no encontrado`);
                }
                const resultingStock = consumable.quantity - adjustment;
                if (resultingStock < 0) {
                    throw new Error(`Stock insuficiente para "${consumable.name}". Disponible: ${consumable.quantity}, requerido: ${adjustment}`);
                }
                consumable.quantity = resultingStock;
                consumablesToUpdate.push(consumable);
            }
            if (consumablesToUpdate.length > 0) {
                await consumableRepo.save(consumablesToUpdate);
            }
        }
        // Guardar todos los detalles (nuevos y actualizados)
        const savedDetails = await this.detailRepo.save(detailsToSave);
        // Calcular el total de TODOS los detalles de la factura
        const allDetails = (await this.detailRepo.find({
            where: { billId: data.billId },
        })) ?? [];
        const newTotal = allDetails.reduce((acc, detail) => acc + detail.subTotal, 0);
        await this.billService.update({
            billId: data.billId,
            total: newTotal,
        });
        console.log(`Guardados/actualizados ${savedDetails.length} detalles y actualizado total a ${newTotal}`);
        return savedDetails;
    }
    async delete(id) {
        const result = await this.detailRepo.delete(id);
        if (result.affected === 0) {
            throw new Error(`Detalle con ID ${id} no encontrado`);
        }
        return { message: "Detalle eliminado correctamente", id };
    }
    update(_body) {
        throw new Error("Method not implemented.");
    }
    getAll() {
        console.log(`Obteniendo bills details...`);
        return this.detailRepo.find({
            relations: ["product", "bill"],
        });
    }
}
exports.BillDetailsService = BillDetailsService;
