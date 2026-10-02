import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { DataSource, In } from "typeorm";
import { Device } from "../../core/entities/Device";
import { Session, SessionMethod } from "../../core/entities/Session";
import { User } from "../../core/entities/User";
import { Role } from "../../core/enums/Role";
import { env } from "../../infrastructure/config/env";
import { hashDeviceToken, hashPin, newDeviceToken, PIN_PATTERN, randomPin } from "../../infrastructure/security/pin";
import { revokeSessions } from "../../infrastructure/security/sessions";
import { clearFailures, delayFor, recordFailure, sleep } from "../../infrastructure/security/throttle";
import { AppError } from "../errors/AppError";

/** Usuario autenticado tal como lo ven los controladores (req.user). */
export interface AuthUser {
  userId: number;
  username: string;
  role: Role;
  sessionId: string;
  deviceId: number | null;
}

export interface IssuedSession {
  token: string;
  maxAgeMs: number;
  user: { userId: number; username: string; email: string; role: Role };
}

export const PIN_ROLES: Role[] = [Role.MESERO, Role.CAJERO];
const PASSWORD_TTL_MS = env.JWT_EXPIRES_IN_HOURS * 60 * 60 * 1000;
const PIN_TTL_MS = env.PIN_SESSION_MINUTES * 60 * 1000;
/** last_seen_at se escribe como mucho cada 30 s: evita un UPDATE por petición. */
const TOUCH_EVERY_MS = 30_000;

/**
 * Autenticación con sesiones revocables: el JWT solo transporta el id de la
 * sesión (jti) y cada petición se valida contra la BD (sesión vigente, usuario
 * activo y su rol actual).
 */
export class AuthService {
  constructor(private ds: DataSource) {}

  private get users() {
    return this.ds.getRepository(User);
  }
  private get sessions() {
    return this.ds.getRepository(Session);
  }
  private get devices() {
    return this.ds.getRepository(Device);
  }

  // ---------- Login ----------

  async loginWithPassword(username: string, password: string, deviceToken?: string) {
    const user = await this.users
      .createQueryBuilder("u")
      .addSelect("u.password")
      .leftJoinAndSelect("u.userType", "t")
      .where("u.username = :username", { username })
      .getOne();

    // Mismo mensaje para usuario inexistente, inactivo o contraseña errónea
    const valid = user?.active && (await bcrypt.compare(password, user.password));
    if (!user || !valid) throw AppError.unauthorized("Usuario o contraseña incorrectos");

    const device = await this.deviceFromToken(deviceToken);
    return this.issue(user, "password", device?.deviceId ?? null);
  }

  /** Solo en dispositivos autorizados; nunca bloquea, pero frena ráfagas de fallos. */
  async loginWithPin(pin: string, deviceToken?: string) {
    const device = await this.deviceFromToken(deviceToken);
    if (!device) {
      throw AppError.forbidden("Este dispositivo no está autorizado para entrar con PIN");
    }

    const key = `device:${device.deviceId}`;
    const user = PIN_PATTERN.test(pin)
      ? await this.users
          .createQueryBuilder("u")
          .innerJoinAndSelect("u.userType", "t")
          .where("u.pin_hash = :hash", { hash: hashPin(pin) })
          .andWhere("u.active = true")
          .andWhere("t.role IN (:...roles)", { roles: PIN_ROLES })
          .getOne()
      : null;

    if (!user) {
      recordFailure(key);
      await sleep(delayFor(key));
      throw AppError.unauthorized("PIN incorrecto");
    }

    clearFailures(key);
    return this.issue(user, "pin", device.deviceId);
  }

  private async issue(user: User, method: SessionMethod, deviceId: number | null): Promise<IssuedSession> {
    const ttl = method === "pin" ? PIN_TTL_MS : PASSWORD_TTL_MS;
    const now = new Date();
    const session = await this.sessions.save(
      this.sessions.create({
        sessionId: randomUUID(),
        userId: user.userId,
        deviceId,
        method,
        expiresAt: new Date(now.getTime() + ttl),
        lastSeenAt: now,
      }),
    );
    const token = jwt.sign({ sub: String(user.userId) }, env.JWT_SECRET, {
      jwtid: session.sessionId,
      expiresIn: Math.floor(ttl / 1000),
    });
    return {
      token,
      maxAgeMs: ttl,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.userType!.role,
      },
    };
  }

  // ---------- Sesión ----------

  async authenticate(token: string): Promise<AuthUser> {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    } catch (error) {
      throw AppError.unauthorized(
        error instanceof jwt.TokenExpiredError ? "Sesión expirada" : "Token inválido",
      );
    }
    if (!payload.jti) throw AppError.unauthorized("Token inválido");

    const session = await this.sessions.findOne({
      where: { sessionId: payload.jti },
      relations: { user: { userType: true } },
    });
    const now = Date.now();
    if (!session || session.revokedAt || session.expiresAt.getTime() <= now) {
      throw AppError.unauthorized("Sesión expirada");
    }
    if (!session.user?.active) throw AppError.unauthorized("Usuario inactivo");

    if (now - session.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
      await this.sessions.update({ sessionId: session.sessionId }, { lastSeenAt: new Date(now) });
    }

    return {
      userId: session.userId,
      username: session.user.username,
      role: session.user.userType!.role,
      sessionId: session.sessionId,
      deviceId: session.deviceId,
    };
  }

  /** Revoca la sesión del token si es válido; un token roto simplemente se ignora. */
  async logout(token?: string) {
    if (!token) return;
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, { ignoreExpiration: true }) as jwt.JwtPayload;
      if (payload.jti) await revokeSessions(this.ds.manager, { sessionId: payload.jti });
    } catch {
      /* token inválido: no hay sesión que cerrar */
    }
  }

  // ---------- Dispositivos ----------

  async deviceFromToken(token?: string): Promise<Device | null> {
    if (!token) return null;
    const device = await this.devices.findOne({
      where: { tokenHash: hashDeviceToken(token), active: true },
    });
    if (device && (!device.lastSeenAt || Date.now() - device.lastSeenAt.getTime() > TOUCH_EVERY_MS)) {
      await this.devices.update({ deviceId: device.deviceId }, { lastSeenAt: new Date() });
    }
    return device;
  }

  /** Autoriza el equipo desde el que llama el admin; el token solo existe en su cookie. */
  async registerDevice(name: string, adminId: number) {
    const { token, hash } = newDeviceToken();
    const device = await this.devices.save(
      this.devices.create({ name, tokenHash: hash, createdBy: adminId, active: true }),
    );
    return { device, token };
  }

  listDevices() {
    return this.devices.find({ order: { active: "DESC", name: "ASC" } });
  }

  async updateDevice(deviceId: number, data: { name?: string; active?: boolean }) {
    const device = await this.devices.findOne({ where: { deviceId } });
    if (!device) throw AppError.notFound(`Dispositivo ${deviceId} no encontrado`);
    Object.assign(device, data);
    const saved = await this.devices.save(device);
    if (data.active === false) await revokeSessions(this.ds.manager, { deviceId });
    return saved;
  }

  // ---------- PIN ----------

  /** Asigna el PIN indicado o uno aleatorio libre; cierra las sesiones del usuario. */
  async setPin(userId: number, pin?: string): Promise<string> {
    const user = await this.users.findOne({ where: { userId }, relations: { userType: true } });
    if (!user) throw AppError.notFound(`Usuario con ID ${userId} no encontrado`);
    if (!user.userType || !PIN_ROLES.includes(user.userType.role)) {
      throw AppError.badRequest("Solo meseros y cajeros usan PIN");
    }

    let chosen = pin;
    if (chosen !== undefined) {
      if (!PIN_PATTERN.test(chosen)) throw AppError.badRequest("El PIN debe tener 4 dígitos");
      if (await this.pinTaken(chosen, userId)) throw AppError.conflict("Ese PIN ya está en uso");
    } else {
      for (let i = 0; i < 50 && chosen === undefined; i++) {
        const candidate = randomPin();
        if (!(await this.pinTaken(candidate, userId))) chosen = candidate;
      }
      if (chosen === undefined) throw AppError.conflict("No hay PIN libres; escribe uno");
    }

    await this.users.update({ userId }, { pinHash: hashPin(chosen) });
    await revokeSessions(this.ds.manager, { userId });
    return chosen;
  }

  async clearPin(userId: number) {
    const result = await this.users.update({ userId }, { pinHash: null });
    if (!result.affected) throw AppError.notFound(`Usuario con ID ${userId} no encontrado`);
    await revokeSessions(this.ds.manager, { userId, method: "pin" });
  }

  /** Ids de usuarios con PIN asignado (el hash nunca sale de la API). */
  async usersWithPin(userIds: number[]) {
    if (userIds.length === 0) return new Set<number>();
    const rows = await this.users
      .createQueryBuilder("u")
      .select("u.userId", "userId")
      .where("u.userId IN (:...ids)", { ids: userIds })
      .andWhere("u.pin_hash IS NOT NULL")
      .getRawMany<{ userId: number }>();
    return new Set(rows.map((r) => r.userId));
  }

  private async pinTaken(pin: string, exceptUserId: number) {
    const owner = await this.users
      .createQueryBuilder("u")
      .select("u.userId")
      .where("u.pin_hash = :hash", { hash: hashPin(pin) })
      .getOne();
    return !!owner && owner.userId !== exceptUserId;
  }

  /** Revoca las sesiones de todos los usuarios de un tipo (cambio de rol del tipo). */
  async revokeByUserType(userTypeId: number) {
    const users = await this.users.find({ where: { userTypeId }, select: { userId: true } });
    if (users.length) {
      await revokeSessions(this.ds.manager, { userId: In(users.map((u) => u.userId)) });
    }
  }
}

