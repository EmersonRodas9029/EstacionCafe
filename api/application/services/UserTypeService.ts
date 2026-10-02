import { Repository } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { UserType } from "../../core/entities/UserType";
import { User } from "../../core/entities/User";
import { Role } from "../../core/enums/Role";
import { AppError } from "../errors/AppError";

export class UserTypeService implements IService {
  private typeRepo: Repository<UserType>;
  constructor(typeRepository: Repository<UserType>) {
    this.typeRepo = typeRepository;
  }

  async save(body: any): Promise<any> {
    const type = new UserType();
    type.name = body.name;
    type.permissionLevel = body.permissionLevel;
    if (body.role) type.role = body.role;
    console.log("Guardando tipo de usuario...");
    return this.typeRepo.save(type);
  }

  async saveAll(body: any[]): Promise<UserType[]> {
    const userTypes = body.map(data => {
      const type = new UserType();
      type.name = data.name;
      type.permissionLevel = data.permissionLevel;
      if (data.role) type.role = data.role;
      return type;
    });

    return await this.typeRepo.save(userTypes);
  }

  async delete(id: number): Promise<any> {
    const users = await this.typeRepo.manager.count(User, {
      where: { userTypeId: id },
    });
    if (users > 0) {
      throw AppError.conflict(
        `El rol tiene ${users} usuarios asignados y no se puede eliminar`,
      );
    }
    const result = await this.typeRepo.delete(id);
    if (result.affected === 0) {
      throw new Error(`Tipo de usuario con ID ${id} no encontrado`);
    }
    return { message: "Tipo de usuario eliminado correctamente", id };
  }

  async update(body: any): Promise<any> {
    const { userTypeId, actorId, ...updateData } = body;

    if (!userTypeId) {
      throw new Error("userTypeId es requerido para actualizar");
    }

    const userType = await this.typeRepo.findOne({ where: { userTypeId } });
    if (!userType) {
      throw new Error(`Tipo de usuario con ID ${userTypeId} no encontrado`);
    }

    // Quitar el rol admin al tipo del propio admin lo dejaría sin acceso
    if (actorId !== undefined && updateData.role && updateData.role !== Role.ADMIN) {
      const actor = await this.typeRepo.manager.findOne(User, {
        where: { userId: actorId },
      });
      if (actor?.userTypeId === userTypeId) {
        throw AppError.conflict(
          "No puedes quitar el rol de administrador a tu propio tipo de usuario",
        );
      }
    }

    Object.assign(userType, updateData);
    return await this.typeRepo.save(userType);
  }

  async getAll(): Promise<any[]> {
    console.log(`Obteniendo tipos de usuarios...`);
    return this.typeRepo.find({
      order: { permissionLevel: "ASC" }
    });
  }

  async getById(id: number): Promise<any> {
    const userType = await this.typeRepo.findOne({ where: { userTypeId: id } });
    if (!userType) {
      throw new Error(`Tipo de usuario con ID ${id} no encontrado`);
    }
    return userType;
  }

  async getByPermissionLevel(level: number): Promise<UserType[]> {
    return await this.typeRepo.find({
      where: { permissionLevel: level },
      order: { name: "ASC" }
    });
  }
}
