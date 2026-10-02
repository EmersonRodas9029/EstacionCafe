import { IService } from "../core/interfaces/IService";
import {
  createTableSchema,
  updateTableSchema,
  tableIdSchema,
} from "../application/validations/TableValidations";
import { SaveTableDTO } from "../application/DTOs/TableDTO";
import { TableStatus } from "../core/entities/Table";

let service: IService | null = null;

export const setService = (tableService: IService) => {
  service = tableService;
};

const getService = () => {
  if (!service) {
    throw new Error(
      "Table service no está inicializado. Llama a setService primero.",
    );
  }
  return service;
};

export const getTables = async (req: any, res: any) => {
  try {
    const data = await service!.getAll();
    console.log("Mesas obtenidas correctamente");

    return res.status(200).send({
      status: "success",
      message: "Mesas obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las mesas: ${error.message}`,
    });
  }
};

export const getTableById = async (req: any, res: any) => {
  try {
    const { id } = tableIdSchema.parse(req.params);
    const tableService = getService() as any;

    const data = await tableService.getById(id);
    console.log("Mesa obtenida correctamente");

    return res.status(200).send({
      status: "success",
      message: "Mesa obtenida correctamente",
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
      message: `Error al obtener la mesa: ${error.message}`,
    });
  }
};

export const saveTable = async (req: any, res: any) => {
  try {
    const tableData: SaveTableDTO = req.body;
    const result = await service!.save(createTableSchema.parse(tableData));

    console.log("Mesa creada correctamente");
    return res.status(201).send({
      status: "success",
      message: "Mesa creada correctamente",
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

    if (error.message.includes("ya existe")) {
      return res.status(409).send({
        status: "error",
        message: error.message,
      });
    }

    console.error("Error al crear mesa:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const updateTable = async (req: any, res: any) => {
  try {
    const { id } = tableIdSchema.parse(req.params);
    const updateData = updateTableSchema.parse(req.body);

    const tableService = getService() as any;
    const result = await tableService.update({
      tableId: id,
      ...updateData,
    });

    console.log("Mesa actualizada correctamente");
    return res.status(200).send({
      status: "success",
      message: "Mesa actualizada correctamente",
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

    console.error("Error al actualizar mesa:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deleteTable = async (req: any, res: any) => {
  try {
    const { id } = tableIdSchema.parse(req.params);
    const tableService = getService() as any;
    const result = await tableService.delete(id);

    console.log("Mesa eliminada correctamente");
    return res.status(200).send({
      status: "success",
      message: "Mesa eliminada correctamente",
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

    console.error("Error al eliminar mesa:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getTablesByZone = async (req: any, res: any) => {
  try {
    const { zone } = req.params;
    const tableService = getService() as any;

    const data = await tableService.getByZone(zone);

    return res.status(200).send({
      status: "success",
      message: "Mesas de la zona obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las mesas de la zona: ${error.message}`,
    });
  }
};

export const getTablesByStatus = async (req: any, res: any) => {
  try {
    const { status } = req.params;

    if (!Object.values(TableStatus).includes(status as TableStatus)) {
      return res.status(400).send({
        status: "error",
        message: `Estado inválido. Debe ser uno de: ${Object.values(TableStatus).join(", ")}`,
      });
    }

    const tableService = getService() as any;
    const data = await tableService.getByStatus(status as TableStatus);

    return res.status(200).send({
      status: "success",
      message: `Mesas con estado ${status} obtenidas correctamente`,
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las mesas por estado: ${error.message}`,
    });
  }
};

export const getAvailableTables = async (req: any, res: any) => {
  try {
    const tableService = getService() as any;
    const data = await tableService.getAvailableTables();

    return res.status(200).send({
      status: "success",
      message: "Mesas disponibles obtenidas correctamente",
      data: data,
    });
  } catch (error: any) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener las mesas disponibles: ${error.message}`,
    });
  }
};

export const updateTableStatus = async (req: any, res: any) => {
  try {
    const { id } = tableIdSchema.parse(req.params);
    const { status } = req.body;

    if (
      !status ||
      !Object.values(TableStatus).includes(status as TableStatus)
    ) {
      return res.status(400).send({
        status: "error",
        message: `Estado inválido. Debe ser uno de: ${Object.values(TableStatus).join(", ")}`,
      });
    }

    const tableService = getService() as any;
    const result = await tableService.updateTableStatus(
      id,
      status as TableStatus,
    );

    console.log("Estado de mesa actualizado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Estado de mesa actualizado correctamente",
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

    console.error("Error al actualizar estado de mesa:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};
