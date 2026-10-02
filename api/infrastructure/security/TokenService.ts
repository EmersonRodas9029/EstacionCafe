import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { loginUser, payloadUser } from "../../application/DTOs/UserDTO";
import { ITokenService } from "../../core/interfaces/ITokenService";
import { IUserService } from "../../core/interfaces/IUserService";
import { AppError } from "../../application/errors/AppError";
import { env } from "../config/env";

export const TOKEN_TTL_MS = env.JWT_EXPIRES_IN_HOURS * 60 * 60 * 1000;

export class TokenService implements ITokenService {
  private readonly secret = env.JWT_SECRET;

  constructor(private userService: IUserService) {}

  generateToken = async (
    credentials: Pick<loginUser, "username" | "password">,
  ): Promise<string> => {
    const dbData = await this.userService.getPasswordAndRole(
      credentials.username,
    );

    // Mismo mensaje para usuario inexistente, inactivo o contraseña errónea
    const isMatch =
      dbData?.active &&
      (await bcrypt.compare(credentials.password, dbData.password));

    if (!dbData || !isMatch) {
      throw AppError.unauthorized("Usuario o contraseña incorrectos");
    }

    const payload: payloadUser = {
      userId: dbData.userId,
      username: dbData.username,
      role: dbData.role,
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: `${env.JWT_EXPIRES_IN_HOURS}h`,
    });
  };

  verifyToken = async (token: string): Promise<payloadUser> => {
    try {
      return jwt.verify(token, this.secret) as payloadUser;
    } catch (error) {
      throw AppError.unauthorized(
        error instanceof jwt.TokenExpiredError
          ? "Token expirado"
          : "Token inválido",
      );
    }
  };
}
