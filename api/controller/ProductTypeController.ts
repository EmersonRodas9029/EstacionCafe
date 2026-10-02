import { IService } from "../core/interfaces/IService";
import {
  createProductTypeSchema,
  updateProductTypeSchema,
  productTypeIdSchema,
} from "../application/validations/ProductTypeValidations";
import {
  SaveProductTypeDTO,
  ProductTypeItemDTO,
  UpdateProductTypeDTO,
} from "../application/DTOs/ProductTypeDTO";

let service: IService | null = null;

export const setService = (productTypeService: IService) => {
  service = productTypeService;
};

const getService = () => {
  if (!service) {
    throw new Error(
      "ProductType service no está inicializado. Llama a setService primero.",
    );
  }
  return service;
};

export const getProductTypes = async (req: any, res: any) => {
  try {
    const productTypes = await service!.getAll();
    console.log("Tipos de producto obtenidos correctamente");

    const productTypeDTOs: ProductTypeItemDTO[] = productTypes.map(
      (productType) => ({
        productTypeId: productType.productTypeId,
        name: productType.name,
      }),
    );

    return res.status(200).send({
      status: "success",
      message: "Tipos de producto obtenidos correctamente",
      data: productTypeDTOs,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: "Error al obtener los tipos de producto: " + error.message,
    });
  }
};

export const getProductTypeById = async (req: any, res: any) => {
  try {
    const { id } = productTypeIdSchema.parse(req.params);
    const productTypeService = getService() as any;

    const data = await productTypeService.getById(id);
    console.log("Tipo de producto obtenido correctamente");

    return res.status(200).send({
      status: "success",
      message: "Tipo de producto obtenido correctamente",
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
      message: `Error al obtener el tipo de producto: ${error.message}`,
    });
  }
};

export const saveProductType = async (req: any, res: any) => {
  try {
    const productTypeData: SaveProductTypeDTO = req.body;
    const validatedData = createProductTypeSchema.parse(productTypeData);
    const currentService = getService();

    const result = await currentService.save(validatedData);
    console.log("Tipo de producto guardado correctamente");

    return res.status(201).send({
      status: "success",
      message: "El tipo de producto se guardó correctamente",
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

    console.error("Error al guardar tipo de producto:", error);
    return res.status(500).send({
      status: "error",
      message: "Error interno del servidor: " + error.message,
    });
  }
};

export const updateProductType = async (req: any, res: any) => {
  try {
    const { id } = productTypeIdSchema.parse(req.params);
    const updateData: UpdateProductTypeDTO = updateProductTypeSchema.parse(
      req.body,
    );

    const productTypeService = getService() as any;
    const result = await productTypeService.update({
      productTypeId: id,
      ...updateData,
    });

    console.log("Tipo de producto actualizado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Tipo de producto actualizado correctamente",
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

    console.error("Error al actualizar tipo de producto:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deleteProductType = async (req: any, res: any) => {
  try {
    const { id } = productTypeIdSchema.parse(req.params);
    const currentService = getService();
    const result = await currentService.delete(parseInt(String(id)));

    console.log("Tipo de producto eliminado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Tipo de producto eliminado correctamente",
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

    console.error("Error al eliminar tipo de producto:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};
