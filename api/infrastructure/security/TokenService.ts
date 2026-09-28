import * as jwt from "jsonwebtoken";
import { loginUser, payloadUser } from "../../application/DTOs/UserDTO";
import { ITokenService } from "../../core/interfaces/ITokenService";
import { IUserService } from "../../core/interfaces/IUserService";
import * as bcrypt from "bcrypt";
import { error } from "console";
export class TokenService implements ITokenService {
  constructor(private userService: IUserService) {
    this.userService = userService;
  }

  private secret: string = process.env.JWT_SECRET || "secret";

  generateToken = async (payload: loginUser): Promise<string | null> => {
    try {
      const dbData = await this.userService.getPasswordAndRole(
        payload.username,
      );

      if (!dbData) {
        throw new Error("Usuario no encontrado");
      }

      const isMatch: boolean = await bcrypt.compare(
        payload.password,
        dbData.password,
      );

      if (!isMatch) {
        console.log("Las contraseñas no coincidieron");
        throw error("Contraseña o usarname incorrecto");
      }

      return jwt.sign(
        {
          userId: dbData.userId,
          username: payload.username,
          role: dbData?.role,
          timestamp: Date.now(),
        },
        this.secret,
        {
          expiresIn: "3h",
        },
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  verifyToken = async (token: string): Promise<payloadUser | null> => {
    try {
      const decodedPayload = jwt.verify(token, this.secret) as payloadUser;
      return decodedPayload;
    } catch (error: any) {
      if (error instanceof jwt.TokenExpiredError) {
        console.error("Error: El token ha expirado.");
        throw new Error("Token expired");
      } else {
        console.error(
          "Error: El token no es válido o ha sido alterado.",
          error.message,
        );
        throw new Error("Invalid token");
      }
    }
  };
}
