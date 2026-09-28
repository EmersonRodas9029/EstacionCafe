import { IService } from "../core/interfaces/IService";
import {
  IngredientSchema,
  createIngredientSchema,
  updateIngredientSchema,
  ingredientIdSchema,
} from "../application/validations/IngredientValidations";
import {
  SaveIngredientDTO,
  UpdateIngredientDTO,
} from "../application/DTOs/IngredientDTOs";

let service: IService | null = null;

export const setService = (ingredientService: IService) => {
  service = ingredientService;
};

const getService = () => {
  if (!service) {
    throw new Error(
      "Ingredient service no está inicializado. Llama a setService primero.",
    );
  }
  return service;
};

export const getIngredients = async (req: any, res: any) => {
  try {
    const result = await service!.getAll();
    console.log("Ingredientes obtenidos correctamente");
    return res.status(200).send({
      status: "success",
      message: "Ingredientes obtenidos correctamente",
      data: result,
    });
  } catch (error: any) {
    console.error("Error al conseguir los ingredientes:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getIngredientById = async (req: any, res: any) => {
  try {
    const { id } = ingredientIdSchema.parse(req.params);
    const ingredientService = getService() as any;

    const data = await ingredientService.getById(id);
    console.log("Ingrediente obtenido correctamente");

    return res.status(200).send({
      status: "success",
      message: "Ingrediente obtenido correctamente",
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
      message: `Error al obtener el ingrediente: ${error.message}`,
    });
  }
};

export const saveIngredient = async (req: any, res: any) => {
  try {
    const data = req.body;
    const validatedData = IngredientSchema.parse(data);
    const currentService = getService();
    const result = await currentService.save(validatedData);

    console.log("Ingrediente guardado correctamente");
    return res.status(201).send({
      status: "success",
      message: "Ingrediente guardado correctamente",
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

    console.error("Error al guardar el ingrediente:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const updateIngredient = async (req: any, res: any) => {
  try {
    const { id } = ingredientIdSchema.parse(req.params);
    const updateData = updateIngredientSchema.parse(req.body);

    const ingredientService = getService() as any;
    const result = await ingredientService.update({
      ingredientId: id,
      ...updateData,
    });

    console.log("Ingrediente actualizado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Ingrediente actualizado correctamente",
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

    console.error("Error al actualizar ingrediente:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deleteIngredient = async (req: any, res: any) => {
  try {
    const { id } = ingredientIdSchema.parse(req.params);
    const currentService = getService();
    const result = await currentService.delete(parseInt(String(id)));

    console.log("Ingrediente eliminado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Ingrediente eliminado correctamente",
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

    console.error("Error al eliminar ingrediente:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getIngredientsByProduct = async (req: any, res: any) => {
  try {
    const { productId } = req.params;
    const ingredientService = getService() as any;

    const data = await ingredientService.getByProduct(parseInt(productId));

    return res.status(200).send({
      status: "success",
      message: "Ingredientes del producto obtenidos correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener los ingredientes del producto: ${error.message}`,
    });
  }
};
