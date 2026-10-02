import { IService } from "../core/interfaces/IService";
import {
  createUserSchema,
  loginSchema,
  updateUserSchema,
  userIdSchema,
} from "../application/validations/UserValidations";
import { AppError } from "../application/errors/AppError";
import { TOKEN_TTL_MS } from "../infrastructure/security/TokenService";
import { env } from "../infrastructure/config/env";
import { loginUser, SaveUserDTO } from "../application/DTOs/UserDTO";
import { ITokenService } from "../core/interfaces/ITokenService";

let service: IService | null = null;
let tokenService: ITokenService | null = null;

export const setServices = (
  userService: IService,
  securityService: ITokenService,
) => {
  service = userService;
  tokenService = securityService;
};

const getService = () => {
  if (!service) {
    throw new Error(
      "User service no está inicializado. Llama a setService primero.",
    );
  }
  return service;
};

export const getUsers = async (req: any, res: any) => {
  try {
    const data = await service!.getAll();
    console.log("Usuarios obtenidos correctamente");

    return res.status(200).send({
      status: "success",
      message: "Usuarios obtenidos correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener los usuarios: ${error.message}`,
    });
  }
};

export const getUserById = async (req: any, res: any) => {
  try {
    const { id } = userIdSchema.parse(req.params);
    const userService = getService() as any;

    const data = await userService.getById(id);
    console.log("Usuario obtenido correctamente");

    return res.status(200).send({
      status: "success",
      message: "Usuario obtenido correctamente",
      data: data,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "ID inválido: " + error.issues[0].message,
      });
    }

    if (error.message.includes("no encontrado")) {
      return res.status(404).send({
        status: "error",
        message: error.message,
      });
    }

    return res.status(500).send({
      status: "error",
      message: `Error al obtener el usuario: ${error.message}`,
    });
  }
};

export const saveUser = async (req: any, res: any) => {
  try {
    const userData: SaveUserDTO = req.body;
    const result = await service!.save(createUserSchema.parse(userData));

    console.log("Usuario creado correctamente");
    return res.status(201).send({
      status: "success",
      message: "Usuario creado correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "Datos inválidos: " + error.issues[0].message,
        campo: error.issues[0].path,
        error: error.issues[0].code,
      });
    }

    console.error("Error al crear usuario:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const updateUser = async (req: any, res: any) => {
  try {
    const { id } = userIdSchema.parse(req.params);
    const updateData = updateUserSchema.parse(req.body);

    const userService = getService() as any;
    const result = await userService.update({
      userId: id,
      ...updateData,
    });

    console.log("Usuario actualizado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Usuario actualizado correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "Datos inválidos: " + error.issues[0].message,
        campo: error.issues[0].path,
      });
    }

    if (error.message.includes("no encontrado")) {
      return res.status(404).send({
        status: "error",
        message: error.message,
      });
    }

    console.error("Error al actualizar usuario:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deleteUser = async (req: any, res: any) => {
  try {
    const { id } = userIdSchema.parse(req.params);
    const result = await service!.delete(parseInt(String(id)));

    console.log("Usuario eliminado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Usuario eliminado correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "ID inválido: " + error.issues[0].message,
      });
    }

    if (error.message.includes("no encontrado")) {
      return res.status(404).send({
        status: "error",
        message: error.message,
      });
    }

    console.error("Error al eliminar usuario:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getUsersByType = async (req: any, res: any) => {
  try {
    const { typeId } = req.params;
    const userService = getService() as any;

    const data = await userService.getUsersByType(parseInt(typeId));

    return res.status(200).send({
      status: "success",
      message: "Usuarios por tipo obtenidos correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener los usuarios por tipo: ${error.message}`,
    });
  }
};

export const login = async (req: any, res: any) => {
  try {
    const credentials = loginSchema.parse(req.body);
    const token = await tokenService!.generateToken(credentials);

    return res
      .status(200)
      .cookie("auth_token", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: TOKEN_TTL_MS,
      })
      .send({
        status: "success",
        message: "Inicio de sesión exitoso",
        data: {
          token,
          expiresIn: TOKEN_TTL_MS / 1000,
        },
      });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "Datos inválidos: " + error.issues[0].message,
        campo: error.issues[0].path,
      });
    }

    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .send({ status: "error", message: error.message });
    }

    return res.status(500).send({
      status: "error",
      message: `Error al iniciar sesión: ${error.message}`,
    });
  }
};

/** Usuario autenticado actual (rol incluido). */
export const me = async (req: any, res: any) => {
  try {
    const user = await (getService() as any).getById(req.user.userId);

    return res.status(200).send({
      status: "success",
      message: "Usuario autenticado",
      data: { ...user, role: req.user.role },
    });
  } catch (error: any) {
    if (error.message?.includes("no encontrado")) {
      return res
        .status(401)
        .send({ status: "error", message: "Usuario no encontrado" });
    }
    return res.status(500).send({
      status: "error",
      message: `Error al obtener el usuario: ${error.message}`,
    });
  }
};

export const logout = async (req: any, res: any) => {
  try {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res.status(200).send({
      status: "success",
      message: "Sesión cerrada",
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al cerrar sesión: ${error.message}`,
    });
  }
};
