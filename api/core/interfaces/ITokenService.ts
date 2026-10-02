import { loginUser, payloadUser } from "../../application/DTOs/UserDTO";

export interface ITokenService {
  generateToken(
    credentials: Pick<loginUser, "username" | "password">,
  ): Promise<string>;
  verifyToken(token: string): Promise<payloadUser>;
}
