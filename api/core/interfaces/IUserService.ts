import { loginUser, payloadUser } from "../../application/DTOs/UserDTO";
import { IService } from "./IService";

export interface IUserService extends IService{
    getPasswordAndRole(username:string):Promise<loginUser | null>;
}