import { IService } from "../core/interfaces/IService";
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdSchema,
} from "../application/validations/SupplierValidations";
import { SaveSupplierDTO } from "../application/DTOs/SupplierDTO";

let service: IService;
export const setService = (supplierService: IService) => {
  service = supplierService;
};

export const getSuppliers = async (req: any, res: any) => {
  try {
    const data = await service.getAll();
    console.log("Proveedores obtenidos correctamente");

    return res.status(200).send({
      status: "success",
      message: "Proveedores obtenidos correctamente",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener los proveedores: ${error}`,
    });
  }
};

export const getSupplierById = async (req: any, res: any) => {
  try {
    const { id } = supplierIdSchema.parse(req.params);
    const supplierService = service as any;

    const data = await supplierService.getById(id);
    console.log("Proveedor obtenido correctamente");

    return res.status(200).send({
      status: "success",
      message: "Proveedor obtenido correctamente",
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
      message: `Error al obtener el proveedor: ${error.message}`,
    });
  }
};

export const createSupplier = async (req: any, res: any) => {
  try {
    const supplierData: SaveSupplierDTO = req.body;
    const result = await service.save(createSupplierSchema.parse(supplierData));

    console.log("Proveedor creado correctamente");
    return res.status(201).send({
      status: "success",
      message: "Proveedor creado correctamente",
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

    console.error("Error al crear proveedor:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const updateSupplier = async (req: any, res: any) => {
  try {
    const { id } = supplierIdSchema.parse(req.params);
    const updateData = updateSupplierSchema.parse(req.body);

    const supplierService = service as any;
    const result = await supplierService.update({
      supplierId: id,
      ...updateData,
    });

    console.log("Proveedor actualizado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Proveedor actualizado correctamente",
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

    console.error("Error al actualizar proveedor:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const deleteSupplier = async (req: any, res: any) => {
  try {
    const { id } = supplierIdSchema.parse(req.params);
    const result = await service.delete(id);

    console.log("Proveedor eliminado correctamente");
    return res.status(200).send({
      status: "success",
      message: "Proveedor eliminado correctamente",
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

    console.error("Error al eliminar proveedor:", error);
    return res.status(500).send({
      status: "error",
      message: `Error interno del servidor: ${error.message}`,
    });
  }
};

export const getActiveSuppliers = async (req: any, res: any) => {
  try {
    const supplierService = service as any;
    const data = await supplierService.getActiveSuppliers();

    console.log("Proveedores activos obtenidos correctamente");
    return res.status(200).send({
      status: "success",
      message: "Proveedores activos obtenidos correctamente",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: `Error al obtener los proveedores activos: ${error}`,
    });
  }
};
