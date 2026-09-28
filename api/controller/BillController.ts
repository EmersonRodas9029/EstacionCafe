import { IService } from "../core/interfaces/IService";
import {
  createBillSchema,
  updateBillSchema,
  billIdSchema,
  tableIdSchema,
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
    const data = await service!.getAll();
    console.log("Facturas obtenidas correctamente");

    return res.status(200).send({
      status: "success",
      message: "Facturas obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
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

    const data = await billService.getById(id);
    console.log("Factura obtenida correctamente");

    return res.status(200).send({
      status: "success",
      message: "Factura obtenida correctamente",
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
      message: `Error al obtener la factura: ${error.message}`,
    });
  }
};

export const saveBill = async (req: any, res: any) => {
  try {
    const billData: SaveBillDTO = req.body;
    const result = await service!.save(createBillSchema.parse(billData));

    console.log("Factura creada correctamente");
    return res.status(201).send({
      status: "success",
      message: "Factura creada correctamente",
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
    const result = await billService.update({
      billId: id,
      ...updateData,
    });

    console.log("Factura actualizada correctamente");
    return res.status(200).send({
      status: "success",
      message: "Factura actualizada correctamente",
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
    );

    return res.status(200).send({
      status: "success",
      message: "Facturas obtenidas por rango de fecha correctamente",
      data: data,
    });
  } catch (error: any) {
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

    const data = await billService.getBillsByCustomer(customer);

    return res.status(200).send({
      status: "success",
      message: "Facturas del cliente obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
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

    const data = await billService.getBillsByTable(tableId);

    return res.status(200).send({
      status: "success",
      message: "Facturas de la mesa obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las facturas de la mesa: ${error.message}`,
    });
  }
};

export const closeBillsByTable = async (req: any, res: any) => {
  try {
    const { tableId } = tableIdSchema.parse(req.params);

    const billService = getService() as any;
    const result = await billService.closeBillsByTable(tableId);

    return res.status(200).send({
      status: "success",
      message: `Se cerraron ${result.updated} facturas de la mesa ${tableId}`,
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

    console.error("Error al cerrar facturas por mesa:", error);
    return res.status(500).send({
      status: "error",
      message: `Error al cerrar las facturas de la mesa: ${error.message}`,
    });
  }
};
