import { IService } from "../core/interfaces/IService";
import {
  ConsumableTypeSchema,
  createConsumableTypeSchema,
  updateConsumableTypeSchema,
  consumableTypeIdSchema,
} from "../application/validations/ConsumableTypeValidations";
import {
  SaveConsumableTypeDTO,
  UpdateConsumableTypeDTO,
} from "../application/DTOs/ConsumableDTO";

let service: IService | null = null;

export const setService = (consumableTypeService: IService) => {
  service = consumableTypeService;
};

const getService = () => {
  if (!service) {
    throw new Error(
      "ConsumableType service no está inicializado. Llama a setService primero.",
    );
  }
  return service;
};

export const getConsumableTypes = async (req: any, res: any) => {
  try {
    const data = await service!.getAll();

    return res.status(200).send({
      status: "success",
      message: "Tipos de consumibles obtenidos correctamente",
      data: data,
    });
  } catch (error: any) {
    console.error("Error al obtener los tipos de consumibles:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getConsumableTypeById = async (req: any, res: any) => {
  try {
    const { id } = consumableTypeIdSchema.parse(req.params);
    const consumableTypeService = getService() as any;

    const data = await consumableTypeService.getById(id);
    console.log("Tipo de consumible obtenido correctamente");

    return res.status(200).send({
      status: "success",
      message: "Tipo de consumible obtenido correctamente",
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
      message: `Error al obtener el tipo de consumible: ${error.message}`,
    });
  }
};

export const saveConsumableType = async (req: any, res: any) => {
  try {
    const data = req.body;
    const validatedData = ConsumableTypeSchema.parse(data);
    const currentService = getService();
    const result = await currentService.save(validatedData);

    return res.status(201).send({
      status: "success",
      message: "Tipo de consumible guardado correctamente",
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

    console.error("Error al guardar el tipo de consumible:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const updateConsumableType = async (req: any, res: any) => {
  try {
    const { id } = consumableTypeIdSchema.parse(req.params);
    const updateData = updateConsumableTypeSchema.parse(req.body);

    const consumableTypeService = getService() as any;
    const result = await consumableTypeService.update({
      consumableTypeId: id,
      ...updateData,
    });

    console.log("Tipo de consumible actualizado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Tipo de consumible actualizado correctamente",
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

    console.error("Error al actualizar tipo de consumible:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deleteConsumableType = async (req: any, res: any) => {
  try {
    const { id } = consumableTypeIdSchema.parse(req.params);
    const currentService = getService();
    const result = await currentService.delete(parseInt(String(id)));

    console.log("Tipo de consumible eliminado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Tipo de consumible eliminado correctamente",
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

    console.error("Error al eliminar tipo de consumible:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};
