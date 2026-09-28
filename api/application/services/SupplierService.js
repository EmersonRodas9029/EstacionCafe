"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierService = void 0;
const Supplier_1 = require("../../core/entities/Supplier");
class SupplierService {
    constructor(supplierRepository) {
        this.supplierRepository = supplierRepository;
        this.supplierRepository = supplierRepository;
    }
    async save(body) {
        const data = body;
        const supplier = new Supplier_1.Supplier();
        supplier.name = data.name;
        supplier.phone = data.phone;
        supplier.email = data.email;
        supplier.active = data.active !== undefined ? data.active : true;
        console.log("Guardando proveedor...");
        return await this.supplierRepository.save(supplier);
    }
    async saveAll(body) {
        console.log("Guardando múltiples proveedores...");
        return await this.supplierRepository.save(body);
    }
    async delete(id) {
        console.log(`Desactivando proveedor con ID: ${id}`);
        const supplier = await this.getById(id);
        supplier.active = false;
        await this.supplierRepository.save(supplier);
        return { message: "Proveedor desactivado correctamente", id };
    }
    async update(body) {
        const { supplierId, ...updateData } = body;
        console.log(`Actualizando proveedor con ID: ${supplierId}`);
        const supplier = await this.supplierRepository.findOne({ where: { supplierId } });
        if (!supplier) {
            throw new Error(`Proveedor con ID ${supplierId} no encontrado`);
        }
        Object.assign(supplier, updateData);
        return await this.supplierRepository.save(supplier);
    }
    async getAll() {
        console.log("Obteniendo todos los proveedores...");
        return await this.supplierRepository.find({
            order: { name: "ASC" }
        });
    }
    async getById(id) {
        console.log(`Obteniendo proveedor con ID: ${id}`);
        const supplier = await this.supplierRepository.findOne({ where: { supplierId: id } });
        if (!supplier) {
            throw new Error(`Proveedor con ID ${id} no encontrado`);
        }
        return supplier;
    }
    async getActiveSuppliers() {
        console.log("Obteniendo proveedores activos...");
        return await this.supplierRepository.find({
            where: { active: true },
            order: { name: "ASC" }
        });
    }
}
exports.SupplierService = SupplierService;
