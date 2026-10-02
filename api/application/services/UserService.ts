import { Repository } from "typeorm";
import { User } from "../../core/entities/User";
import { loginUser, SaveUserDTO } from "../DTOs/UserDTO";
import * as bcrypt from "bcrypt";
import { IUserService } from "../../core/interfaces/IUserService";
import { UserType } from "../../core/entities/UserType";
import { Role } from "../../core/enums/Role";
import { AppError } from "../errors/AppError";
import { revokeSessions } from "../../infrastructure/security/sessions";

export class UserService implements IUserService {
  private userRepository: Repository<User>;
  constructor(userRepo: Repository<User>) {
    this.userRepository = userRepo;
  }

  async saveAll(body: SaveUserDTO[]): Promise<Omit<User, "password">[]> {
    const users = await Promise.all(
      body.map(async (userData) => {
        const user = new User();
        user.username = userData.username;
        user.password = await this.encryptPassword(userData.password);
        user.userTypeId = userData.typeId;
        user.email = userData.email;
        return user;
      }),
    );

    const saved = await this.userRepository.save(users);
    return saved.map((u) => this.withoutPassword(u));
  }

  async save(body: SaveUserDTO): Promise<any> {
    const userData: SaveUserDTO = body;
    await this.ensureUniqueUsername(userData.username);
    await this.getUserType(userData.typeId);
    const user: User = new User();
    user.username = userData.username;
    user.password = await this.encryptPassword(userData.password);
    user.userTypeId = userData.typeId;
    user.email = userData.email;

    console.log("Guardando usuario...");
    return this.withoutPassword(await this.userRepository.save(user));
  }

  /** Baja lógica. `actorId` evita que un admin se deje fuera a sí mismo. */
  async delete(id: number, actorId?: number): Promise<any> {
    if (actorId !== undefined && id === actorId) {
      throw AppError.conflict("No puedes desactivar tu propio usuario");
    }
    const user = await this.getById(id);
    user.active = false;

    await this.userRepository.save(user);
    await revokeSessions(this.userRepository.manager, { userId: id });
    return { message: "Usuario desactivado correctamente", id };
  }

  async update(body: any): Promise<any> {
    const { userId, actorId, ...updateData } = body;

    if (!userId) {
      throw new Error("userId es requerido para actualizar");
    }

    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    if (updateData.username && updateData.username !== user.username) {
      await this.ensureUniqueUsername(updateData.username);
    }

    if (actorId !== undefined && userId === actorId) {
      if (updateData.active === false) {
        throw AppError.conflict("No puedes desactivar tu propio usuario");
      }
      if (updateData.typeId) {
        const type = await this.getUserType(updateData.typeId);
        if (type.role !== Role.ADMIN) {
          throw AppError.conflict("No puedes quitarte el rol de administrador");
        }
      }
    } else if (updateData.typeId) {
      await this.getUserType(updateData.typeId);
    }

    if (updateData.password) {
      updateData.password = await this.encryptPassword(updateData.password);
    }

    // Mapear typeId a userTypeId
    if (updateData.typeId) {
      updateData.userTypeId = updateData.typeId;
      delete updateData.typeId;
    }

    // Bajas, cambios de rol o de contraseña cierran las sesiones abiertas
    const mustRevoke =
      updateData.active === false ||
      (updateData.userTypeId !== undefined && updateData.userTypeId !== user.userTypeId) ||
      !!updateData.password;

    Object.assign(user, updateData);
    const saved = this.withoutPassword(await this.userRepository.save(user));
    if (mustRevoke) await revokeSessions(this.userRepository.manager, { userId });
    return saved;
  }

  /** Incluye `hasPin`; el hash del PIN nunca sale de la API. */
  async getAll(): Promise<any[]> {
    const users = await this.userRepository
      .createQueryBuilder("u")
      .addSelect("u.pinHash")
      .leftJoinAndSelect("u.userType", "t")
      .orderBy("u.username", "ASC")
      .getMany();
    return users.map(({ pinHash, ...user }) => ({ ...user, hasPin: !!pinHash }));
  }

  async getById(id: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
      relations: ["userType"] as any,
    });
    if (!user) {
      throw new Error(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async getUsersByType(typeId: number): Promise<User[]> {
    return await this.userRepository.find({
      where: { userTypeId: typeId },
      relations: ["userType"] as any,
      order: { username: "ASC" },
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
      relations: ["userType"] as any,
    });
  }

  private async ensureUniqueUsername(username: string) {
    const taken = await this.userRepository.exists({ where: { username } });
    if (taken) throw AppError.conflict(`El usuario ${username} ya existe`);
  }

  private async getUserType(typeId: number): Promise<UserType> {
    const type = await this.userRepository.manager.findOne(UserType, {
      where: { userTypeId: typeId },
    });
    if (!type) throw AppError.badRequest(`El rol ${typeId} no existe`);
    return type;
  }

  private withoutPassword<T extends Partial<User>>(user: T): Omit<T, "password"> {
    const { password: _password, ...rest } = user;
    return rest;
  }

  private async encryptPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async getPasswordAndRole(username: string): Promise<loginUser | null> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.userType", "userType")
      .select([
        "user.userId",
        "user.username",
        "user.password",
        "user.active",
        "userType.role",
      ])
      .where("user.username = :username", { username })
      .getOne();

    if (!user) {
      return null;
    }

    const data: loginUser = {
      userId: user.userId,
      username: user.username,
      role: user.userType!.role,
      password: user.password,
      active: user.active,
    };

    return data;
  }
}
