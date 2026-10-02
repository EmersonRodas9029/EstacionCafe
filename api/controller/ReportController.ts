import { ReportService } from "../application/services/ReportService";
import { salesReportSchema } from "../application/validations/ReportValidations";

let service: ReportService | null = null;

export const setService = (reportService: ReportService) => {
  service = reportService;
};

export const getSalesReport = async (req: any, res: any) => {
  try {
    const { from, to, top } = salesReportSchema.parse(req.query ?? {});
    const data = await service!.sales(from, to, top);

    return res.status(200).send({
      status: "success",
      message: "Reporte de ventas generado correctamente",
      data,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).send({
        status: "error",
        message: "Datos inválidos: " + error.issues[0].message,
        campo: error.issues[0].path,
      });
    }
    return res.status(500).send({
      status: "error",
      message: `Error al generar el reporte: ${error.message}`,
    });
  }
};
