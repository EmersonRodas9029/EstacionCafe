import { IService } from "../core/interfaces/IService";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdSchema,
} from "../application/validations/PurchaseValidations";
import { SavePurchaseDTO } from "../application/DTOs/PurchaseDTO";

let service: IService | null = null;

export const setService = (purchaseService: IService) => {
  service = purchaseService;
};

const getService = () => {
  if (!service) {
    throw new Error(
      "Purchase service no está inicializado. Llama a setService primero.",
    );
  }
  return service;
};

export const getPurchases = async (req: any, res: any) => {
  try {
    const currentService = getService();
    const data = await currentService.getAll();

    return res.status(200).send({
      status: "success",
      message: "Compras obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las compras: ${error.message}`,
    });
  }
};

export const getPurchaseById = async (req: any, res: any) => {
  try {
    const { id } = purchaseIdSchema.parse(req.params);
    const purchaseService = getService() as any;
    const data = await purchaseService.getById(id);

    return res.status(200).send({
      status: "success",
      message: "Compra obtenida correctamente",
      data: data,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "ID inválido: " + error.issues[0].message,
      });
    }

    if (error.message.includes("no encontrada")) {
      return res.status(404).send({
        status: "error",
        message: error.message,
      });
    }

    return res.status(500).send({
      status: "error",
      message: `Error al obtener la compra: ${error.message}`,
    });
  }
};

export const createPurchase = async (req: any, res: any) => {
  try {
    const purchaseData: SavePurchaseDTO = req.body;
    const currentService = getService();
    const result = await currentService.save(
      createPurchaseSchema.parse(purchaseData),
    );

    return res.status(201).send({
      status: "success",
      message: "Compra creada correctamente",
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

    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const updatePurchase = async (req: any, res: any) => {
  try {
    const { id } = purchaseIdSchema.parse(req.params);
    const updateData = updatePurchaseSchema.parse(req.body);
    const purchaseService = getService() as any;
    const result = await purchaseService.update({
      purchaseId: parseInt(String(id)),
      ...updateData,
    });

    return res.status(200).send({
      status: "success",
      message: "Compra actualizada correctamente",
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

    if (error.message.includes("no encontrada")) {
      return res.status(404).send({
        status: "error",
        message: error.message,
      });
    }

    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deletePurchase = async (req: any, res: any) => {
  try {
    const { id } = purchaseIdSchema.parse(req.params);
    const currentService = getService();
    const result = await currentService.delete(parseInt(String(id)));

    return res.status(200).send({
      status: "success",
      message: "Compra eliminada correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "ID inválido: " + error.issues[0].message,
      });
    }

    if (error.message.includes("no encontrada")) {
      return res.status(404).send({
        status: "error",
        message: error.message,
      });
    }

    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getPurchasesBySupplier = async (req: any, res: any) => {
  try {
    const { supplierId } = req.params;
    const purchaseService = getService() as any;

    const data = await purchaseService.getBySupplier(parseInt(supplierId));

    return res.status(200).send({
      status: "success",
      message: "Compras del proveedor obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las compras del proveedor: ${error.message}`,
    });
  }
};

export const getPurchasesByDateRange = async (req: any, res: any) => {
  try {
    const { startDate, endDate } = req.query;
    const purchaseService = getService() as any;

    if (!startDate || !endDate) {
      return res.status(400).send({
        status: "error",
        message: "startDate y endDate son requeridos",
      });
    }

    const data = await purchaseService.getByDateRange(
      new Date(startDate),
      new Date(endDate),
    );

    return res.status(200).send({
      status: "success",
      message: "Compras por rango de fecha obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las compras por rango de fecha: ${error.message}`,
    });
  }
};
