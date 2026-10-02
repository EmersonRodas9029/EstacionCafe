import { IService } from "../core/interfaces/IService";
import { AppError, sendAppError } from "../application/errors/AppError";
import {
  createBillSchema,
  updateBillSchema,
  billIdSchema,
  tableIdSchema,
  billFiltersSchema,
  closeTableBillsSchema,
} from "../application/validations/BillValidations";
import { SaveBillDTO } from "../application/DTOs/BillsDTO";

let service: IService | null = null;

export const setService = (billService: IService) => {
  service = billService;
};

const getService = () => {
  if (!service) {
    throw new Error(
      "Bill service no está inicializado. Llama a setService primero.",
    );
  }
  return service;
};

export const getBills = async (req: any, res: any) => {
  try {
    const { mine, ...filters } = billFiltersSchema.parse(req.query ?? {});
    if (mine) filters.waiterId = req.user?.userId;

    const { items, total } = await (getService() as any).find(filters, req.user);

    return res.status(200).send({
      status: "success",
      message: "Facturas obtenidas correctamente",
      data: items,
      ...(filters.page && {
        meta: { page: filters.page, limit: filters.limit ?? 20, total },
      }),
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "Filtros inválidos: " + error.issues[0].message,
        campo: error.issues[0].path,
      });
    }
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las facturas: ${error.message}`,
    });
  }
};

export const getBillById = async (req: any, res: any) => {
  try {
    const { id } = billIdSchema.parse(req.params);
    const billService = getService() as any;

    const data = await billService.getById(id, req.user);
    console.log("Factura obtenida correctamente");

    return res.status(200).send({
      status: "success",
      message: "Factura obtenida correctamente",
      data: data,
    });
  } catch (error: any) {
    if (error instanceof AppError) return sendAppError(res, error);
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
      message: `Error al obtener la factura: ${error.message}`,
    });
  }
};

export const saveBill = async (req: any, res: any) => {
  try {
    const billData: SaveBillDTO = createBillSchema.parse(req.body);
    const result = await service!.save({
      ...billData,
      waiterId: req.user.userId,
    });

    console.log("Factura creada correctamente");
    return res.status(201).send({
      status: "success",
      message: "Factura creada correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AppError) return sendAppError(res, error);
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "Datos inválidos: " + error.issues[0].message,
        campo: error.issues[0].path,
        error: error.issues[0].code,
      });
    }

    console.error("Error al crear factura:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const updateBill = async (req: any, res: any) => {
  try {
    const { id } = billIdSchema.parse(req.params);
    const updateData = updateBillSchema.parse(req.body);

    const billService = getService() as any;
    const result = await billService.update(
      {
        billId: id,
        ...updateData,
      },
      req.user,
    );

    console.log("Factura actualizada correctamente");
    return res.status(200).send({
      status: "success",
      message: "Factura actualizada correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AppError) return sendAppError(res, error);
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

    console.error("Error al actualizar factura:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deleteBill = async (req: any, res: any) => {
  try {
    const { id } = billIdSchema.parse(req.params);
    const result = await service!.delete(parseInt(String(id)));

    console.log("Factura eliminada correctamente");
    return res.status(200).send({
      status: "success",
      message: "Factura eliminada correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AppError) return sendAppError(res, error);
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

    console.error("Error al eliminar factura:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const voidBill = async (req: any, res: any) => {
  try {
    const { id } = billIdSchema.parse(req.params);
    const result = await (getService() as any).void(parseInt(String(id)));

    return res.status(200).send({
      status: "success",
      message: "Factura anulada correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AppError) return sendAppError(res, error);
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "ID inválido: " + error.issues[0].message,
      });
    }

    console.error("Error al anular factura:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getBillsByDateRange = async (req: any, res: any) => {
  try {
    const { startDate, endDate } = req.query;
    const billService = getService() as any;

    if (!startDate || !endDate) {
      return res.status(400).send({
        status: "error",
        message: "startDate y endDate son requeridos",
      });
    }

    const data = await billService.getByDateRange(
      new Date(startDate),
      new Date(endDate),
      req.user,
    );

    return res.status(200).send({
      status: "success",
      message: "Facturas obtenidas por rango de fecha correctamente",
      data: data,
    });
  } catch (error: any) {
    if (error instanceof AppError) return sendAppError(res, error);
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las facturas por rango de fecha: ${error.message}`,
    });
  }
};

export const getBillsByCustomer = async (req: any, res: any) => {
  try {
    const { customer } = req.params;
    const billService = getService() as any;

    const data = await billService.getBillsByCustomer(customer, req.user);

    return res.status(200).send({
      status: "success",
      message: "Facturas del cliente obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
    if (error instanceof AppError) return sendAppError(res, error);
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las facturas del cliente: ${error.message}`,
    });
  }
};

export const getBillsByTable = async (req: any, res: any) => {
  try {
    const { tableId } = req.params;
    const billService = getService() as any;

    const data = await billService.getBillsByTable(tableId, req.user);

    return res.status(200).send({
      status: "success",
      message: "Facturas de la mesa obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
    if (error instanceof AppError) return sendAppError(res, error);
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las facturas de la mesa: ${error.message}`,
    });
  }
};

export const closeBillsByTable = async (req: any, res: any) => {
  try {
    const { tableId } = tableIdSchema.parse(req.params);
    const { cashRegisterId } = closeTableBillsSchema.parse(req.body ?? {});

    const billService = getService() as any;
    const result = await billService.closeBillsByTable(tableId, cashRegisterId, req.user);

    return res.status(200).send({
      status: "success",
      message: `Se cerraron ${result.updated} facturas de la mesa ${tableId}`,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AppError) return sendAppError(res, error);
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "Datos inválidos: " + error.issues[0].message,
        campo: error.issues[0].path,
      });
    }

    console.error("Error al cerrar facturas por mesa:", error);
    return res.status(500).send({
      status: "error",
      message: `Error al cerrar las facturas de la mesa: ${error.message}`,
    });
  }
};
