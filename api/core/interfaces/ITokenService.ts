import { loginUser } from "../../application/DTOs/UserDTO";
export interface ITokenService {
  generateToken(payload: loginUser): Promise<any>;
  verifyToken(token:string): Promise<any>;
}
