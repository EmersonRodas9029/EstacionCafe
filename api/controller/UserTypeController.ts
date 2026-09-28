import { IService } from "../core/interfaces/IService";
import {
  createUserTypeSchema,
  updateUserTypeSchema,
  userTypeIdSchema,
} from "../application/validations/UserTypeValidations";
import { SaveUserTypeDTO } from "../application/DTOs/UserDTO";

let service: IService | null = null;

export const setService = (userTypeService: IService) => {
  service = userTypeService;
};

const getService = () => {
  if (!service) {
    throw new Error(
      "UserType service no está inicializado. Llama a setService primero.",
    );
  }
  return service;
};

export const getUserTypes = async (req: any, res: any) => {
  try {
    const data = await service!.getAll();
    console.log("Tipos de usuario obtenidos correctamente");

    return res.status(200).send({
      status: "success",
      message: "Tipos de usuario obtenidos correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener los tipos de usuario: ${error.message}`,
    });
  }
};

export const getUserTypeById = async (req: any, res: any) => {
  try {
    const { id } = userTypeIdSchema.parse(req.params);
    const userTypeService = getService() as any;

    const data = await userTypeService.getById(id);
    console.log("Tipo de usuario obtenido correctamente");

    return res.status(200).send({
      status: "success",
      message: "Tipo de usuario obtenido correctamente",
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
      message: `Error al obtener el tipo de usuario: ${error.message}`,
    });
  }
};

export const saveUserType = async (req: any, res: any) => {
  try {
    const userTypeData: SaveUserTypeDTO = req.body;
    const result = await service!.save(
      createUserTypeSchema.parse(userTypeData),
    );

    console.log("Tipo de usuario creado correctamente");
    return res.status(201).send({
      status: "success",
      message: "Tipo de usuario creado correctamente",
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

    console.error("Error al crear tipo de usuario:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const updateUserType = async (req: any, res: any) => {
  try {
    const { id } = userTypeIdSchema.parse(req.params);
    const updateData = updateUserTypeSchema.parse(req.body);

    const userTypeService = getService() as any;
    const result = await userTypeService.update({
      userTypeId: id,
      ...updateData,
    });

    console.log("Tipo de usuario actualizado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Tipo de usuario actualizado correctamente",
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

    console.error("Error al actualizar tipo de usuario:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deleteUserType = async (req: any, res: any) => {
  try {
    const { id } = userTypeIdSchema.parse(req.params);
    const result = await service!.delete(parseInt(String(id)));

    console.log("Tipo de usuario eliminado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Tipo de usuario eliminado correctamente",
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

    console.error("Error al eliminar tipo de usuario:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};
