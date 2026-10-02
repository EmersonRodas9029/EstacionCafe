import { Repository } from "typeorm";
import { IService } from "../../core/interfaces/IService";
import { CashRegister } from "../../core/entities/CashRegister";
import {
  SaveCashRegisterDTO,
  UpdateCashRegisterDTO,
} from "../DTOs/CashRegisterDTO";
import { AppError } from "../errors/AppError";

export class CashRegisterService implements IService {
  constructor(private cashRegisterRepository: Repository<CashRegister>) {}

  async save(body: SaveCashRegisterDTO): Promise<CashRegister> {
    await this.ensureUniqueNumber(body.number);
    const register = new CashRegister();
    register.number = body.number;
    register.active = body.active ?? true;
    return this.cashRegisterRepository.save(register);
  }

  async saveAll(body: SaveCashRegisterDTO[]): Promise<CashRegister[]> {
    return Promise.all(body.map((data) => this.save(data)));
  }

  /** Baja lógica: las facturas históricas siguen apuntando a la caja. */
  async delete(id: number): Promise<any> {
    const register = await this.getById(id);
    register.active = false;
    await this.cashRegisterRepository.save(register);
    return { message: "Caja registradora desactivada correctamente", id };
  }

  async update(
    body: UpdateCashRegisterDTO & { cashRegisterId: number },
  ): Promise<CashRegister> {
    const { cashRegisterId, ...data } = body;
    const register = await this.getById(cashRegisterId);

    if (data.number !== undefined && data.number !== register.number) {
      await this.ensureUniqueNumber(data.number);
      register.number = data.number;
    }
    if (data.active !== undefined) register.active = data.active;

    return this.cashRegisterRepository.save(register);
  }

  async getAll(): Promise<CashRegister[]> {
    return this.cashRegisterRepository.find({ order: { number: "ASC" } });
  }

  async getById(id: number): Promise<CashRegister> {
    const register = await this.cashRegisterRepository.findOne({
      where: { cashRegisterId: id },
    });
    if (!register) {
      throw new Error(`Caja registradora con ID ${id} no encontrada`);
    }
    return register;
  }

  async getActiveCashRegisters(): Promise<CashRegister[]> {
    return this.cashRegisterRepository.find({
      where: { active: true },
      order: { number: "ASC" },
    });
  }

  async getByNumber(number: string): Promise<CashRegister> {
    const register = await this.cashRegisterRepository.findOne({
      where: { number },
    });
    if (!register) {
      throw AppError.notFound(`Caja registradora ${number} no encontrada`);
    }
    return register;
  }

  private async ensureUniqueNumber(number: string) {
    const existing = await this.cashRegisterRepository.findOne({
      where: { number },
    });
    if (existing) {
      throw AppError.conflict(`Ya existe la caja registradora ${number}`);
    }
  }
}
