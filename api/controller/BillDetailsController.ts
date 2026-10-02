import { IService } from "../core/interfaces/IService";
import { BillDetailsSchema } from "../application/validations/BillDetailsValidations";
import { BillDetailResponse } from "../application/DTOs/BillsDTO";

let service: IService;
export const setService = (detailsService: IService) => {
  service = detailsService;
};

export const saveDetails = async (req: any, res: any) => {
  try {
    // Validar datos con Zod
    const validatedData = BillDetailsSchema.parse(req.body);
    console.log("DESPUES DEL ZOD: ");

    console.log(validatedData);

    const result = await service.saveAll(validatedData);

    console.log("Factura y detalles guardados correctamente");
    return res.status(201).send({
      status: "success",
      message: "Factura y detalles guardados correctamente",
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

    // Error de negocio por stock insuficiente
    if (error.message?.includes("Stock insuficiente")) {
      const errorMessage =
        error.message ||
        error.detail ||
        "Error de validación en la base de datos";
      console.log("Error de stock:", errorMessage);
      return res.status(400).send({
        status: "error",
        message: errorMessage,
        type: "stock_error",
      });
    }

    // Manejar errores de validación de negocio
    if (
      error.message &&
      (error.message.includes("no encontrado") ||
        error.message.includes("no coincide") ||
        error.message.includes("no es correcto"))
    ) {
      console.log("Error de validación:", error.message);
      return res.status(400).send({
        status: "error",
        message: error.message,
      });
    }

    console.log("Error del servidor:", error);
    return res.status(500).send({
      status: "error",
      message: "Hubo un error en el servidor al guardar el detalle",
      errors: error.message || error,
    });
  }
};

export const getDetails = async (req: any, res: any) => {
  try {
    const data = await service.getAll();
    console.log("Detalles obtenidos corretamente");

    return res.status(200).send({
      status: "success",
      message: "Detalles obtenidos corretamente",
      data: data,
    });
  } catch (error: any) {
    console.log(error);

    return res.status(500).send({
      status: "error",
      message: "Hubo un error en el servidor",
      errors: error.error || error,
    });
  }
};

export const deleteDetail = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const detailId = parseInt(id);

    if (isNaN(detailId)) {
      return res.status(400).send({
        status: "error",
        message: "ID inválido: debe ser un número",
      });
    }

    await service.delete(detailId);
    console.log("Detalle eliminado correctamente");
    return res.status(202).send({
      status: "success",
      message: "Detalle eliminado correctamente",
    });
  } catch (error: any) {
    if (error.message.includes("no encontrado")) {
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

export const getDetailsByBillId = async (req: any, res: any) => {
  try {
    const { billId } = req.params;
    const parsedBillId = parseInt(billId);

    if (isNaN(parsedBillId)) {
      return res.status(400).send({
        status: "error",
        message: "ID de factura inválido: debe ser un número",
      });
    }

    const details = await service.getById(parsedBillId);
    if (!details || details.length === 0) {
      return res.status(404).send({
        status: "error",
        message: `No se encontraron detalles para la factura con ID ${parsedBillId}`,
      });
    }

    let data: BillDetailResponse[] = details;
    data = data.map((i: any) => {
      return {
        productId: i.productId,
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
        subTotal: i.subTotal,
      };
    });

    console.log(
      `Detalles de la factura ${parsedBillId} obtenidos correctamente`,
    );
    return res.status(200).send({
      status: "success",
      message: "Detalles obtenidos correctamente",
      data: data,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).send({
      status: "error",
      message: "Hubo un error en el servidor al obtener los detalles",
      errors: error.error || error,
    });
  }
};
