import { IService } from "../core/interfaces/IService";
import {
  ConsumableSchema,
  createConsumableSchema,
  updateConsumableSchema,
  consumableIdSchema,
} from "../application/validations/ConsumableValidations";
import {
  SaveConsumableDTO,
  UpdateConsumableDTO,
} from "../application/DTOs/ConsumableDTO";

let service: IService | null = null;

export const setService = (consumableService: IService) => {
  service = consumableService;
};

const getService = () => {
  if (!service) {
    throw new Error(
      "Consumable service no está inicializado. Llama a setService primero.",
    );
  }
  return service;
};

export const getConsumables = async (req: any, res: any) => {
  try {
    const data = await service!.getAll();

    return res.status(200).send({
      status: "success",
      message: "Consumibles obtenidos correctamente",
      data: data,
    });
  } catch (error: any) {
    console.error("Error al obtener los consumibles:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getConsumableById = async (req: any, res: any) => {
  try {
    const { id } = consumableIdSchema.parse(req.params);
    const consumableService = getService() as any;

    const data = await consumableService.getById(id);
    console.log("Consumible obtenido correctamente");

    return res.status(200).send({
      status: "success",
      message: "Consumible obtenido correctamente",
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
      message: `Error al obtener el consumible: ${error.message}`,
    });
  }
};

export const saveConsumable = async (req: any, res: any) => {
  try {
    const data = req.body;
    const validatedData = ConsumableSchema.parse(data);
    const currentService = getService();
    const result = await currentService.save(validatedData);

    return res.status(201).send({
      status: "success",
      message: "Consumible guardado correctamente",
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

    console.error("Error al guardar el consumible:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const updateConsumable = async (req: any, res: any) => {
  try {
    const { id } = consumableIdSchema.parse(req.params);
    const updateData = updateConsumableSchema.parse(req.body);

    const consumableService = getService() as any;
    const result = await consumableService.update({
      consumableId: id,
      ...updateData,
    });

    console.log("Consumible actualizado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Consumible actualizado correctamente",
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

    console.error("Error al actualizar consumible:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deleteConsumable = async (req: any, res: any) => {
  try {
    const { id } = consumableIdSchema.parse(req.params);
    const currentService = getService();
    const result = await currentService.delete(parseInt(String(id)));

    console.log("Consumible eliminado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Consumible eliminado correctamente",
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

    console.error("Error al eliminar consumible:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getConsumablesBySupplier = async (req: any, res: any) => {
  try {
    const { supplierId } = req.params;
    const consumableService = getService() as any;

    const data = await consumableService.getBySupplier(parseInt(supplierId));

    return res.status(200).send({
      status: "success",
      message: "Consumibles del proveedor obtenidos correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener los consumibles del proveedor: ${error.message}`,
    });
  }
};
