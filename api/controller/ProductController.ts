import { IService } from "../core/interfaces/IService";
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
} from "../application/validations/ProductValidations";
import {
  SaveProductDTO,
  ProductItemDTO,
  UpdateProductDTO,
} from "../application/DTOs/ProductDTO";

let service: IService | null = null;

export const setService = (productService: IService) => {
  service = productService;
};

const getService = () => {
  if (!service) {
    throw new Error(
      "Product service no está inicializado. Llama a setService primero.",
    );
  }
  return service;
};

export const getProducts = async (req: any, res: any) => {
  try {
    const products = await service!.getAll();
    console.log("Productos obtenidos correctamente");

    const productDTOs: ProductItemDTO[] = products.map((product) => ({
      productId: product.productId,
      name: product.name,
      description: product.description,
      price: product.price,
      cost: product.cost,
      productTypeId: product.productTypeId,
      active: product.active,
    }));

    return res.status(200).send({
      status: "success",
      message: "Productos obtenidos correctamente",
      data: productDTOs,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: "Error al obtener los productos: " + error.message,
    });
  }
};

export const getProductById = async (req: any, res: any) => {
  try {
    const { id } = productIdSchema.parse(req.params);
    const productService = getService() as any;

    const data = await productService.getById(id);
    console.log("Producto obtenido correctamente");

    return res.status(200).send({
      status: "success",
      message: "Producto obtenido correctamente",
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
      message: `Error al obtener el producto: ${error.message}`,
    });
  }
};

export const saveProduct = async (req: any, res: any) => {
  try {
    const productData: SaveProductDTO = req.body;
    const validatedData = createProductSchema.parse(productData);
    const currentService = getService();

    const result = await currentService.save(validatedData);
    console.log("Producto guardado correctamente");

    return res.status(201).send({
      status: "success",
      message: "El producto se guardó correctamente",
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

    console.error("Error al guardar producto:", error);
    return res.status(500).send({
      status: "error",
      message: "Error interno del servidor: " + error.message,
    });
  }
};

export const updateProduct = async (req: any, res: any) => {
  try {
    const { id } = productIdSchema.parse(req.params);
    const updateData: UpdateProductDTO = updateProductSchema.parse(req.body);

    const productService = getService() as any;
    const result = await productService.update({
      productId: id,
      ...updateData,
    });

    console.log("Producto actualizado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Producto actualizado correctamente",
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

    console.error("Error al actualizar producto:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deleteProduct = async (req: any, res: any) => {
  try {
    const { id } = productIdSchema.parse(req.params);
    const currentService = getService();
    const result = await currentService.delete(parseInt(String(id)));

    console.log("Producto eliminado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Producto eliminado correctamente",
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

    console.error("Error al eliminar producto:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getActiveProducts = async (req: any, res: any) => {
  try {
    const productService = getService() as any;
    const data = await productService.getActiveProducts();

    console.log("Productos activos obtenidos correctamente");
    return res.status(200).send({
      status: "success",
      message: "Productos activos obtenidos correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener los productos activos: ${error.message}`,
    });
  }
};
