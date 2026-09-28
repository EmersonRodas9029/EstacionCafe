import { Repository } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { Supplier } from "../../core/entities/Supplier";
import { SaveSupplierDTO } from "../DTOs/SupplierDTO";

export class SupplierService implements IService {
    public constructor(private supplierRepository: Repository<Supplier>) {
        this.supplierRepository = supplierRepository;
    }

    async save(body: SaveSupplierDTO): Promise<any> {
        const data: SaveSupplierDTO = body;
        const supplier: Supplier = new Supplier();
        supplier.name = data.name;
        supplier.phone = data.phone;
        supplier.email = data.email;
        supplier.active = data.active !== undefined ? data.active : true;

        console.log("Guardando proveedor...");
        return await this.supplierRepository.save(supplier);
    }

    async saveAll(body: any[]): Promise<any[]> {
        console.log("Guardando múltiples proveedores...");
        return await this.supplierRepository.save(body);
    }

    async delete(id: number): Promise<any> {
        console.log(`Desactivando proveedor con ID: ${id}`);
        
        const supplier = await this.getById(id);
        supplier.active = false;
        
        await this.supplierRepository.save(supplier);
        return { message: "Proveedor desactivado correctamente", id };
    }

    async update(body: any): Promise<any> {
        const { supplierId, ...updateData } = body;
        console.log(`Actualizando proveedor con ID: ${supplierId}`);

        const supplier = await this.supplierRepository.findOne({ where: { supplierId } });
        if (!supplier) {
            throw new Error(`Proveedor con ID ${supplierId} no encontrado`);
        }

        Object.assign(supplier, updateData);
        return await this.supplierRepository.save(supplier);
    }

    async getAll(): Promise<any[]> {
        console.log("Obteniendo todos los proveedores...");
        return await this.supplierRepository.find({
            order: { name: "ASC" }
        });
    }

    async getById(id: number): Promise<any> {
        console.log(`Obteniendo proveedor con ID: ${id}`);
        const supplier = await this.supplierRepository.findOne({ where: { supplierId: id } });
        if (!supplier) {
            throw new Error(`Proveedor con ID ${id} no encontrado`);
        }
        return supplier;
    }

    async getActiveSuppliers(): Promise<any[]> {
        console.log("Obteniendo proveedores activos...");
        return await this.supplierRepository.find({
            where: { active: true },
            order: { name: "ASC" }
        });
    }
}