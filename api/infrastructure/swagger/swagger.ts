/**
 * Especificación OpenAPI escrita a mano. Debe reflejar exactamente
 * application/Routes, validations y entities. El frontend genera su cliente
 * (orval) desde /api/docs.json usando operationId y tags.
 */

const jsonContent = (schema: any) => ({
  "application/json": { schema },
});

const successSchema = (dataSchema?: any, extra: Record<string, any> = {}) => {
  const properties: any = {
    status: { type: "string", enum: ["success"] },
    message: { type: "string", example: "Operación realizada correctamente" },
    ...extra,
  };
  const required = ["status", "message"];

  if (dataSchema) {
    properties.data = dataSchema;
    required.push("data");
  }

  return { type: "object", properties, required };
};

const successResponse = (
  description: string,
  dataSchema?: any,
  extra?: Record<string, any>,
) => ({
  description,
  content: jsonContent(successSchema(dataSchema, extra)),
});

const errorResponse = (description: string) => ({
  description,
  content: jsonContent({ $ref: "#/components/schemas/ErrorResponse" }),
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const arrayOf = (name: string) => ({ type: "array", items: ref(name) });

const intPathParam = (name: string, description: string) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "integer", minimum: 1 },
});

const strPathParam = (
  name: string,
  description: string,
  schema: any = { type: "string" },
) => ({
  name,
  in: "path",
  required: true,
  description,
  schema,
});

const queryParam = (
  name: string,
  description: string,
  schema: any,
  required = false,
) => ({ name, in: "query", required, description, schema });

const requestBody = (schemaRef: string, description?: string) => ({
  required: true,
  ...(description && { description }),
  content: jsonContent(ref(schemaRef)),
});

/** Número aceptado como number o string numérico. */
const numeric = (extra: any = {}) => ({
  oneOf: [{ type: "number", ...extra }, { type: "string" }],
});
const integerish = (extra: any = {}) => ({
  oneOf: [{ type: "integer", minimum: 1, ...extra }, { type: "string" }],
});

const deleteResult = {
  type: "object",
  properties: {
    message: { type: "string" },
    id: { oneOf: [{ type: "integer" }, { type: "string" }] },
  },
};

type RoleGuard = "admin" | "cashier" | "staff" | "any" | "public";

const ROLE_TEXT: Record<RoleGuard, string> = {
  admin: "Roles: admin.",
  cashier: "Roles: admin, cajero.",
  staff: "Roles: admin, mesero, cajero.",
  any: "Roles: cualquier usuario autenticado.",
  public: "Pública (sin token).",
};

const ROLE_LIST: Record<RoleGuard, string[]> = {
  admin: ["admin"],
  cashier: ["admin", "cajero"],
  staff: ["admin", "mesero", "cajero"],
  any: ["admin", "mesero", "cajero"],
  public: [],
};

/**
 * Construye una operación. Agrega 401/403 en rutas protegidas y 500 siempre.
 * `errors` son los códigos adicionales que devuelve el controlador.
 */
const op = (config: {
  id: string;
  tag: string;
  summary: string;
  roles: RoleGuard;
  description?: string;
  parameters?: any[];
  body?: string;
  ok: { code?: number; description: string; schema?: any; extra?: any };
  errors?: Record<number, string>;
}) => {
  const responses: Record<string, any> = {
    [config.ok.code ?? 200]: successResponse(
      config.ok.description,
      config.ok.schema,
      config.ok.extra,
    ),
  };
  for (const [code, description] of Object.entries(config.errors ?? {})) {
    responses[code] = errorResponse(description);
  }
  if (config.roles !== "public") {
    responses[401] ??= errorResponse("Token ausente, inválido o expirado");
    if (config.roles !== "any") {
      responses[403] = errorResponse("Rol sin permiso para esta operación");
    }
  }
  responses[500] = errorResponse("Error interno del servidor");

  return {
    tags: [config.tag],
    operationId: config.id,
    summary: config.summary,
    description: [config.description, ROLE_TEXT[config.roles]]
      .filter(Boolean)
      .join("\n\n"),
    "x-roles": ROLE_LIST[config.roles],
    ...(config.roles === "public" && { security: [] }),
    ...(config.parameters && { parameters: config.parameters }),
    ...(config.body && { requestBody: requestBody(config.body) }),
    responses,
  };
};

const idParam = (what: string) => intPathParam("id", `ID de ${what}`);

const swaggerDocument: any = {
  openapi: "3.0.3",
  info: {
    title: "EstacionCafe API",
    version: "2.0.0",
    description:
      "API REST de EstacionCafé. La sesión vive en la cookie httpOnly `auth_token` (el navegador nunca ve el token) y se valida en cada petición contra la tabla de sesiones: logout, baja del usuario, cambio de rol/PIN/contraseña o revocar el dispositivo la cortan al instante. Con la cookie, toda petición que modifica datos exige el header `X-Requested-With: EstacionCafe` (anti-CSRF). Scripts y pruebas pueden usar `Authorization: Bearer <token>` pidiendo el token en el login con `X-Token-In-Body: true`. Los roles permitidos de cada operación están en su descripción y en `x-roles`.",
  },
  servers: [],
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  tags: [
    { name: "Auth", description: "Inicio y cierre de sesión (contraseña o PIN)" },
    { name: "Devices", description: "Dispositivos del local autorizados para PIN" },
    { name: "Users", description: "Usuarios del sistema" },
    { name: "UserTypes", description: "Tipos de usuario y su rol" },
    { name: "Products", description: "Productos del menú" },
    { name: "ProductTypes", description: "Categorías de producto" },
    { name: "Bills", description: "Cuentas en mesa y órdenes para llevar" },
    { name: "BillDetails", description: "Líneas (productos) de una cuenta" },
    { name: "Tables", description: "Mesas y zonas" },
    { name: "CashRegisters", description: "Cajas registradoras" },
    { name: "Consumables", description: "Inventario de consumibles" },
    { name: "ConsumableTypes", description: "Tipos de consumible" },
    { name: "Ingredients", description: "Recetas: consumibles por producto" },
    { name: "Suppliers", description: "Proveedores" },
    { name: "Purchases", description: "Compras a proveedores" },
    { name: "Reports", description: "Reportes para el dashboard" },
    { name: "Health", description: "Estado del servicio" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "auth_token" },
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["error"] },
          message: { type: "string", example: "Datos inválidos: ..." },
          campo: {
            description: "Ruta del campo que falló la validación",
            type: "array",
            items: { oneOf: [{ type: "string" }, { type: "integer" }] },
            example: ["tableId"],
          },
          error: { type: "string", description: "Código de error Zod" },
          type: {
            type: "string",
            description: "Tipo de error de negocio",
            enum: ["stock_error"],
          },
          errors: {},
        },
        required: ["status", "message"],
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1 },
          limit: { type: "integer", minimum: 1, maximum: 200 },
          total: { type: "integer", minimum: 0 },
        },
        required: ["page", "limit", "total"],
      },
      DeleteResult: deleteResult,
      Health: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["success"] },
          database: { type: "string", enum: ["connected", "disconnected"] },
        },
        required: ["status", "database"],
      },

      // ---------- Auth / usuarios ----------
      Role: { type: "string", enum: ["admin", "mesero", "cajero"] },
      LoginRequest: {
        type: "object",
        properties: {
          username: { type: "string", minLength: 1 },
          password: { type: "string", minLength: 1 },
        },
        required: ["username", "password"],
      },
      SessionUser: {
        type: "object",
        properties: {
          userId: { type: "integer" },
          username: { type: "string" },
          email: { type: "string" },
          role: ref("Role"),
        },
        required: ["userId", "username", "email", "role"],
      },
      LoginData: {
        type: "object",
        properties: {
          user: ref("SessionUser"),
          expiresIn: {
            type: "integer",
            description: "Segundos de vigencia de la sesión (contraseña 12 h, PIN 30 min)",
            example: 43200,
          },
          token: {
            type: "string",
            description: "Solo si la petición trae `X-Token-In-Body: true` (scripts con Bearer)",
          },
        },
        required: ["user", "expiresIn"],
      },
      PinLoginRequest: {
        type: "object",
        properties: { pin: { type: "string", pattern: "^\\d{4}$" } },
        required: ["pin"],
      },
      PinInput: {
        type: "object",
        properties: {
          pin: {
            type: "string",
            pattern: "^\\d{4}$",
            description: "Opcional: sin él se genera uno libre",
          },
        },
      },
      PinAssigned: {
        type: "object",
        properties: { pin: { type: "string", description: "Se muestra solo esta vez" } },
        required: ["pin"],
      },
      DeviceStatus: {
        type: "object",
        properties: {
          authorized: { type: "boolean" },
          name: { type: "string", nullable: true },
        },
        required: ["authorized", "name"],
      },
      Device: {
        type: "object",
        properties: {
          deviceId: { type: "integer" },
          name: { type: "string", maxLength: 60 },
          active: { type: "boolean" },
          createdBy: { type: "integer", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          lastSeenAt: { type: "string", format: "date-time", nullable: true },
        },
        required: ["deviceId", "name", "active", "createdAt", "lastSeenAt"],
      },
      DeviceInput: {
        type: "object",
        properties: { name: { type: "string", minLength: 1, maxLength: 60 } },
        required: ["name"],
      },
      DeviceUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 60 },
          active: { type: "boolean" },
        },
      },
      UserType: {
        type: "object",
        properties: {
          userTypeId: { type: "integer" },
          name: { type: "string", maxLength: 50 },
          permissionLevel: { type: "integer", minimum: 0, maximum: 10 },
          role: ref("Role"),
        },
        required: ["userTypeId", "name", "permissionLevel", "role"],
      },
      UserTypeInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
          permissionLevel: { type: "integer", minimum: 0, maximum: 10 },
          role: { allOf: [ref("Role")], description: "Por defecto: mesero" },
        },
        required: ["name", "permissionLevel"],
      },
      UserTypeUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
          permissionLevel: { type: "integer", minimum: 0, maximum: 10 },
          role: ref("Role"),
        },
      },
      User: {
        type: "object",
        description: "Nunca incluye la contraseña",
        properties: {
          userId: { type: "integer" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          userTypeId: { type: "integer" },
          active: { type: "boolean" },
          hasPin: { type: "boolean", description: "Solo en el listado: si tiene PIN asignado" },
          userType: ref("UserType"),
        },
        required: ["userId", "username", "email", "userTypeId", "active"],
      },
      CurrentUser: {
        allOf: [
          ref("User"),
          {
            type: "object",
            properties: { role: ref("Role") },
            required: ["role"],
          },
        ],
      },
      UserInput: {
        type: "object",
        properties: {
          username: { type: "string", minLength: 3, maxLength: 50 },
          password: { type: "string", minLength: 6, maxLength: 100 },
          email: { type: "string", format: "email" },
          typeId: integerish(),
        },
        required: ["username", "password", "email", "typeId"],
      },
      UserUpdate: {
        type: "object",
        properties: {
          username: { type: "string", minLength: 3, maxLength: 50 },
          password: { type: "string", minLength: 6, maxLength: 100 },
          email: { type: "string", format: "email" },
          typeId: integerish(),
          active: { type: "boolean", description: "false desactiva, true reactiva" },
        },
      },

      // ---------- Catálogo ----------
      ProductType: {
        type: "object",
        properties: {
          productTypeId: { type: "integer" },
          name: { type: "string" },
        },
        required: ["productTypeId", "name"],
      },
      ProductTypeInput: {
        type: "object",
        properties: { name: { type: "string", minLength: 1, maxLength: 50 } },
        required: ["name"],
      },
      ProductTypeUpdate: {
        type: "object",
        properties: { name: { type: "string", minLength: 1, maxLength: 50 } },
      },
      Product: {
        type: "object",
        properties: {
          productId: { type: "integer" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          cost: { type: "number" },
          productTypeId: { type: "integer", nullable: true },
          active: { type: "boolean" },
        },
        required: [
          "productId",
          "name",
          "description",
          "price",
          "cost",
          "productTypeId",
          "active",
        ],
      },
      ProductInput: {
        type: "object",
        description: "price debe ser mayor que cost",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
          description: { type: "string", minLength: 1, maxLength: 100 },
          price: numeric({ exclusiveMinimum: true, minimum: 0 }),
          cost: numeric({ exclusiveMinimum: true, minimum: 0 }),
          productTypeId: integerish(),
        },
        required: ["name", "description", "price", "cost", "productTypeId"],
      },
      ProductUpdate: {
        type: "object",
        description: "El precio resultante debe ser mayor al costo resultante",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
          description: { type: "string", minLength: 1, maxLength: 100 },
          price: numeric({ exclusiveMinimum: true, minimum: 0 }),
          cost: numeric({ exclusiveMinimum: true, minimum: 0 }),
          productTypeId: integerish(),
          active: { type: "boolean" },
        },
      },

      // ---------- Cuentas ----------
      BillStatus: {
        type: "string",
        enum: ["open", "closed", "draft", "finished", "void", "pending_payment"],
        description:
          "draft = orden en edición, open = cuenta activa, pending_payment = cerrada por el mesero y esperando cobro, closed = cobrada, finished = para llevar entregada, void = anulada por un admin",
      },
      PaymentMethod: {
        type: "string",
        enum: ["cash", "card"],
        description: "cash = efectivo, card = tarjeta",
      },
      OrderType: {
        type: "string",
        enum: ["dine_in", "takeaway"],
        description: "dine_in requiere tableId; takeaway no lleva mesa",
      },
      Bill: {
        type: "object",
        properties: {
          billId: { type: "integer" },
          waiterId: {
            type: "integer",
            description: "Usuario que abrió la cuenta (del token)",
          },
          cashRegisterId: {
            type: "integer",
            nullable: true,
            description: "Caja donde se cobró",
          },
          tableId: { type: "string", nullable: true },
          orderType: ref("OrderType"),
          customer: { type: "string" },
          date: { type: "string", format: "date-time" },
          total: {
            type: "number",
            description: "Calculado desde los detalles",
          },
          status: ref("BillStatus"),
          paymentMethod: {
            allOf: [ref("PaymentMethod")],
            nullable: true,
            description: "Cómo se cobró; null mientras no esté cobrada",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          waiter: ref("User"),
          table: { type: "object", allOf: [ref("Table")], nullable: true },
          cashRegister: {
            type: "object",
            allOf: [ref("CashRegister")],
            nullable: true,
          },
        },
        required: [
          "billId",
          "waiterId",
          "cashRegisterId",
          "tableId",
          "orderType",
          "customer",
          "date",
          "total",
          "status",
        ],
      },
      BillInput: {
        type: "object",
        description:
          "Sin orderType: con tableId = dine_in, sin tableId = takeaway. El mesero se toma del token y el total inicia en 0.",
        properties: {
          customer: { type: "string", minLength: 1, maxLength: 100 },
          tableId: { type: "string", minLength: 1, maxLength: 10 },
          orderType: ref("OrderType"),
          status: {
            type: "string",
            enum: ["open", "draft"],
            description: "Por defecto: open. Una cuenta no puede nacer cobrada",
          },
          date: {
            type: "string",
            format: "date-time",
            description: "Por defecto: ahora",
          },
        },
        required: ["customer"],
      },
      BillUpdate: {
        type: "object",
        additionalProperties: false,
        description:
          "Transiciones: open/draft → pending_payment (cerrar; requiere productos), pending_payment → open (reabrir), open/draft/pending_payment → closed (cobrar), closed → finished (entregar; solo para llevar). Cobrar y fijar cashRegisterId/paymentMethod es solo de cajero y admin (403 para el mesero) y exige ambos. Cambiar tableId mueve la cuenta de mesa.",
        properties: {
          customer: { type: "string", minLength: 1, maxLength: 100 },
          tableId: { type: "string", minLength: 1, maxLength: 10 },
          status: ref("BillStatus"),
          cashRegisterId: integerish(),
          paymentMethod: ref("PaymentMethod"),
          date: { type: "string", format: "date-time" },
        },
      },
      CloseTableBillsInput: {
        type: "object",
        properties: { cashRegisterId: integerish(), paymentMethod: ref("PaymentMethod") },
        required: ["cashRegisterId", "paymentMethod"],
      },
      CloseBillsResult: {
        type: "object",
        properties: { updated: { type: "integer", minimum: 0 } },
        required: ["updated"],
      },

      // ---------- Detalles de cuenta ----------
      BillDetail: {
        type: "object",
        properties: {
          billDetailId: { type: "integer" },
          billId: { type: "integer" },
          productId: { type: "integer" },
          quantity: { type: "integer", minimum: 1 },
          unitPrice: {
            type: "number",
            description: "Precio al momento de la venta",
          },
          subTotal: { type: "number" },
          product: ref("Product"),
        },
        required: [
          "billDetailId",
          "billId",
          "productId",
          "quantity",
          "unitPrice",
          "subTotal",
        ],
      },
      BillDetailLine: {
        type: "object",
        properties: {
          billDetailId: { type: "integer" },
          productId: { type: "integer" },
          name: { type: "string" },
          quantity: { type: "integer", minimum: 1 },
          price: { type: "number", description: "Precio unitario de venta" },
          subTotal: { type: "number" },
        },
        required: [
          "billDetailId",
          "productId",
          "name",
          "quantity",
          "price",
          "subTotal",
        ],
      },
      BillDetailItemInput: {
        type: "object",
        properties: {
          productId: { type: "integer", minimum: 1 },
          quantity: { type: "integer", minimum: 1, maximum: 999 },
        },
        required: ["productId", "quantity"],
      },
      BillDetailsInput: {
        type: "object",
        description:
          "Agrega productos. Si el producto ya está en la cuenta suma la cantidad. Precio y subtotal los calcula el servidor.",
        properties: {
          billId: { type: "integer", minimum: 1 },
          billDetails: {
            type: "array",
            minItems: 1,
            items: ref("BillDetailItemInput"),
          },
        },
        required: ["billId", "billDetails"],
      },
      BillDetailUpdate: {
        type: "object",
        properties: { quantity: { type: "integer", minimum: 1, maximum: 999 } },
        required: ["quantity"],
      },

      // ---------- Mesas y cajas ----------
      TableStatus: {
        type: "string",
        enum: ["disponible", "ocupada", "reservada"],
      },
      BoardSummary: {
        type: "object",
        properties: { bills: { type: "integer" }, total: { type: "number" } },
        required: ["bills", "total"],
      },
      BoardTable: {
        type: "object",
        properties: {
          tableId: { type: "string" },
          zone: { type: "string" },
          status: ref("TableStatus"),
          attendedBy: {
            type: "array",
            description: "Meseros con cuentas activas en la mesa (sin montos)",
            items: {
              type: "object",
              properties: { waiterId: { type: "integer" }, username: { type: "string" } },
              required: ["waiterId", "username"],
            },
          },
          mine: { allOf: [ref("BoardSummary")], description: "Cuentas activas del usuario" },
          all: { allOf: [ref("BoardSummary")], description: "Todas las cuentas activas: solo cajero y admin" },
        },
        required: ["tableId", "zone", "status", "attendedBy", "mine"],
      },
      Table: {
        type: "object",
        properties: {
          tableId: { type: "string", maxLength: 10 },
          zone: { type: "string", maxLength: 50 },
          status: ref("TableStatus"),
          bills: { type: "array", items: { type: "object" } },
        },
        required: ["tableId", "zone", "status"],
      },
      TableInput: {
        type: "object",
        properties: {
          tableId: {
            type: "string",
            minLength: 1,
            maxLength: 10,
            pattern: "^[A-Z0-9]+$",
          },
          zone: { type: "string", minLength: 1, maxLength: 50 },
          status: {
            allOf: [ref("TableStatus")],
            description: "Por defecto: disponible",
          },
        },
        required: ["tableId", "zone"],
      },
      TableUpdate: {
        type: "object",
        properties: {
          zone: { type: "string", minLength: 1, maxLength: 50 },
          status: ref("TableStatus"),
        },
      },
      TableStatusUpdate: {
        type: "object",
        properties: { status: ref("TableStatus") },
        required: ["status"],
      },
      CashRegister: {
        type: "object",
        properties: {
          cashRegisterId: { type: "integer" },
          number: { type: "string", maxLength: 20 },
          active: { type: "boolean" },
        },
        required: ["cashRegisterId", "number", "active"],
      },
      CashRegisterInput: {
        type: "object",
        properties: {
          number: {
            oneOf: [
              { type: "string", minLength: 1, maxLength: 20 },
              { type: "number" },
            ],
          },
          active: { type: "boolean", default: true },
        },
        required: ["number"],
      },
      CashRegisterUpdate: {
        type: "object",
        properties: {
          number: {
            oneOf: [
              { type: "string", minLength: 1, maxLength: 20 },
              { type: "number" },
            ],
          },
          active: { type: "boolean" },
        },
      },

      // ---------- Inventario ----------
      UnitMeasurement: {
        type: "string",
        enum: ["g", "kg", "l", "ml", "oz", "lb", "unit", "tbsp", "tsp", "cup", "piece"],
      },
      ConsumableType: {
        type: "object",
        properties: {
          consumableTypeId: { type: "integer" },
          name: { type: "string" },
        },
        required: ["consumableTypeId", "name"],
      },
      ConsumableTypeInput: {
        type: "object",
        properties: { name: { type: "string", minLength: 1, maxLength: 255 } },
        required: ["name"],
      },
      ConsumableTypeUpdate: {
        type: "object",
        properties: { name: { type: "string", minLength: 1, maxLength: 255 } },
        required: ["name"],
      },
      Consumable: {
        type: "object",
        properties: {
          consumableId: { type: "integer" },
          supplierId: { type: "integer" },
          name: { type: "string" },
          consumableTypeId: { type: "integer" },
          quantity: { type: "number" },
          unitMeasurement: ref("UnitMeasurement"),
          cost: { type: "number" },
          minStock: { type: "number" },
          active: { type: "boolean" },
          consumableType: ref("ConsumableType"),
          supplier: ref("Supplier"),
        },
        required: [
          "consumableId",
          "supplierId",
          "name",
          "consumableTypeId",
          "quantity",
          "unitMeasurement",
          "cost",
          "minStock",
          "active",
        ],
      },
      ConsumableListItem: {
        allOf: [
          ref("Consumable"),
          {
            type: "object",
            properties: {
              lowStock: {
                type: "boolean",
                description: "quantity <= minStock",
              },
            },
            required: ["lowStock"],
          },
        ],
      },
      ConsumableInput: {
        type: "object",
        properties: {
          supplierId: integerish(),
          name: { type: "string", minLength: 1, maxLength: 255 },
          consumableTypeId: integerish({ minimum: 0 }),
          quantity: numeric({ minimum: 0 }),
          unitMeasurement: ref("UnitMeasurement"),
          cost: numeric({ minimum: 0 }),
          minStock: numeric({ minimum: 0, default: 0 }),
        },
        required: [
          "supplierId",
          "name",
          "consumableTypeId",
          "quantity",
          "unitMeasurement",
          "cost",
        ],
      },
      ConsumableUpdate: {
        type: "object",
        properties: {
          supplierId: integerish(),
          name: { type: "string", minLength: 1, maxLength: 255 },
          consumableTypeId: integerish({ minimum: 0 }),
          quantity: numeric({ minimum: 0 }),
          unitMeasurement: ref("UnitMeasurement"),
          cost: numeric({ minimum: 0 }),
          minStock: numeric({ minimum: 0 }),
          active: { type: "boolean" },
        },
      },
      Ingredient: {
        type: "object",
        properties: {
          ingredientId: { type: "integer" },
          name: { type: "string" },
          quantity: {
            oneOf: [{ type: "number" }, { type: "string" }],
            description: "Columna decimal; Postgres la devuelve como string",
          },
          productId: { type: "integer" },
          consumableId: { type: "integer" },
          product: ref("Product"),
          consumable: ref("Consumable"),
        },
        required: ["ingredientId", "name", "quantity", "productId", "consumableId"],
      },
      IngredientInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          quantity: numeric({ exclusiveMinimum: true, minimum: 0 }),
          productId: integerish(),
          consumableId: integerish(),
        },
        required: ["name", "quantity", "productId", "consumableId"],
      },
      IngredientUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          quantity: numeric({ exclusiveMinimum: true, minimum: 0 }),
          productId: integerish(),
          consumableId: integerish(),
        },
      },
      Supplier: {
        type: "object",
        properties: {
          supplierId: { type: "integer" },
          name: { type: "string", maxLength: 100 },
          phone: { type: "string", maxLength: 20 },
          email: { type: "string", format: "email" },
          active: { type: "boolean" },
        },
        required: ["supplierId", "name", "phone", "email", "active"],
      },
      SupplierInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          phone: {
            type: "string",
            pattern: "^(\\+503)?[2-9]\\d{3}-?\\d{4}$",
            example: "+50322223333",
          },
          email: { type: "string", format: "email" },
          active: { type: "boolean", default: true },
        },
        required: ["name", "phone", "email"],
      },
      SupplierUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          phone: { type: "string", pattern: "^(\\+503)?[2-9]\\d{3}-?\\d{4}$" },
          email: { type: "string", format: "email" },
          active: { type: "boolean" },
        },
      },

      // ---------- Compras ----------
      PurchaseDetail: {
        type: "object",
        properties: {
          purchaseDetailId: { type: "integer" },
          purchaseId: { type: "integer" },
          consumableId: { type: "integer" },
          quantity: { type: "number" },
          unitCost: { type: "number" },
          subTotal: { type: "number" },
          consumable: ref("Consumable"),
        },
        required: [
          "purchaseDetailId",
          "purchaseId",
          "consumableId",
          "quantity",
          "unitCost",
          "subTotal",
        ],
      },
      PurchaseDetailInput: {
        type: "object",
        properties: {
          consumableId: integerish(),
          quantity: numeric({ exclusiveMinimum: true, minimum: 0 }),
          unitCost: numeric({ exclusiveMinimum: true, minimum: 0, description: "Costo por unidad de medida; hasta 4 decimales" }),
        },
        required: ["consumableId", "quantity", "unitCost"],
      },
      Purchase: {
        type: "object",
        properties: {
          purchaseId: { type: "integer" },
          date: { type: "string", format: "date-time" },
          cashRegisterId: { type: "integer", nullable: true },
          supplierId: { type: "integer" },
          total: { type: "number" },
          supplier: ref("Supplier"),
          cashRegister: {
            type: "object",
            allOf: [ref("CashRegister")],
            nullable: true,
          },
          details: {
            type: "array",
            description: "Incluido en detalle, creación y actualización",
            items: ref("PurchaseDetail"),
          },
        },
        required: ["purchaseId", "date", "cashRegisterId", "supplierId", "total"],
      },
      PurchaseInput: {
        type: "object",
        description:
          "Enviar `details` (suma stock y calcula total) o `total` (gasto sin inventario), no ambos.",
        properties: {
          date: { type: "string", format: "date-time" },
          supplierId: integerish(),
          cashRegisterId: integerish(),
          details: {
            type: "array",
            minItems: 1,
            items: ref("PurchaseDetailInput"),
          },
          total: numeric({ exclusiveMinimum: true, minimum: 0 }),
        },
        required: ["date", "supplierId"],
      },
      PurchaseUpdate: {
        type: "object",
        additionalProperties: false,
        description: "total solo se permite en compras sin detalles",
        properties: {
          date: { type: "string", format: "date-time" },
          cashRegisterId: integerish(),
          supplierId: integerish(),
          total: numeric({ exclusiveMinimum: true, minimum: 0 }),
        },
      },

      // ---------- Reportes ----------
      SalesReport: {
        type: "object",
        properties: {
          range: {
            type: "object",
            properties: {
              from: { type: "string", format: "date-time" },
              to: { type: "string", format: "date-time" },
            },
            required: ["from", "to"],
          },
          summary: {
            type: "object",
            properties: {
              totalSales: { type: "number" },
              billsCount: { type: "integer" },
              averageTicket: { type: "number" },
              costOfGoods: { type: "number" },
              grossProfit: { type: "number" },
              purchasesTotal: { type: "number" },
            },
            required: [
              "totalSales",
              "billsCount",
              "averageTicket",
              "costOfGoods",
              "grossProfit",
              "purchasesTotal",
            ],
          },
          byDay: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date", example: "2026-03-01" },
                total: { type: "number" },
                bills: { type: "integer" },
              },
              required: ["date", "total", "bills"],
            },
          },
          topProducts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "integer" },
                name: { type: "string" },
                quantity: { type: "integer" },
                total: { type: "number" },
              },
              required: ["productId", "name", "quantity", "total"],
            },
          },
          byProductType: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productTypeId: { type: "integer", nullable: true },
                name: { type: "string" },
                quantity: { type: "integer" },
                total: { type: "number" },
              },
              required: ["productTypeId", "name", "quantity", "total"],
            },
          },
          byWaiter: {
            type: "array",
            items: {
              type: "object",
              properties: {
                waiterId: { type: "integer" },
                username: { type: "string" },
                bills: { type: "integer" },
                total: { type: "number" },
              },
              required: ["waiterId", "username", "bills", "total"],
            },
          },
          byOrderType: {
            type: "array",
            items: {
              type: "object",
              properties: {
                orderType: ref("OrderType"),
                bills: { type: "integer" },
                total: { type: "number" },
              },
              required: ["orderType", "bills", "total"],
            },
          },
          byPaymentMethod: {
            type: "array",
            description: "Para cuadrar caja; paymentMethod null = ventas sin método registrado",
            items: {
              type: "object",
              properties: {
                paymentMethod: { allOf: [ref("PaymentMethod")], nullable: true },
                bills: { type: "integer" },
                total: { type: "number" },
              },
              required: ["paymentMethod", "bills", "total"],
            },
          },
        },
        required: [
          "range",
          "summary",
          "byDay",
          "topProducts",
          "byProductType",
          "byWaiter",
          "byOrderType",
          "byPaymentMethod",
        ],
      },
    },
  },
  paths: {
    // ================= Auth =================
    "/users/login": {
      post: op({
        id: "login",
        tag: "Auth",
        summary: "Iniciar sesión",
        description:
          "Crea una sesión de 12 h en la cookie httpOnly `auth_token`. Si el equipo está autorizado, la sesión queda asociada a él.",
        roles: "public",
        body: "LoginRequest",
        ok: { description: "Inicio de sesión exitoso", schema: ref("LoginData") },
        errors: {
          400: "Faltan credenciales",
          401: "Usuario o contraseña incorrectos, o usuario inactivo",
        },
      }),
    },
    "/users/logout": {
      post: op({
        id: "logout",
        tag: "Auth",
        summary: "Cerrar sesión (revoca la sesión y borra la cookie)",
        roles: "public",
        ok: { description: "Sesión cerrada" },
      }),
    },
    "/auth/pin": {
      post: op({
        id: "pinLogin",
        tag: "Auth",
        summary: "Entrar con PIN (meseros y cajeros)",
        description:
          "Solo desde un dispositivo autorizado (cookie `device_token`). Sesión de 30 min. Nunca bloquea por fallos; ante ráfagas desde el mismo dispositivo las respuestas fallidas se demoran hasta 3 s.",
        roles: "public",
        body: "PinLoginRequest",
        ok: { description: "Inicio de sesión exitoso", schema: ref("LoginData") },
        errors: {
          400: "PIN con formato inválido",
          401: "PIN incorrecto",
          403: "Este dispositivo no está autorizado para entrar con PIN",
        },
      }),
    },
    "/auth/device": {
      get: op({
        id: "getDeviceStatus",
        tag: "Auth",
        summary: "¿Este equipo está autorizado para PIN?",
        roles: "public",
        ok: { description: "Estado del dispositivo", schema: ref("DeviceStatus") },
      }),
      delete: op({
        id: "forgetThisDevice",
        tag: "Auth",
        summary: "Olvidar este equipo (borra su cookie de dispositivo)",
        roles: "public",
        ok: { description: "Dispositivo olvidado" },
      }),
    },

    // ================= Devices =================
    "/devices": {
      get: op({
        id: "listDevices",
        tag: "Devices",
        summary: "Listar dispositivos autorizados",
        roles: "admin",
        ok: { description: "Dispositivos", schema: arrayOf("Device") },
      }),
      post: op({
        id: "registerDevice",
        tag: "Devices",
        summary: "Autorizar el equipo actual para PIN",
        description:
          "Deja la cookie httpOnly `device_token` en el navegador que hace la petición; en la BD solo queda su hash.",
        roles: "admin",
        body: "DeviceInput",
        ok: { code: 201, description: "Dispositivo autorizado", schema: ref("Device") },
        errors: { 400: "Nombre inválido" },
      }),
    },
    "/devices/{id}": {
      put: op({
        id: "updateDevice",
        tag: "Devices",
        summary: "Renombrar o activar/desactivar un dispositivo",
        roles: "admin",
        parameters: [idParam("dispositivo")],
        body: "DeviceUpdate",
        ok: { description: "Dispositivo actualizado", schema: ref("Device") },
        errors: { 400: "Datos inválidos", 404: "Dispositivo no encontrado" },
      }),
      delete: op({
        id: "revokeDevice",
        tag: "Devices",
        summary: "Revocar un dispositivo (corta sus sesiones)",
        roles: "admin",
        parameters: [idParam("dispositivo")],
        ok: { description: "Dispositivo revocado", schema: ref("Device") },
        errors: { 404: "Dispositivo no encontrado" },
      }),
    },
    "/users/{id}/pin": {
      put: op({
        id: "setUserPin",
        tag: "Users",
        summary: "Asignar o generar el PIN de un mesero/cajero",
        description: "Devuelve el PIN una sola vez y cierra las sesiones del usuario.",
        roles: "admin",
        parameters: [idParam("usuario")],
        body: "PinInput",
        ok: { description: "PIN asignado", schema: ref("PinAssigned") },
        errors: {
          400: "Formato inválido o el usuario no es mesero/cajero",
          404: "Usuario no encontrado",
          409: "Ese PIN ya está en uso",
        },
      }),
      delete: op({
        id: "clearUserPin",
        tag: "Users",
        summary: "Quitar el PIN de un usuario",
        roles: "admin",
        parameters: [idParam("usuario")],
        ok: { description: "PIN eliminado" },
        errors: { 404: "Usuario no encontrado" },
      }),
    },

    // ================= Users =================
    "/users/me": {
      get: op({
        id: "getCurrentUser",
        tag: "Users",
        summary: "Usuario autenticado actual con su rol",
        roles: "any",
        ok: { description: "Usuario autenticado", schema: ref("CurrentUser") },
        errors: { 401: "Token inválido o usuario inexistente" },
      }),
    },
    "/users": {
      get: op({
        id: "listUsers",
        tag: "Users",
        summary: "Listar usuarios",
        roles: "admin",
        ok: { description: "Usuarios obtenidos correctamente", schema: arrayOf("User") },
      }),
      post: op({
        id: "createUser",
        tag: "Users",
        summary: "Crear usuario",
        roles: "admin",
        body: "UserInput",
        ok: { code: 201, description: "Usuario creado correctamente", schema: ref("User") },
        errors: { 400: "Datos inválidos o rol inexistente", 409: "El usuario ya existe" },
      }),
    },
    "/users/type/{typeId}": {
      get: op({
        id: "listUsersByType",
        tag: "Users",
        summary: "Listar usuarios por tipo",
        roles: "admin",
        parameters: [intPathParam("typeId", "ID del tipo de usuario")],
        ok: {
          description: "Usuarios por tipo obtenidos correctamente",
          schema: arrayOf("User"),
        },
      }),
    },
    "/users/{id}": {
      get: op({
        id: "getUser",
        tag: "Users",
        summary: "Obtener usuario",
        roles: "admin",
        parameters: [idParam("usuario")],
        ok: { description: "Usuario obtenido correctamente", schema: ref("User") },
        errors: { 400: "ID inválido", 404: "Usuario no encontrado" },
      }),
      put: op({
        id: "updateUser",
        tag: "Users",
        summary: "Actualizar usuario",
        roles: "admin",
        parameters: [idParam("usuario")],
        body: "UserUpdate",
        ok: { description: "Usuario actualizado correctamente", schema: ref("User") },
        errors: {
          400: "Datos inválidos o rol inexistente",
          404: "Usuario no encontrado",
          409: "Usuario repetido, o el admin intenta desactivarse o quitarse el rol",
        },
      }),
      delete: op({
        id: "deleteUser",
        tag: "Users",
        summary: "Desactivar usuario (baja lógica)",
        roles: "admin",
        parameters: [idParam("usuario")],
        ok: { description: "Usuario eliminado correctamente", schema: ref("DeleteResult") },
        errors: {
          400: "ID inválido",
          404: "Usuario no encontrado",
          409: "No puedes desactivar tu propio usuario",
        },
      }),
    },

    // ================= UserTypes =================
    "/user-types": {
      get: op({
        id: "listUserTypes",
        tag: "UserTypes",
        summary: "Listar tipos de usuario",
        roles: "admin",
        ok: { description: "Tipos de usuario obtenidos", schema: arrayOf("UserType") },
      }),
      post: op({
        id: "createUserType",
        tag: "UserTypes",
        summary: "Crear tipo de usuario",
        roles: "admin",
        body: "UserTypeInput",
        ok: { code: 201, description: "Tipo de usuario creado", schema: ref("UserType") },
        errors: { 400: "Datos inválidos" },
      }),
    },
    "/user-types/{id}": {
      get: op({
        id: "getUserType",
        tag: "UserTypes",
        summary: "Obtener tipo de usuario",
        roles: "admin",
        parameters: [idParam("tipo de usuario")],
        ok: { description: "Tipo de usuario obtenido", schema: ref("UserType") },
        errors: { 400: "ID inválido", 404: "Tipo de usuario no encontrado" },
      }),
      put: op({
        id: "updateUserType",
        tag: "UserTypes",
        summary: "Actualizar tipo de usuario",
        roles: "admin",
        parameters: [idParam("tipo de usuario")],
        body: "UserTypeUpdate",
        ok: { description: "Tipo de usuario actualizado", schema: ref("UserType") },
        errors: {
          400: "Datos inválidos",
          404: "Tipo de usuario no encontrado",
          409: "Quitar el rol admin al tipo del propio usuario",
        },
      }),
      delete: op({
        id: "deleteUserType",
        tag: "UserTypes",
        summary: "Eliminar tipo de usuario",
        roles: "admin",
        parameters: [idParam("tipo de usuario")],
        ok: { description: "Tipo de usuario eliminado", schema: ref("DeleteResult") },
        errors: {
          400: "ID inválido",
          404: "Tipo de usuario no encontrado",
          409: "El rol tiene usuarios asignados",
        },
      }),
    },

    // ================= Products =================
    "/products": {
      get: op({
        id: "listProducts",
        tag: "Products",
        summary: "Listar productos",
        roles: "any",
        ok: { description: "Productos obtenidos correctamente", schema: arrayOf("Product") },
      }),
      post: op({
        id: "createProduct",
        tag: "Products",
        summary: "Crear producto",
        roles: "admin",
        body: "ProductInput",
        ok: { code: 201, description: "Producto creado", schema: ref("Product") },
        errors: { 400: "Datos inválidos (incluye precio <= costo)" },
      }),
    },
    "/products/active": {
      get: op({
        id: "listActiveProducts",
        tag: "Products",
        summary: "Listar productos activos (menú)",
        roles: "any",
        ok: { description: "Productos activos obtenidos", schema: arrayOf("Product") },
      }),
    },
    "/products/{id}": {
      get: op({
        id: "getProduct",
        tag: "Products",
        summary: "Obtener producto",
        roles: "any",
        parameters: [idParam("producto")],
        ok: { description: "Producto obtenido", schema: ref("Product") },
        errors: { 400: "ID inválido", 404: "Producto no encontrado" },
      }),
      put: op({
        id: "updateProduct",
        tag: "Products",
        summary: "Actualizar producto",
        roles: "admin",
        parameters: [idParam("producto")],
        body: "ProductUpdate",
        ok: { description: "Producto actualizado", schema: ref("Product") },
        errors: {
          400: "Datos inválidos o precio <= costo",
          404: "Producto no encontrado",
        },
      }),
      delete: op({
        id: "deleteProduct",
        tag: "Products",
        summary: "Desactivar producto (baja lógica)",
        roles: "admin",
        parameters: [idParam("producto")],
        ok: { description: "Producto eliminado", schema: ref("DeleteResult") },
        errors: { 400: "ID inválido", 404: "Producto no encontrado" },
      }),
    },

    // ================= ProductTypes =================
    "/product-type": {
      get: op({
        id: "listProductTypes",
        tag: "ProductTypes",
        summary: "Listar categorías de producto",
        roles: "any",
        ok: { description: "Tipos de producto obtenidos", schema: arrayOf("ProductType") },
      }),
      post: op({
        id: "createProductType",
        tag: "ProductTypes",
        summary: "Crear categoría de producto",
        roles: "admin",
        body: "ProductTypeInput",
        ok: { code: 201, description: "Tipo de producto creado", schema: ref("ProductType") },
        errors: { 400: "Datos inválidos" },
      }),
    },
    "/product-type/{id}": {
      get: op({
        id: "getProductType",
        tag: "ProductTypes",
        summary: "Obtener categoría de producto",
        roles: "any",
        parameters: [idParam("tipo de producto")],
        ok: { description: "Tipo de producto obtenido", schema: ref("ProductType") },
        errors: { 400: "ID inválido", 404: "Tipo de producto no encontrado" },
      }),
      put: op({
        id: "updateProductType",
        tag: "ProductTypes",
        summary: "Actualizar categoría de producto",
        roles: "admin",
        parameters: [idParam("tipo de producto")],
        body: "ProductTypeUpdate",
        ok: { description: "Tipo de producto actualizado", schema: ref("ProductType") },
        errors: { 400: "Datos inválidos", 404: "Tipo de producto no encontrado" },
      }),
      delete: op({
        id: "deleteProductType",
        tag: "ProductTypes",
        summary: "Eliminar categoría de producto",
        roles: "admin",
        parameters: [idParam("tipo de producto")],
        ok: { description: "Tipo de producto eliminado", schema: ref("DeleteResult") },
        errors: {
          400: "ID inválido",
          404: "Tipo de producto no encontrado",
          409: "La categoría tiene productos asociados",
        },
      }),
    },

    // ================= Bills =================
    "/bills": {
      get: op({
        id: "listBills",
        tag: "Bills",
        summary: "Listar cuentas con filtros",
        description:
          "Con `page` responde paginado e incluye `meta` {page, limit, total}. `mine=true` filtra por el usuario del token.",
        roles: "any",
        parameters: [
          queryParam("status", "Estado", ref("BillStatus")),
          queryParam("orderType", "Tipo de orden", ref("OrderType")),
          queryParam("tableId", "Mesa", { type: "string", maxLength: 10 }),
          queryParam("waiterId", "Mesero", { type: "integer", minimum: 1 }),
          queryParam("mine", "Solo las del usuario autenticado", {
            type: "string",
            enum: ["true", "false"],
          }),
          queryParam("from", "Desde (fecha ISO)", { type: "string", format: "date-time" }),
          queryParam("to", "Hasta (fecha ISO)", { type: "string", format: "date-time" }),
          queryParam("page", "Página (activa paginación)", { type: "integer", minimum: 1 }),
          queryParam("limit", "Tamaño de página (por defecto 20)", {
            type: "integer",
            minimum: 1,
            maximum: 200,
          }),
        ],
        ok: {
          description: "Facturas obtenidas correctamente",
          schema: arrayOf("Bill"),
          extra: { meta: ref("PaginationMeta") },
        },
        errors: { 400: "Filtros inválidos" },
      }),
      post: op({
        id: "createBill",
        tag: "Bills",
        summary: "Abrir cuenta (en mesa o para llevar)",
        description:
          "El mesero se toma del token. Una cuenta en mesa marca la mesa como ocupada.",
        roles: "staff",
        body: "BillInput",
        ok: { code: 201, description: "Factura creada correctamente", schema: ref("Bill") },
        errors: {
          400: "Datos inválidos, mesa inexistente o caja inactiva",
        },
      }),
    },
    "/bills/date-range": {
      get: op({
        id: "listBillsByDateRange",
        tag: "Bills",
        summary: "Listar cuentas por rango de fechas",
        roles: "any",
        parameters: [
          queryParam("startDate", "Fecha inicial (ISO)", { type: "string" }, true),
          queryParam("endDate", "Fecha final (ISO)", { type: "string" }, true),
        ],
        ok: { description: "Facturas obtenidas por rango", schema: arrayOf("Bill") },
        errors: { 400: "startDate y endDate son requeridos" },
      }),
    },
    "/bills/customer/{customer}": {
      get: op({
        id: "listBillsByCustomer",
        tag: "Bills",
        summary: "Listar cuentas por cliente",
        roles: "any",
        parameters: [strPathParam("customer", "Nombre del cliente")],
        ok: { description: "Facturas del cliente obtenidas", schema: arrayOf("Bill") },
      }),
    },
    "/bills/table/{tableId}": {
      get: op({
        id: "listBillsByTable",
        tag: "Bills",
        summary: "Listar cuentas de una mesa",
        roles: "any",
        parameters: [strPathParam("tableId", "ID de la mesa", { type: "string", maxLength: 10 })],
        ok: { description: "Facturas de la mesa obtenidas", schema: arrayOf("Bill") },
      }),
    },
    "/bills/table/{tableId}/close": {
      post: op({
        id: "closeTableBills",
        tag: "Bills",
        summary: "Cobrar todas las cuentas activas de la mesa",
        description:
          "Marca como closed las cuentas open/draft/pending_payment de la mesa con la caja y el método de pago indicados, y libera la mesa.",
        roles: "cashier",
        parameters: [strPathParam("tableId", "ID de la mesa", { type: "string", maxLength: 10 })],
        body: "CloseTableBillsInput",
        ok: { description: "Facturas cerradas", schema: ref("CloseBillsResult") },
        errors: { 400: "Datos inválidos o caja inexistente/inactiva" },
      }),
    },
    "/bills/{id}": {
      get: op({
        id: "getBill",
        tag: "Bills",
        summary: "Obtener cuenta",
        roles: "any",
        parameters: [idParam("factura")],
        ok: { description: "Factura obtenida correctamente", schema: ref("Bill") },
        errors: { 400: "ID inválido", 404: "Factura no encontrada" },
      }),
      put: op({
        id: "updateBill",
        tag: "Bills",
        summary: "Actualizar cuenta (estado, caja, mesa, cliente)",
        description:
          "El total no se edita: se calcula desde los detalles. Al cerrar la última cuenta activa de una mesa, la mesa queda disponible.",
        roles: "staff",
        parameters: [idParam("factura")],
        body: "BillUpdate",
        ok: { description: "Factura actualizada correctamente", schema: ref("Bill") },
        errors: {
          400: "Datos inválidos, cierre sin caja, mesa inexistente, caja inactiva o status void",
          404: "Factura no encontrada",
          409: "La factura está anulada",
        },
      }),
      delete: op({
        id: "deleteBill",
        tag: "Bills",
        summary: "Eliminar cuenta en curso",
        description:
          "Solo cuentas open/draft: borra la cuenta y devuelve el stock. Las cobradas se anulan con POST /bills/{id}/void.",
        roles: "admin",
        parameters: [idParam("factura")],
        ok: { description: "Factura eliminada correctamente", schema: ref("DeleteResult") },
        errors: { 400: "ID inválido", 404: "Factura no encontrada", 409: "La cuenta ya se cobró" },
      }),
    },
    "/bills/{id}/void": {
      post: op({
        id: "voidBill",
        tag: "Bills",
        summary: "Anular factura",
        description:
          "Pasa la factura a void conservando sus líneas; deja de contar como venta. Si estaba en curso devuelve el stock y libera la mesa.",
        roles: "admin",
        parameters: [idParam("factura")],
        ok: { description: "Factura anulada correctamente", schema: ref("Bill") },
        errors: { 400: "ID inválido", 404: "Factura no encontrada", 409: "Ya estaba anulada" },
      }),
    },

    // ================= BillDetails =================
    "/bill-details": {
      get: op({
        id: "listBillDetails",
        tag: "BillDetails",
        summary: "Listar todos los detalles",
        roles: "admin",
        ok: { description: "Detalles obtenidos", schema: arrayOf("BillDetail") },
      }),
      post: op({
        id: "createBillDetails",
        tag: "BillDetails",
        summary: "Agregar productos a una cuenta",
        description:
          "Suma cantidades si el producto ya está en la cuenta, descuenta stock según la receta y recalcula el total. Con stock insuficiente responde 400 con `type: \"stock_error\"`.",
        roles: "staff",
        body: "BillDetailsInput",
        ok: {
          code: 201,
          description: "Factura y detalles guardados correctamente",
          schema: arrayOf("BillDetail"),
        },
        errors: {
          400: "Datos inválidos, producto inexistente/inactivo o stock insuficiente (type=stock_error)",
          409: "La cuenta no está open/draft",
        },
      }),
    },
    "/bill-details/bill/{billId}": {
      get: op({
        id: "listBillDetailsByBill",
        tag: "BillDetails",
        summary: "Líneas de una cuenta",
        description: "Devuelve [] si la cuenta no tiene líneas.",
        roles: "any",
        parameters: [intPathParam("billId", "ID de la factura")],
        ok: { description: "Detalles obtenidos correctamente", schema: arrayOf("BillDetailLine") },
        errors: { 400: "ID de factura inválido" },
      }),
    },
    "/bill-details/{id}": {
      patch: op({
        id: "updateBillDetail",
        tag: "BillDetails",
        summary: "Cambiar cantidad de una línea",
        description: "Ajusta stock por la diferencia y recalcula el total.",
        roles: "staff",
        parameters: [idParam("detalle")],
        body: "BillDetailUpdate",
        ok: { description: "Detalle actualizado correctamente", schema: ref("BillDetail") },
        errors: {
          400: "Datos inválidos o stock insuficiente (type=stock_error)",
          404: "Detalle no encontrado",
          409: "La cuenta no está open/draft",
        },
      }),
      delete: op({
        id: "deleteBillDetail",
        tag: "BillDetails",
        summary: "Quitar una línea",
        description: "Devuelve el stock y recalcula el total.",
        roles: "staff",
        parameters: [idParam("detalle")],
        ok: { code: 202, description: "Detalle eliminado correctamente" },
        errors: {
          400: "ID inválido",
          404: "Detalle no encontrado",
          409: "La cuenta no está open/draft",
        },
      }),
    },

    // ================= Tables =================
    "/tables/board": {
      get: op({
        id: "getTableBoard",
        tag: "Tables",
        summary: "Mapa de mesas para el panel de operación",
        description:
          "Cada mesa con quién la atiende y los montos permitidos: el mesero ve solo los de sus cuentas; cajero y admin reciben además `all`.",
        roles: "any",
        ok: { description: "Mapa de mesas", schema: arrayOf("BoardTable") },
      }),
    },
    "/tables": {
      get: op({
        id: "listTables",
        tag: "Tables",
        summary: "Listar mesas (incluye sus cuentas)",
        roles: "any",
        ok: { description: "Mesas obtenidas correctamente", schema: arrayOf("Table") },
      }),
      post: op({
        id: "createTable",
        tag: "Tables",
        summary: "Crear mesa",
        roles: "admin",
        body: "TableInput",
        ok: { code: 201, description: "Mesa creada", schema: ref("Table") },
        errors: { 400: "Datos inválidos", 409: "La mesa ya existe" },
      }),
    },
    "/tables/available": {
      get: op({
        id: "listAvailableTables",
        tag: "Tables",
        summary: "Listar mesas disponibles",
        roles: "any",
        ok: { description: "Mesas disponibles", schema: arrayOf("Table") },
      }),
    },
    "/tables/zone/{zone}": {
      get: op({
        id: "listTablesByZone",
        tag: "Tables",
        summary: "Listar mesas por zona",
        roles: "any",
        parameters: [strPathParam("zone", "Zona")],
        ok: { description: "Mesas de la zona", schema: arrayOf("Table") },
      }),
    },
    "/tables/status/{status}": {
      get: op({
        id: "listTablesByStatus",
        tag: "Tables",
        summary: "Listar mesas por estado",
        roles: "any",
        parameters: [strPathParam("status", "Estado de la mesa", ref("TableStatus"))],
        ok: { description: "Mesas por estado", schema: arrayOf("Table") },
        errors: { 400: "Estado inválido" },
      }),
    },
    "/tables/{id}": {
      get: op({
        id: "getTable",
        tag: "Tables",
        summary: "Obtener mesa",
        roles: "any",
        parameters: [strPathParam("id", "ID de la mesa", { type: "string", maxLength: 10 })],
        ok: { description: "Mesa obtenida correctamente", schema: ref("Table") },
        errors: { 400: "ID inválido", 404: "Mesa no encontrada" },
      }),
      put: op({
        id: "updateTable",
        tag: "Tables",
        summary: "Actualizar mesa",
        roles: "admin",
        parameters: [strPathParam("id", "ID de la mesa", { type: "string", maxLength: 10 })],
        body: "TableUpdate",
        ok: { description: "Mesa actualizada", schema: ref("Table") },
        errors: { 400: "Datos inválidos", 404: "Mesa no encontrada" },
      }),
      delete: op({
        id: "deleteTable",
        tag: "Tables",
        summary: "Eliminar mesa",
        roles: "admin",
        parameters: [strPathParam("id", "ID de la mesa", { type: "string", maxLength: 10 })],
        ok: { description: "Mesa eliminada", schema: ref("DeleteResult") },
        errors: {
          400: "ID inválido",
          404: "Mesa no encontrada",
          409: "La mesa tiene facturas asociadas",
        },
      }),
    },
    "/tables/{id}/status": {
      patch: op({
        id: "updateTableStatus",
        tag: "Tables",
        summary: "Cambiar estado de la mesa",
        roles: "staff",
        parameters: [strPathParam("id", "ID de la mesa", { type: "string", maxLength: 10 })],
        body: "TableStatusUpdate",
        ok: { description: "Estado de mesa actualizado correctamente", schema: ref("Table") },
        errors: { 400: "Estado inválido", 404: "Mesa no encontrada" },
      }),
    },

    // ================= CashRegisters =================
    "/cash-registers": {
      get: op({
        id: "listCashRegisters",
        tag: "CashRegisters",
        summary: "Listar cajas",
        roles: "admin",
        ok: { description: "Cajas obtenidas", schema: arrayOf("CashRegister") },
      }),
      post: op({
        id: "createCashRegister",
        tag: "CashRegisters",
        summary: "Crear caja",
        roles: "admin",
        body: "CashRegisterInput",
        ok: { code: 201, description: "Caja creada", schema: ref("CashRegister") },
        errors: { 400: "Datos inválidos", 409: "Ya existe una caja con ese número" },
      }),
    },
    "/cash-registers/active": {
      get: op({
        id: "listActiveCashRegisters",
        tag: "CashRegisters",
        summary: "Listar cajas activas (para cobrar)",
        roles: "any",
        ok: { description: "Cajas activas", schema: arrayOf("CashRegister") },
      }),
    },
    "/cash-registers/number/{number}": {
      get: op({
        id: "getCashRegisterByNumber",
        tag: "CashRegisters",
        summary: "Obtener caja por número",
        roles: "any",
        parameters: [strPathParam("number", "Número de caja")],
        ok: { description: "Caja obtenida", schema: ref("CashRegister") },
        errors: {},
      }),
    },
    "/cash-registers/{id}": {
      get: op({
        id: "getCashRegister",
        tag: "CashRegisters",
        summary: "Obtener caja",
        roles: "any",
        parameters: [idParam("caja")],
        ok: { description: "Caja obtenida", schema: ref("CashRegister") },
        errors: { 400: "ID inválido", 404: "Caja no encontrada" },
      }),
      put: op({
        id: "updateCashRegister",
        tag: "CashRegisters",
        summary: "Actualizar caja",
        roles: "admin",
        parameters: [idParam("caja")],
        body: "CashRegisterUpdate",
        ok: { description: "Caja actualizada", schema: ref("CashRegister") },
        errors: {
          400: "Datos inválidos",
          404: "Caja no encontrada",
          409: "Ya existe una caja con ese número",
        },
      }),
      delete: op({
        id: "deleteCashRegister",
        tag: "CashRegisters",
        summary: "Desactivar caja (baja lógica)",
        roles: "admin",
        parameters: [idParam("caja")],
        ok: { description: "Caja desactivada", schema: ref("DeleteResult") },
        errors: { 400: "ID inválido", 404: "Caja no encontrada" },
      }),
    },

    // ================= Consumables =================
    "/consumable": {
      get: op({
        id: "listConsumables",
        tag: "Consumables",
        summary: "Listar consumibles (con lowStock)",
        roles: "admin",
        ok: { description: "Consumibles obtenidos", schema: arrayOf("ConsumableListItem") },
      }),
      post: op({
        id: "createConsumable",
        tag: "Consumables",
        summary: "Crear consumible",
        roles: "admin",
        body: "ConsumableInput",
        ok: { code: 201, description: "Consumible creado", schema: ref("Consumable") },
        errors: { 400: "Datos inválidos" },
      }),
    },
    "/consumable/low-stock": {
      get: op({
        id: "listLowStockConsumables",
        tag: "Consumables",
        summary: "Consumibles activos con quantity <= minStock",
        roles: "admin",
        ok: { description: "Consumibles con stock bajo", schema: arrayOf("Consumable") },
      }),
    },
    "/consumable/supplier/{supplierId}": {
      get: op({
        id: "listConsumablesBySupplier",
        tag: "Consumables",
        summary: "Listar consumibles por proveedor",
        roles: "admin",
        parameters: [intPathParam("supplierId", "ID del proveedor")],
        ok: { description: "Consumibles del proveedor", schema: arrayOf("Consumable") },
      }),
    },
    "/consumable/{id}": {
      get: op({
        id: "getConsumable",
        tag: "Consumables",
        summary: "Obtener consumible",
        roles: "admin",
        parameters: [idParam("consumible")],
        ok: { description: "Consumible obtenido", schema: ref("Consumable") },
        errors: { 400: "ID inválido", 404: "Consumible no encontrado" },
      }),
      put: op({
        id: "updateConsumable",
        tag: "Consumables",
        summary: "Actualizar consumible",
        roles: "admin",
        parameters: [idParam("consumible")],
        body: "ConsumableUpdate",
        ok: { description: "Consumible actualizado", schema: ref("Consumable") },
        errors: { 400: "Datos inválidos", 404: "Consumible no encontrado" },
      }),
      delete: op({
        id: "deleteConsumable",
        tag: "Consumables",
        summary: "Desactivar consumible (baja lógica)",
        roles: "admin",
        parameters: [idParam("consumible")],
        ok: { description: "Consumible desactivado", schema: ref("DeleteResult") },
        errors: { 400: "ID inválido", 404: "Consumible no encontrado" },
      }),
    },

    // ================= ConsumableTypes =================
    "/consumable-type": {
      get: op({
        id: "listConsumableTypes",
        tag: "ConsumableTypes",
        summary: "Listar tipos de consumible",
        roles: "admin",
        ok: { description: "Tipos de consumible", schema: arrayOf("ConsumableType") },
      }),
      post: op({
        id: "createConsumableType",
        tag: "ConsumableTypes",
        summary: "Crear tipo de consumible",
        roles: "admin",
        body: "ConsumableTypeInput",
        ok: { code: 201, description: "Tipo de consumible creado", schema: ref("ConsumableType") },
        errors: { 400: "Datos inválidos" },
      }),
    },
    "/consumable-type/{id}": {
      get: op({
        id: "getConsumableType",
        tag: "ConsumableTypes",
        summary: "Obtener tipo de consumible",
        roles: "admin",
        parameters: [idParam("tipo de consumible")],
        ok: { description: "Tipo de consumible obtenido", schema: ref("ConsumableType") },
        errors: { 400: "ID inválido", 404: "Tipo de consumible no encontrado" },
      }),
      put: op({
        id: "updateConsumableType",
        tag: "ConsumableTypes",
        summary: "Actualizar tipo de consumible",
        roles: "admin",
        parameters: [idParam("tipo de consumible")],
        body: "ConsumableTypeUpdate",
        ok: { description: "Tipo de consumible actualizado", schema: ref("ConsumableType") },
        errors: { 400: "Datos inválidos", 404: "Tipo de consumible no encontrado" },
      }),
      delete: op({
        id: "deleteConsumableType",
        tag: "ConsumableTypes",
        summary: "Eliminar tipo de consumible",
        roles: "admin",
        parameters: [idParam("tipo de consumible")],
        ok: { description: "Tipo de consumible eliminado", schema: ref("DeleteResult") },
        errors: {
          400: "ID inválido",
          404: "Tipo de consumible no encontrado",
          409: "El tipo tiene consumibles asociados",
        },
      }),
    },

    // ================= Ingredients =================
    "/ingredient": {
      get: op({
        id: "listIngredients",
        tag: "Ingredients",
        summary: "Listar ingredientes (recetas)",
        roles: "admin",
        ok: { description: "Ingredientes obtenidos", schema: arrayOf("Ingredient") },
      }),
      post: op({
        id: "createIngredient",
        tag: "Ingredients",
        summary: "Agregar ingrediente a un producto",
        roles: "admin",
        body: "IngredientInput",
        ok: { code: 201, description: "Ingrediente creado", schema: ref("Ingredient") },
        errors: { 400: "Datos inválidos" },
      }),
    },
    "/ingredient/product/{productId}": {
      get: op({
        id: "listIngredientsByProduct",
        tag: "Ingredients",
        summary: "Receta de un producto",
        roles: "admin",
        parameters: [intPathParam("productId", "ID del producto")],
        ok: { description: "Ingredientes del producto", schema: arrayOf("Ingredient") },
      }),
    },
    "/ingredient/{id}": {
      get: op({
        id: "getIngredient",
        tag: "Ingredients",
        summary: "Obtener ingrediente",
        roles: "admin",
        parameters: [idParam("ingrediente")],
        ok: { description: "Ingrediente obtenido", schema: ref("Ingredient") },
        errors: { 400: "ID inválido", 404: "Ingrediente no encontrado" },
      }),
      put: op({
        id: "updateIngredient",
        tag: "Ingredients",
        summary: "Actualizar ingrediente",
        roles: "admin",
        parameters: [idParam("ingrediente")],
        body: "IngredientUpdate",
        ok: { description: "Ingrediente actualizado", schema: ref("Ingredient") },
        errors: { 400: "Datos inválidos", 404: "Ingrediente no encontrado" },
      }),
      delete: op({
        id: "deleteIngredient",
        tag: "Ingredients",
        summary: "Eliminar ingrediente",
        roles: "admin",
        parameters: [idParam("ingrediente")],
        ok: { description: "Ingrediente eliminado", schema: ref("DeleteResult") },
        errors: { 400: "ID inválido", 404: "Ingrediente no encontrado" },
      }),
    },

    // ================= Suppliers =================
    "/suppliers": {
      get: op({
        id: "listSuppliers",
        tag: "Suppliers",
        summary: "Listar proveedores",
        roles: "admin",
        ok: { description: "Proveedores obtenidos", schema: arrayOf("Supplier") },
      }),
      post: op({
        id: "createSupplier",
        tag: "Suppliers",
        summary: "Crear proveedor",
        roles: "admin",
        body: "SupplierInput",
        ok: { code: 201, description: "Proveedor creado", schema: ref("Supplier") },
        errors: { 400: "Datos inválidos" },
      }),
    },
    "/suppliers/active": {
      get: op({
        id: "listActiveSuppliers",
        tag: "Suppliers",
        summary: "Listar proveedores activos",
        roles: "admin",
        ok: { description: "Proveedores activos", schema: arrayOf("Supplier") },
      }),
    },
    "/suppliers/{id}": {
      get: op({
        id: "getSupplier",
        tag: "Suppliers",
        summary: "Obtener proveedor",
        roles: "admin",
        parameters: [idParam("proveedor")],
        ok: { description: "Proveedor obtenido", schema: ref("Supplier") },
        errors: { 400: "ID inválido", 404: "Proveedor no encontrado" },
      }),
      put: op({
        id: "updateSupplier",
        tag: "Suppliers",
        summary: "Actualizar proveedor",
        roles: "admin",
        parameters: [idParam("proveedor")],
        body: "SupplierUpdate",
        ok: { description: "Proveedor actualizado", schema: ref("Supplier") },
        errors: { 400: "Datos inválidos", 404: "Proveedor no encontrado" },
      }),
      delete: op({
        id: "deleteSupplier",
        tag: "Suppliers",
        summary: "Eliminar proveedor",
        roles: "admin",
        parameters: [idParam("proveedor")],
        ok: { description: "Proveedor eliminado", schema: ref("DeleteResult") },
        errors: { 400: "ID inválido", 404: "Proveedor no encontrado" },
      }),
    },

    // ================= Purchases =================
    "/purchases": {
      get: op({
        id: "listPurchases",
        tag: "Purchases",
        summary: "Listar compras",
        roles: "admin",
        ok: { description: "Compras obtenidas", schema: arrayOf("Purchase") },
      }),
      post: op({
        id: "createPurchase",
        tag: "Purchases",
        summary: "Registrar compra",
        description:
          "Con `details` suma stock, actualiza el costo del consumible y calcula el total.",
        roles: "admin",
        body: "PurchaseInput",
        ok: { code: 201, description: "Compra creada correctamente", schema: ref("Purchase") },
        errors: { 400: "Datos inválidos o consumible inexistente" },
      }),
    },
    "/purchases/supplier/{supplierId}": {
      get: op({
        id: "listPurchasesBySupplier",
        tag: "Purchases",
        summary: "Listar compras por proveedor",
        roles: "admin",
        parameters: [intPathParam("supplierId", "ID del proveedor")],
        ok: { description: "Compras del proveedor", schema: arrayOf("Purchase") },
      }),
    },
    "/purchases/{id}": {
      get: op({
        id: "getPurchase",
        tag: "Purchases",
        summary: "Obtener compra con detalles",
        roles: "admin",
        parameters: [idParam("compra")],
        ok: { description: "Compra obtenida", schema: ref("Purchase") },
        errors: { 400: "ID inválido", 404: "Compra no encontrada" },
      }),
      put: op({
        id: "updatePurchase",
        tag: "Purchases",
        summary: "Actualizar datos generales de la compra",
        roles: "admin",
        parameters: [idParam("compra")],
        body: "PurchaseUpdate",
        ok: { description: "Compra actualizada", schema: ref("Purchase") },
        errors: {
          400: "Datos inválidos o total en compra con detalles",
          404: "Compra no encontrada",
        },
      }),
      delete: op({
        id: "deletePurchase",
        tag: "Purchases",
        summary: "Eliminar compra (revierte stock)",
        roles: "admin",
        parameters: [idParam("compra")],
        ok: { description: "Compra eliminada", schema: ref("DeleteResult") },
        errors: {
          400: "ID inválido",
          404: "Compra no encontrada",
          409: "El stock comprado ya se consumió",
        },
      }),
    },

    // ================= Reports =================
    "/reports/sales": {
      get: op({
        id: "getSalesReport",
        tag: "Reports",
        summary: "Reporte de ventas",
        description:
          "Ventas = cuentas closed o finished con fecha dentro del rango. byDay usa la zona America/El_Salvador.",
        roles: "admin",
        parameters: [
          queryParam("from", "Desde (fecha ISO)", { type: "string", format: "date-time" }, true),
          queryParam("to", "Hasta (fecha ISO)", { type: "string", format: "date-time" }, true),
          queryParam("top", "Cantidad de productos en topProducts (por defecto 10)", {
            type: "integer",
            minimum: 1,
            maximum: 50,
          }),
        ],
        ok: { description: "Reporte de ventas generado", schema: ref("SalesReport") },
        errors: { 400: "Rango inválido" },
      }),
    },
  },
};

/** Spec con el servidor real de la petición. /health vive fuera de /api. */
const buildDocument = (req: any) => {
  const origin = `${req.protocol}://${req.get("host")}`;
  return {
    ...swaggerDocument,
    servers: [{ url: `${origin}/api`, description: "Servidor API" }],
    paths: {
      ...swaggerDocument.paths,
      "/health": {
        get: {
          tags: ["Health"],
          operationId: "getHealth",
          summary: "Estado del servicio y la base de datos",
          description: ROLE_TEXT.public,
          "x-roles": [],
          security: [],
          servers: [{ url: origin }],
          responses: {
            200: {
              description: "Servicio operativo",
              content: jsonContent(ref("Health")),
            },
          },
        },
      },
    },
  };
};

export const setupSwagger = (app: any) => {
  app.get("/api/docs.json", (req: any, res: any) => {
    res.json(buildDocument(req));
  });

  app.get("/api/docs", (req: any, res: any) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>EstacionCafe API - Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(buildDocument(req))},
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    };
  </script>
</body>
</html>
    `.trim());
  });
};
