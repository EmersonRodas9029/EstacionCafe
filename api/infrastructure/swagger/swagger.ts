const jsonContent = (schema: any) => ({
  "application/json": { schema },
});

const successSchema = (dataSchema?: any) => {
  const properties: any = {
    status: { type: "string", example: "success" },
    message: { type: "string", example: "Operación realizada correctamente" },
  };
  const required = ["status", "message"];

  if (dataSchema) {
    properties.data = dataSchema;
    required.push("data");
  }

  return {
    type: "object",
    properties,
    required,
  };
};

const successResponse = (description: string, dataSchema?: any) => ({
  description,
  content: jsonContent(successSchema(dataSchema)),
});

const errorResponse = (description: string) => ({
  description,
  content: jsonContent({ $ref: "#/components/schemas/ErrorResponse" }),
});

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
  schema: Record<string, any> = { type: "string" },
) => ({
  name,
  in: "path",
  required: true,
  description,
  schema,
});

const requestBody = (schemaRef: string, description?: string) => ({
  ...(description ? { description } : {}),
  required: true,
  content: jsonContent({ $ref: schemaRef }),
});

const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "EstacionCafe API",
    version: "1.0.0",
    description:
      "Documentación completa de la API. Los endpoints DELETE requieren token Bearer.",
  },
  servers: [],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Error en la operación" },
          campo: {
            type: "array",
            items: { type: "string" },
            example: ["email"],
          },
          error: { type: "string", example: "invalid_type" },
          type: { type: "string", example: "stock_error" },
          errors: {
            oneOf: [{ type: "string" }, { type: "object", additionalProperties: true }],
          },
        },
        required: ["status", "message"],
      },

      LoginRequest: {
        type: "object",
        properties: {
          username: { type: "string", minLength: 3, maxLength: 50 },
          password: { type: "string", minLength: 6, maxLength: 100 },
        },
        required: ["username", "password"],
      },
      LoginData: {
        type: "object",
        properties: {
          token: { type: "string" },
          expiresIn: { type: "string", example: "1 hora" },
        },
        required: ["token", "expiresIn"],
      },

      UserType: {
        type: "object",
        properties: {
          userTypeId: { type: "integer", minimum: 1 },
          name: { type: "string", maxLength: 50 },
          permissionLevel: { type: "integer", minimum: 0, maximum: 10 },
        },
        required: ["userTypeId", "name", "permissionLevel"],
      },
      UserTypeInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
          permissionLevel: { type: "integer", minimum: 0, maximum: 10 },
        },
        required: ["name", "permissionLevel"],
      },
      UserTypeUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
          permissionLevel: { type: "integer", minimum: 0, maximum: 10 },
        },
      },

      User: {
        type: "object",
        properties: {
          userId: { type: "integer", minimum: 1 },
          username: { type: "string", minLength: 3, maxLength: 50 },
          email: { type: "string", format: "email" },
          userTypeId: { type: "integer", minimum: 1 },
          active: { type: "boolean" },
          userType: { $ref: "#/components/schemas/UserType" },
        },
        required: ["userId", "username", "email", "userTypeId"],
      },
      UserInput: {
        type: "object",
        properties: {
          username: { type: "string", minLength: 3, maxLength: 50 },
          password: { type: "string", minLength: 6, maxLength: 100 },
          email: { type: "string", format: "email" },
          typeId: { type: "integer", minimum: 1 },
        },
        required: ["username", "password", "email", "typeId"],
      },
      UserUpdate: {
        type: "object",
        properties: {
          username: { type: "string", minLength: 3, maxLength: 50 },
          password: { type: "string", minLength: 6, maxLength: 100 },
          email: { type: "string", format: "email" },
          typeId: { type: "integer", minimum: 1 },
        },
      },

      ProductType: {
        type: "object",
        properties: {
          productTypeId: { type: "integer", minimum: 1 },
          name: { type: "string", minLength: 1, maxLength: 50 },
        },
        required: ["productTypeId", "name"],
      },
      ProductTypeInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
        },
        required: ["name"],
      },
      ProductTypeUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
        },
      },

      Product: {
        type: "object",
        properties: {
          productId: { type: "integer", minimum: 1 },
          name: { type: "string", minLength: 1, maxLength: 50 },
          description: { type: "string", minLength: 1, maxLength: 100 },
          price: { type: "number", minimum: 0 },
          cost: { type: "number", minimum: 0 },
          productTypeId: { type: "integer", minimum: 1 },
          active: { type: "boolean" },
        },
        required: ["productId", "name", "description", "price", "cost", "productTypeId"],
      },
      ProductInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
          description: { type: "string", minLength: 1, maxLength: 100 },
          price: { type: "number", exclusiveMinimum: 0 },
          cost: { type: "number", exclusiveMinimum: 0 },
          productTypeId: { type: "integer", minimum: 1 },
        },
        required: ["name", "description", "price", "cost", "productTypeId"],
      },
      ProductUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
          description: { type: "string", minLength: 1, maxLength: 100 },
          price: { type: "number", exclusiveMinimum: 0 },
          cost: { type: "number", exclusiveMinimum: 0 },
          productTypeId: { type: "integer", minimum: 1 },
        },
      },

      BillStatus: {
        type: "string",
        enum: ["open", "closed", "draft", "finished"],
      },
      Bill: {
        type: "object",
        properties: {
          billId: { type: "integer", minimum: 1 },
          customer: { type: "string", minLength: 1, maxLength: 100 },
          cashRegisterId: { type: "integer", minimum: 1 },
          tableId: { type: "string", maxLength: 10, nullable: true },
          total: { type: "number", minimum: 0 },
          status: { $ref: "#/components/schemas/BillStatus" },
          date: { type: "string", format: "date-time" },
        },
        required: ["billId", "customer", "cashRegisterId", "total", "status"],
      },
      BillInput: {
        type: "object",
        properties: {
          customer: { type: "string", minLength: 1, maxLength: 100 },
          cashRegister: { type: "integer", minimum: 1 },
          tableId: { type: "string", minLength: 1, maxLength: 10 },
          total: { type: "number", minimum: 0 },
          status: { $ref: "#/components/schemas/BillStatus" },
          date: { type: "string", format: "date-time" },
        },
        required: ["customer", "cashRegister", "total", "date"],
      },
      BillUpdate: {
        type: "object",
        properties: {
          customer: { type: "string", minLength: 1, maxLength: 100 },
          cashRegisterId: { type: "integer", minimum: 1 },
          tableId: { type: "string", minLength: 1, maxLength: 10 },
          total: { type: "number", minimum: 0 },
          status: { $ref: "#/components/schemas/BillStatus" },
          date: { type: "string", format: "date-time" },
        },
      },
      CloseBillsResult: {
        type: "object",
        properties: {
          updated: { type: "integer", minimum: 0 },
        },
        required: ["updated"],
      },

      BillDetailItem: {
        type: "object",
        properties: {
          productId: { type: "integer", minimum: 1 },
          name: { type: "string", minLength: 1, maxLength: 100 },
          quantity: { type: "integer", minimum: 1 },
          price: { type: "number", exclusiveMinimum: 0 },
          subTotal: { type: "number", minimum: 0 },
        },
        required: ["productId", "name", "quantity", "price", "subTotal"],
      },
      BillDetail: {
        type: "object",
        properties: {
          billDetailId: { type: "integer", minimum: 1 },
          billId: { type: "integer", minimum: 1 },
          productId: { type: "integer", minimum: 1 },
          quantity: { type: "integer", minimum: 1 },
          subTotal: { type: "number", minimum: 0 },
          product: { $ref: "#/components/schemas/Product" },
          bill: { $ref: "#/components/schemas/Bill" },
        },
        required: ["billDetailId", "billId", "productId", "quantity", "subTotal"],
      },
      BillDetailsInput: {
        type: "object",
        properties: {
          billId: { type: "integer", minimum: 1 },
          billDetails: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/BillDetailItem" },
          },
        },
        required: ["billId", "billDetails"],
      },

      ConsumableType: {
        type: "object",
        properties: {
          consumableTypeId: { type: "integer", minimum: 1 },
          name: { type: "string", minLength: 1, maxLength: 255 },
        },
        required: ["consumableTypeId", "name"],
      },
      ConsumableTypeInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
        },
        required: ["name"],
      },
      ConsumableTypeUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
        },
        required: ["name"],
      },

      UnitMeasurement: {
        type: "string",
        enum: ["g", "kg", "l", "ml", "oz", "lb", "unit", "tbsp", "tsp", "cup", "piece"],
      },
      Consumable: {
        type: "object",
        properties: {
          consumableId: { type: "integer", minimum: 1 },
          supplierId: { type: "integer", minimum: 1 },
          name: { type: "string", minLength: 1, maxLength: 255 },
          cosumableTypeId: { type: "integer", minimum: 0 },
          quantity: { type: "number", minimum: 0 },
          unitMeasurement: { $ref: "#/components/schemas/UnitMeasurement" },
          cost: { type: "number", minimum: 0 },
          active: { type: "boolean" },
        },
        required: [
          "consumableId",
          "supplierId",
          "name",
          "cosumableTypeId",
          "quantity",
          "unitMeasurement",
          "cost",
        ],
      },
      ConsumableInput: {
        type: "object",
        properties: {
          supplierId: { type: "integer", minimum: 1 },
          name: { type: "string", minLength: 1, maxLength: 255 },
          cosumableTypeId: { type: "integer", minimum: 0 },
          quantity: { type: "number", minimum: 0 },
          unitMeasurement: { $ref: "#/components/schemas/UnitMeasurement" },
          cost: { type: "number", minimum: 0 },
        },
        required: [
          "supplierId",
          "name",
          "cosumableTypeId",
          "quantity",
          "unitMeasurement",
          "cost",
        ],
      },
      ConsumableUpdate: {
        type: "object",
        properties: {
          supplierId: { type: "integer", minimum: 1 },
          name: { type: "string", minLength: 1, maxLength: 255 },
          cosumableTypeId: { type: "integer", minimum: 0 },
          quantity: { type: "number", minimum: 0 },
          unitMeasurement: { $ref: "#/components/schemas/UnitMeasurement" },
          cost: { type: "number", minimum: 0 },
        },
      },

      Ingredient: {
        type: "object",
        properties: {
          ingredientId: { type: "integer", minimum: 1 },
          name: { type: "string", minLength: 1, maxLength: 255 },
          quantity: { type: "number", exclusiveMinimum: 0 },
          productId: { type: "integer", minimum: 1 },
          consumableId: { type: "integer", minimum: 1 },
        },
        required: ["ingredientId", "name", "quantity", "productId", "consumableId"],
      },
      IngredientInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          quantity: { type: "number", exclusiveMinimum: 0 },
          productId: { type: "integer", minimum: 1 },
          consumableId: { type: "integer", minimum: 1 },
        },
        required: ["name", "quantity", "productId", "consumableId"],
      },
      IngredientUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          quantity: { type: "number", exclusiveMinimum: 0 },
          productId: { type: "integer", minimum: 1 },
          consumableId: { type: "integer", minimum: 1 },
        },
      },

      Supplier: {
        type: "object",
        properties: {
          supplierId: { type: "integer", minimum: 1 },
          name: { type: "string", minLength: 1, maxLength: 100 },
          phone: {
            type: "string",
            pattern: "^(\\+503)?[2-9]\\d{3}-?\\d{4}$",
          },
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
          phone: {
            type: "string",
            pattern: "^(\\+503)?[2-9]\\d{3}-?\\d{4}$",
          },
          email: { type: "string", format: "email" },
          active: { type: "boolean" },
        },
      },

      Purchase: {
        type: "object",
        properties: {
          purchaseId: { type: "integer", minimum: 1 },
          date: { type: "string", format: "date-time" },
          cashRegister: { type: "integer", minimum: 1 },
          supplierId: { type: "integer", minimum: 1 },
          supplierName: { type: "string" },
          total: { type: "number", exclusiveMinimum: 0 },
        },
        required: ["purchaseId", "date", "cashRegister", "supplierId", "total"],
      },
      PurchaseInput: {
        type: "object",
        properties: {
          date: { type: "string", format: "date-time" },
          cashRegister: { type: "integer", minimum: 1 },
          supplierId: { type: "integer", minimum: 1 },
          total: { type: "number", exclusiveMinimum: 0 },
        },
        required: ["date", "cashRegister", "supplierId", "total"],
      },
      PurchaseUpdate: {
        type: "object",
        properties: {
          date: { type: "string", format: "date-time" },
          cashRegister: { type: "integer", minimum: 1 },
          supplierId: { type: "integer", minimum: 1 },
          total: { type: "number", exclusiveMinimum: 0 },
        },
      },

      CashRegister: {
        type: "object",
        properties: {
          cashRegisterId: { type: "integer", minimum: 1 },
          number: { type: "string", minLength: 1, maxLength: 20 },
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
              { type: "integer", minimum: 1 },
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
              { type: "integer", minimum: 1 },
            ],
          },
          active: { type: "boolean" },
        },
      },

      TableStatus: {
        type: "string",
        enum: ["disponible", "ocupada", "reservada"],
      },
      Table: {
        type: "object",
        properties: {
          tableId: { type: "string", minLength: 1, maxLength: 10 },
          zone: { type: "string", minLength: 1, maxLength: 50 },
          status: { $ref: "#/components/schemas/TableStatus" },
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
          status: { $ref: "#/components/schemas/TableStatus" },
        },
        required: ["tableId", "zone"],
      },
      TableUpdate: {
        type: "object",
        properties: {
          zone: { type: "string", minLength: 1, maxLength: 50 },
          status: { $ref: "#/components/schemas/TableStatus" },
        },
      },
      TableStatusUpdate: {
        type: "object",
        properties: {
          status: { $ref: "#/components/schemas/TableStatus" },
        },
        required: ["status"],
      },
    },
  },
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "User Types" },
    { name: "Products" },
    { name: "Product Types" },
    { name: "Bills" },
    { name: "Bill Details" },
    { name: "Consumables" },
    { name: "Consumable Types" },
    { name: "Ingredients" },
    { name: "Suppliers" },
    { name: "Purchases" },
    { name: "Cash Registers" },
    { name: "Tables" },
  ],
  paths: {
    "/users/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión",
        requestBody: requestBody("#/components/schemas/LoginRequest"),
        responses: {
          200: successResponse("Sesión iniciada correctamente", {
            $ref: "#/components/schemas/LoginData",
          }),
          500: errorResponse("Error al iniciar sesión"),
        },
      },
    },
    "/users/logout": {
      post: {
        tags: ["Auth"],
        summary: "Cerrar sesión",
        responses: {
          200: successResponse("Sesión cerrada correctamente"),
          500: errorResponse("Error al cerrar sesión"),
        },
      },
    },

    "/users": {
      get: {
        tags: ["Users"],
        summary: "Listar usuarios",
        responses: {
          200: successResponse("Usuarios obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/User" },
          }),
          500: errorResponse("Error al obtener usuarios"),
        },
      },
      post: {
        tags: ["Users"],
        summary: "Crear usuario",
        requestBody: requestBody("#/components/schemas/UserInput"),
        responses: {
          201: successResponse("Usuario creado correctamente", {
            $ref: "#/components/schemas/User",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error interno del servidor"),
        },
      },
    },
    "/users/type/{typeId}": {
      get: {
        tags: ["Users"],
        summary: "Listar usuarios por tipo",
        parameters: [intPathParam("typeId", "ID del tipo de usuario")],
        responses: {
          200: successResponse("Usuarios por tipo obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/User" },
          }),
          500: errorResponse("Error al obtener usuarios por tipo"),
        },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Obtener usuario por ID",
        parameters: [intPathParam("id", "ID del usuario")],
        responses: {
          200: successResponse("Usuario obtenido correctamente", {
            $ref: "#/components/schemas/User",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Usuario no encontrado"),
          500: errorResponse("Error al obtener usuario"),
        },
      },
      put: {
        tags: ["Users"],
        summary: "Actualizar usuario",
        parameters: [intPathParam("id", "ID del usuario")],
        requestBody: requestBody("#/components/schemas/UserUpdate"),
        responses: {
          200: successResponse("Usuario actualizado correctamente", {
            $ref: "#/components/schemas/User",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Usuario no encontrado"),
          500: errorResponse("Error al actualizar usuario"),
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Eliminar usuario",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID del usuario")],
        responses: {
          200: successResponse("Usuario eliminado correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Usuario no encontrado"),
          500: errorResponse("Error al eliminar usuario"),
        },
      },
    },

    "/user-types": {
      get: {
        tags: ["User Types"],
        summary: "Listar tipos de usuario",
        responses: {
          200: successResponse("Tipos de usuario obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/UserType" },
          }),
          500: errorResponse("Error al obtener tipos de usuario"),
        },
      },
      post: {
        tags: ["User Types"],
        summary: "Crear tipo de usuario",
        requestBody: requestBody("#/components/schemas/UserTypeInput"),
        responses: {
          201: successResponse("Tipo de usuario creado correctamente", {
            $ref: "#/components/schemas/UserType",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error interno del servidor"),
        },
      },
    },
    "/user-types/{id}": {
      get: {
        tags: ["User Types"],
        summary: "Obtener tipo de usuario por ID",
        parameters: [intPathParam("id", "ID del tipo de usuario")],
        responses: {
          200: successResponse("Tipo de usuario obtenido correctamente", {
            $ref: "#/components/schemas/UserType",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Tipo de usuario no encontrado"),
          500: errorResponse("Error al obtener tipo de usuario"),
        },
      },
      put: {
        tags: ["User Types"],
        summary: "Actualizar tipo de usuario",
        parameters: [intPathParam("id", "ID del tipo de usuario")],
        requestBody: requestBody("#/components/schemas/UserTypeUpdate"),
        responses: {
          200: successResponse("Tipo de usuario actualizado correctamente", {
            $ref: "#/components/schemas/UserType",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Tipo de usuario no encontrado"),
          500: errorResponse("Error al actualizar tipo de usuario"),
        },
      },
      delete: {
        tags: ["User Types"],
        summary: "Eliminar tipo de usuario",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID del tipo de usuario")],
        responses: {
          200: successResponse("Tipo de usuario eliminado correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Tipo de usuario no encontrado"),
          500: errorResponse("Error al eliminar tipo de usuario"),
        },
      },
    },

    "/products": {
      get: {
        tags: ["Products"],
        summary: "Listar productos",
        responses: {
          200: successResponse("Productos obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Product" },
          }),
          500: errorResponse("Error al obtener productos"),
        },
      },
      post: {
        tags: ["Products"],
        summary: "Crear producto",
        requestBody: requestBody("#/components/schemas/ProductInput"),
        responses: {
          201: successResponse("Producto creado correctamente", {
            $ref: "#/components/schemas/Product",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error al crear producto"),
        },
      },
    },
    "/products/active": {
      get: {
        tags: ["Products"],
        summary: "Listar productos activos",
        responses: {
          200: successResponse("Productos activos obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Product" },
          }),
          500: errorResponse("Error al obtener productos activos"),
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Obtener producto por ID",
        parameters: [intPathParam("id", "ID del producto")],
        responses: {
          200: successResponse("Producto obtenido correctamente", {
            $ref: "#/components/schemas/Product",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Producto no encontrado"),
          500: errorResponse("Error al obtener producto"),
        },
      },
      put: {
        tags: ["Products"],
        summary: "Actualizar producto",
        parameters: [intPathParam("id", "ID del producto")],
        requestBody: requestBody("#/components/schemas/ProductUpdate"),
        responses: {
          200: successResponse("Producto actualizado correctamente", {
            $ref: "#/components/schemas/Product",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Producto no encontrado"),
          500: errorResponse("Error al actualizar producto"),
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Eliminar producto",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID del producto")],
        responses: {
          200: successResponse("Producto eliminado correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Producto no encontrado"),
          500: errorResponse("Error al eliminar producto"),
        },
      },
    },

    "/product-type": {
      get: {
        tags: ["Product Types"],
        summary: "Listar tipos de producto",
        responses: {
          200: successResponse("Tipos de producto obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/ProductType" },
          }),
          500: errorResponse("Error al obtener tipos de producto"),
        },
      },
      post: {
        tags: ["Product Types"],
        summary: "Crear tipo de producto",
        requestBody: requestBody("#/components/schemas/ProductTypeInput"),
        responses: {
          201: successResponse("Tipo de producto creado correctamente", {
            $ref: "#/components/schemas/ProductType",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error al crear tipo de producto"),
        },
      },
    },
    "/product-type/{id}": {
      get: {
        tags: ["Product Types"],
        summary: "Obtener tipo de producto por ID",
        parameters: [intPathParam("id", "ID del tipo de producto")],
        responses: {
          200: successResponse("Tipo de producto obtenido correctamente", {
            $ref: "#/components/schemas/ProductType",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Tipo de producto no encontrado"),
          500: errorResponse("Error al obtener tipo de producto"),
        },
      },
      put: {
        tags: ["Product Types"],
        summary: "Actualizar tipo de producto",
        parameters: [intPathParam("id", "ID del tipo de producto")],
        requestBody: requestBody("#/components/schemas/ProductTypeUpdate"),
        responses: {
          200: successResponse("Tipo de producto actualizado correctamente", {
            $ref: "#/components/schemas/ProductType",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Tipo de producto no encontrado"),
          500: errorResponse("Error al actualizar tipo de producto"),
        },
      },
      delete: {
        tags: ["Product Types"],
        summary: "Eliminar tipo de producto",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID del tipo de producto")],
        responses: {
          200: successResponse("Tipo de producto eliminado correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Tipo de producto no encontrado"),
          500: errorResponse("Error al eliminar tipo de producto"),
        },
      },
    },

    "/bills": {
      get: {
        tags: ["Bills"],
        summary: "Listar facturas",
        responses: {
          200: successResponse("Facturas obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Bill" },
          }),
          500: errorResponse("Error al obtener facturas"),
        },
      },
      post: {
        tags: ["Bills"],
        summary: "Crear factura",
        requestBody: requestBody("#/components/schemas/BillInput"),
        responses: {
          201: successResponse("Factura creada correctamente", {
            $ref: "#/components/schemas/Bill",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error al crear factura"),
        },
      },
    },
    "/bills/date-range": {
      get: {
        tags: ["Bills"],
        summary: "Listar facturas por rango de fechas",
        parameters: [
          {
            name: "startDate",
            in: "query",
            required: true,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "endDate",
            in: "query",
            required: true,
            schema: { type: "string", format: "date-time" },
          },
        ],
        responses: {
          200: successResponse("Facturas obtenidas por rango de fecha", {
            type: "array",
            items: { $ref: "#/components/schemas/Bill" },
          }),
          400: errorResponse("Parámetros inválidos"),
          500: errorResponse("Error al obtener facturas por rango"),
        },
      },
    },
    "/bills/customer/{customer}": {
      get: {
        tags: ["Bills"],
        summary: "Listar facturas por cliente",
        parameters: [
          strPathParam("customer", "Nombre del cliente", {
            type: "string",
            minLength: 1,
          }),
        ],
        responses: {
          200: successResponse("Facturas del cliente obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Bill" },
          }),
          500: errorResponse("Error al obtener facturas por cliente"),
        },
      },
    },
    "/bills/table/{tableId}": {
      get: {
        tags: ["Bills"],
        summary: "Listar facturas por mesa",
        parameters: [
          strPathParam("tableId", "ID de la mesa", {
            type: "string",
            minLength: 1,
            maxLength: 10,
          }),
        ],
        responses: {
          200: successResponse("Facturas de la mesa obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Bill" },
          }),
          500: errorResponse("Error al obtener facturas por mesa"),
        },
      },
    },
    "/bills/table/{tableId}/close": {
      post: {
        tags: ["Bills"],
        summary: "Cerrar facturas de una mesa",
        parameters: [
          strPathParam("tableId", "ID de la mesa", {
            type: "string",
            minLength: 1,
            maxLength: 10,
          }),
        ],
        responses: {
          200: successResponse("Facturas cerradas correctamente", {
            $ref: "#/components/schemas/CloseBillsResult",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error al cerrar facturas"),
        },
      },
    },
    "/bills/{id}": {
      get: {
        tags: ["Bills"],
        summary: "Obtener factura por ID",
        parameters: [intPathParam("id", "ID de la factura")],
        responses: {
          200: successResponse("Factura obtenida correctamente", {
            $ref: "#/components/schemas/Bill",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Factura no encontrada"),
          500: errorResponse("Error al obtener factura"),
        },
      },
      put: {
        tags: ["Bills"],
        summary: "Actualizar factura",
        parameters: [intPathParam("id", "ID de la factura")],
        requestBody: requestBody("#/components/schemas/BillUpdate"),
        responses: {
          200: successResponse("Factura actualizada correctamente", {
            $ref: "#/components/schemas/Bill",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Factura no encontrada"),
          500: errorResponse("Error al actualizar factura"),
        },
      },
      delete: {
        tags: ["Bills"],
        summary: "Eliminar factura",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID de la factura")],
        responses: {
          200: successResponse("Factura eliminada correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Factura no encontrada"),
          500: errorResponse("Error al eliminar factura"),
        },
      },
    },

    "/bill-details": {
      get: {
        tags: ["Bill Details"],
        summary: "Listar detalles de factura",
        responses: {
          200: successResponse("Detalles obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/BillDetail" },
          }),
          500: errorResponse("Error al obtener detalles"),
        },
      },
      post: {
        tags: ["Bill Details"],
        summary: "Crear detalles de factura",
        requestBody: requestBody("#/components/schemas/BillDetailsInput"),
        responses: {
          201: successResponse("Factura y detalles guardados correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/BillDetail" },
          }),
          400: errorResponse("Datos inválidos o validación de negocio"),
          500: errorResponse("Error al guardar detalles"),
        },
      },
    },
    "/bill-details/bill/{billId}": {
      get: {
        tags: ["Bill Details"],
        summary: "Obtener detalles por factura",
        parameters: [intPathParam("billId", "ID de la factura")],
        responses: {
          200: successResponse("Detalles obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/BillDetailItem" },
          }),
          400: errorResponse("ID de factura inválido"),
          404: errorResponse("No se encontraron detalles"),
          500: errorResponse("Error al obtener detalles"),
        },
      },
    },
    "/bill-details/{id}": {
      delete: {
        tags: ["Bill Details"],
        summary: "Eliminar detalle de factura",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID del detalle")],
        responses: {
          202: successResponse("Detalle eliminado correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Detalle no encontrado"),
          500: errorResponse("Error al eliminar detalle"),
        },
      },
    },

    "/consumable": {
      get: {
        tags: ["Consumables"],
        summary: "Listar consumibles",
        responses: {
          200: successResponse("Consumibles obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Consumable" },
          }),
          500: errorResponse("Error al obtener consumibles"),
        },
      },
      post: {
        tags: ["Consumables"],
        summary: "Crear consumible",
        requestBody: requestBody("#/components/schemas/ConsumableInput"),
        responses: {
          201: successResponse("Consumible guardado correctamente", {
            $ref: "#/components/schemas/Consumable",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error al crear consumible"),
        },
      },
    },
    "/consumable/supplier/{supplierId}": {
      get: {
        tags: ["Consumables"],
        summary: "Listar consumibles por proveedor",
        parameters: [intPathParam("supplierId", "ID del proveedor")],
        responses: {
          200: successResponse("Consumibles del proveedor obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Consumable" },
          }),
          500: errorResponse("Error al obtener consumibles por proveedor"),
        },
      },
    },
    "/consumable/{id}": {
      get: {
        tags: ["Consumables"],
        summary: "Obtener consumible por ID",
        parameters: [intPathParam("id", "ID del consumible")],
        responses: {
          200: successResponse("Consumible obtenido correctamente", {
            $ref: "#/components/schemas/Consumable",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Consumible no encontrado"),
          500: errorResponse("Error al obtener consumible"),
        },
      },
      put: {
        tags: ["Consumables"],
        summary: "Actualizar consumible",
        parameters: [intPathParam("id", "ID del consumible")],
        requestBody: requestBody("#/components/schemas/ConsumableUpdate"),
        responses: {
          200: successResponse("Consumible actualizado correctamente", {
            $ref: "#/components/schemas/Consumable",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Consumible no encontrado"),
          500: errorResponse("Error al actualizar consumible"),
        },
      },
      delete: {
        tags: ["Consumables"],
        summary: "Eliminar consumible",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID del consumible")],
        responses: {
          200: successResponse("Consumible eliminado correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Consumible no encontrado"),
          500: errorResponse("Error al eliminar consumible"),
        },
      },
    },

    "/consumable-type": {
      get: {
        tags: ["Consumable Types"],
        summary: "Listar tipos de consumible",
        responses: {
          200: successResponse("Tipos de consumibles obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/ConsumableType" },
          }),
          500: errorResponse("Error al obtener tipos de consumible"),
        },
      },
      post: {
        tags: ["Consumable Types"],
        summary: "Crear tipo de consumible",
        requestBody: requestBody("#/components/schemas/ConsumableTypeInput"),
        responses: {
          201: successResponse("Tipo de consumible guardado correctamente", {
            $ref: "#/components/schemas/ConsumableType",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error al crear tipo de consumible"),
        },
      },
    },
    "/consumable-type/{id}": {
      get: {
        tags: ["Consumable Types"],
        summary: "Obtener tipo de consumible por ID",
        parameters: [intPathParam("id", "ID del tipo de consumible")],
        responses: {
          200: successResponse("Tipo de consumible obtenido correctamente", {
            $ref: "#/components/schemas/ConsumableType",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Tipo de consumible no encontrado"),
          500: errorResponse("Error al obtener tipo de consumible"),
        },
      },
      put: {
        tags: ["Consumable Types"],
        summary: "Actualizar tipo de consumible",
        parameters: [intPathParam("id", "ID del tipo de consumible")],
        requestBody: requestBody("#/components/schemas/ConsumableTypeUpdate"),
        responses: {
          200: successResponse("Tipo de consumible actualizado correctamente", {
            $ref: "#/components/schemas/ConsumableType",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Tipo de consumible no encontrado"),
          500: errorResponse("Error al actualizar tipo de consumible"),
        },
      },
      delete: {
        tags: ["Consumable Types"],
        summary: "Eliminar tipo de consumible",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID del tipo de consumible")],
        responses: {
          200: successResponse("Tipo de consumible eliminado correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Tipo de consumible no encontrado"),
          500: errorResponse("Error al eliminar tipo de consumible"),
        },
      },
    },

    "/ingredient": {
      get: {
        tags: ["Ingredients"],
        summary: "Listar ingredientes",
        responses: {
          200: successResponse("Ingredientes obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Ingredient" },
          }),
          500: errorResponse("Error al obtener ingredientes"),
        },
      },
      post: {
        tags: ["Ingredients"],
        summary: "Crear ingrediente",
        requestBody: requestBody("#/components/schemas/IngredientInput"),
        responses: {
          201: successResponse("Ingrediente guardado correctamente", {
            $ref: "#/components/schemas/Ingredient",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error al crear ingrediente"),
        },
      },
    },
    "/ingredient/product/{productId}": {
      get: {
        tags: ["Ingredients"],
        summary: "Listar ingredientes por producto",
        parameters: [intPathParam("productId", "ID del producto")],
        responses: {
          200: successResponse("Ingredientes del producto obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Ingredient" },
          }),
          500: errorResponse("Error al obtener ingredientes por producto"),
        },
      },
    },
    "/ingredient/{id}": {
      get: {
        tags: ["Ingredients"],
        summary: "Obtener ingrediente por ID",
        parameters: [intPathParam("id", "ID del ingrediente")],
        responses: {
          200: successResponse("Ingrediente obtenido correctamente", {
            $ref: "#/components/schemas/Ingredient",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Ingrediente no encontrado"),
          500: errorResponse("Error al obtener ingrediente"),
        },
      },
      put: {
        tags: ["Ingredients"],
        summary: "Actualizar ingrediente",
        parameters: [intPathParam("id", "ID del ingrediente")],
        requestBody: requestBody("#/components/schemas/IngredientUpdate"),
        responses: {
          200: successResponse("Ingrediente actualizado correctamente", {
            $ref: "#/components/schemas/Ingredient",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Ingrediente no encontrado"),
          500: errorResponse("Error al actualizar ingrediente"),
        },
      },
      delete: {
        tags: ["Ingredients"],
        summary: "Eliminar ingrediente",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID del ingrediente")],
        responses: {
          200: successResponse("Ingrediente eliminado correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Ingrediente no encontrado"),
          500: errorResponse("Error al eliminar ingrediente"),
        },
      },
    },

    "/suppliers": {
      get: {
        tags: ["Suppliers"],
        summary: "Listar proveedores",
        responses: {
          200: successResponse("Proveedores obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Supplier" },
          }),
          500: errorResponse("Error al obtener proveedores"),
        },
      },
      post: {
        tags: ["Suppliers"],
        summary: "Crear proveedor",
        requestBody: requestBody("#/components/schemas/SupplierInput"),
        responses: {
          201: successResponse("Proveedor creado correctamente", {
            $ref: "#/components/schemas/Supplier",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error al crear proveedor"),
        },
      },
    },
    "/suppliers/active": {
      get: {
        tags: ["Suppliers"],
        summary: "Listar proveedores activos",
        responses: {
          200: successResponse("Proveedores activos obtenidos correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Supplier" },
          }),
          500: errorResponse("Error al obtener proveedores activos"),
        },
      },
    },
    "/suppliers/{id}": {
      get: {
        tags: ["Suppliers"],
        summary: "Obtener proveedor por ID",
        parameters: [intPathParam("id", "ID del proveedor")],
        responses: {
          200: successResponse("Proveedor obtenido correctamente", {
            $ref: "#/components/schemas/Supplier",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Proveedor no encontrado"),
          500: errorResponse("Error al obtener proveedor"),
        },
      },
      put: {
        tags: ["Suppliers"],
        summary: "Actualizar proveedor",
        parameters: [intPathParam("id", "ID del proveedor")],
        requestBody: requestBody("#/components/schemas/SupplierUpdate"),
        responses: {
          200: successResponse("Proveedor actualizado correctamente", {
            $ref: "#/components/schemas/Supplier",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Proveedor no encontrado"),
          500: errorResponse("Error al actualizar proveedor"),
        },
      },
      delete: {
        tags: ["Suppliers"],
        summary: "Eliminar proveedor",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID del proveedor")],
        responses: {
          200: successResponse("Proveedor eliminado correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Proveedor no encontrado"),
          500: errorResponse("Error al eliminar proveedor"),
        },
      },
    },

    "/purchases": {
      get: {
        tags: ["Purchases"],
        summary: "Listar compras",
        responses: {
          200: successResponse("Compras obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Purchase" },
          }),
          500: errorResponse("Error al obtener compras"),
        },
      },
      post: {
        tags: ["Purchases"],
        summary: "Crear compra",
        requestBody: requestBody("#/components/schemas/PurchaseInput"),
        responses: {
          201: successResponse("Compra creada correctamente", {
            $ref: "#/components/schemas/Purchase",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error al crear compra"),
        },
      },
    },
    "/purchases/supplier/{supplierId}": {
      get: {
        tags: ["Purchases"],
        summary: "Listar compras por proveedor",
        parameters: [intPathParam("supplierId", "ID del proveedor")],
        responses: {
          200: successResponse("Compras del proveedor obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Purchase" },
          }),
          500: errorResponse("Error al obtener compras por proveedor"),
        },
      },
    },
    "/purchases/{id}": {
      get: {
        tags: ["Purchases"],
        summary: "Obtener compra por ID",
        parameters: [intPathParam("id", "ID de la compra")],
        responses: {
          200: successResponse("Compra obtenida correctamente", {
            $ref: "#/components/schemas/Purchase",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Compra no encontrada"),
          500: errorResponse("Error al obtener compra"),
        },
      },
      put: {
        tags: ["Purchases"],
        summary: "Actualizar compra",
        parameters: [intPathParam("id", "ID de la compra")],
        requestBody: requestBody("#/components/schemas/PurchaseUpdate"),
        responses: {
          200: successResponse("Compra actualizada correctamente", {
            $ref: "#/components/schemas/Purchase",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Compra no encontrada"),
          500: errorResponse("Error al actualizar compra"),
        },
      },
      delete: {
        tags: ["Purchases"],
        summary: "Eliminar compra",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID de la compra")],
        responses: {
          200: successResponse("Compra eliminada correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Compra no encontrada"),
          500: errorResponse("Error al eliminar compra"),
        },
      },
    },

    "/cash-registers": {
      get: {
        tags: ["Cash Registers"],
        summary: "Listar cajas registradoras",
        responses: {
          200: successResponse("Cajas registradoras obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/CashRegister" },
          }),
          500: errorResponse("Error al obtener cajas registradoras"),
        },
      },
      post: {
        tags: ["Cash Registers"],
        summary: "Crear caja registradora",
        requestBody: requestBody("#/components/schemas/CashRegisterInput"),
        responses: {
          201: successResponse("Caja registradora creada correctamente", {
            $ref: "#/components/schemas/CashRegister",
          }),
          400: errorResponse("Datos inválidos"),
          500: errorResponse("Error al crear caja registradora"),
        },
      },
    },
    "/cash-registers/active": {
      get: {
        tags: ["Cash Registers"],
        summary: "Listar cajas registradoras activas",
        responses: {
          200: successResponse("Cajas registradoras activas obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/CashRegister" },
          }),
          500: errorResponse("Error al obtener cajas activas"),
        },
      },
    },
    "/cash-registers/number/{number}": {
      get: {
        tags: ["Cash Registers"],
        summary: "Obtener caja registradora por número",
        parameters: [strPathParam("number", "Número de la caja")],
        responses: {
          200: successResponse("Caja registradora obtenida correctamente", {
            $ref: "#/components/schemas/CashRegister",
          }),
          500: errorResponse("Error al obtener caja por número"),
        },
      },
    },
    "/cash-registers/{id}": {
      get: {
        tags: ["Cash Registers"],
        summary: "Obtener caja registradora por ID",
        parameters: [intPathParam("id", "ID de la caja registradora")],
        responses: {
          200: successResponse("Caja registradora obtenida correctamente", {
            $ref: "#/components/schemas/CashRegister",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Caja registradora no encontrada"),
          500: errorResponse("Error al obtener caja registradora"),
        },
      },
      put: {
        tags: ["Cash Registers"],
        summary: "Actualizar caja registradora",
        parameters: [intPathParam("id", "ID de la caja registradora")],
        requestBody: requestBody("#/components/schemas/CashRegisterUpdate"),
        responses: {
          200: successResponse("Caja registradora actualizada correctamente", {
            $ref: "#/components/schemas/CashRegister",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Caja registradora no encontrada"),
          500: errorResponse("Error al actualizar caja registradora"),
        },
      },
      delete: {
        tags: ["Cash Registers"],
        summary: "Eliminar caja registradora",
        security: [{ bearerAuth: [] }],
        parameters: [intPathParam("id", "ID de la caja registradora")],
        responses: {
          200: successResponse("Caja registradora eliminada correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Caja registradora no encontrada"),
          500: errorResponse("Error al eliminar caja registradora"),
        },
      },
    },

    "/tables": {
      get: {
        tags: ["Tables"],
        summary: "Listar mesas",
        responses: {
          200: successResponse("Mesas obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Table" },
          }),
          500: errorResponse("Error al obtener mesas"),
        },
      },
      post: {
        tags: ["Tables"],
        summary: "Crear mesa",
        requestBody: requestBody("#/components/schemas/TableInput"),
        responses: {
          201: successResponse("Mesa creada correctamente", {
            $ref: "#/components/schemas/Table",
          }),
          400: errorResponse("Datos inválidos"),
          409: errorResponse("Mesa ya existe"),
          500: errorResponse("Error al crear mesa"),
        },
      },
    },
    "/tables/available": {
      get: {
        tags: ["Tables"],
        summary: "Listar mesas disponibles",
        responses: {
          200: successResponse("Mesas disponibles obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Table" },
          }),
          500: errorResponse("Error al obtener mesas disponibles"),
        },
      },
    },
    "/tables/zone/{zone}": {
      get: {
        tags: ["Tables"],
        summary: "Listar mesas por zona",
        parameters: [strPathParam("zone", "Zona de la mesa")],
        responses: {
          200: successResponse("Mesas de la zona obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Table" },
          }),
          500: errorResponse("Error al obtener mesas por zona"),
        },
      },
    },
    "/tables/status/{status}": {
      get: {
        tags: ["Tables"],
        summary: "Listar mesas por estado",
        parameters: [
          strPathParam("status", "Estado de la mesa", {
            $ref: "#/components/schemas/TableStatus",
          }),
        ],
        responses: {
          200: successResponse("Mesas por estado obtenidas correctamente", {
            type: "array",
            items: { $ref: "#/components/schemas/Table" },
          }),
          400: errorResponse("Estado inválido"),
          500: errorResponse("Error al obtener mesas por estado"),
        },
      },
    },
    "/tables/{id}": {
      get: {
        tags: ["Tables"],
        summary: "Obtener mesa por ID",
        parameters: [
          strPathParam("id", "ID de la mesa", {
            type: "string",
            minLength: 1,
            maxLength: 10,
          }),
        ],
        responses: {
          200: successResponse("Mesa obtenida correctamente", {
            $ref: "#/components/schemas/Table",
          }),
          400: errorResponse("ID inválido"),
          404: errorResponse("Mesa no encontrada"),
          500: errorResponse("Error al obtener mesa"),
        },
      },
      put: {
        tags: ["Tables"],
        summary: "Actualizar mesa",
        parameters: [
          strPathParam("id", "ID de la mesa", {
            type: "string",
            minLength: 1,
            maxLength: 10,
          }),
        ],
        requestBody: requestBody("#/components/schemas/TableUpdate"),
        responses: {
          200: successResponse("Mesa actualizada correctamente", {
            $ref: "#/components/schemas/Table",
          }),
          400: errorResponse("Datos inválidos"),
          404: errorResponse("Mesa no encontrada"),
          500: errorResponse("Error al actualizar mesa"),
        },
      },
      delete: {
        tags: ["Tables"],
        summary: "Eliminar mesa",
        security: [{ bearerAuth: [] }],
        parameters: [
          strPathParam("id", "ID de la mesa", {
            type: "string",
            minLength: 1,
            maxLength: 10,
          }),
        ],
        responses: {
          200: successResponse("Mesa eliminada correctamente"),
          400: errorResponse("ID inválido"),
          401: errorResponse("No autorizado"),
          404: errorResponse("Mesa no encontrada"),
          500: errorResponse("Error al eliminar mesa"),
        },
      },
    },
    "/tables/{id}/status": {
      patch: {
        tags: ["Tables"],
        summary: "Actualizar estado de mesa",
        parameters: [
          strPathParam("id", "ID de la mesa", {
            type: "string",
            minLength: 1,
            maxLength: 10,
          }),
        ],
        requestBody: requestBody("#/components/schemas/TableStatusUpdate"),
        responses: {
          200: successResponse("Estado de mesa actualizado correctamente", {
            $ref: "#/components/schemas/Table",
          }),
          400: errorResponse("ID o estado inválido"),
          404: errorResponse("Mesa no encontrada"),
          500: errorResponse("Error al actualizar estado de mesa"),
        },
      },
    },
  },
};

export const setupSwagger = (app: any) => {
  app.get("/api/docs", (req: any, res: any) => {
    const protocol = req.protocol;
    const host = req.get("host");
    const dynamicDoc = {
      ...swaggerDocument,
      servers: [
        {
          url: `${protocol}://${host}/api`,
          description: "Servidor API",
        },
      ],
    };

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>EstacionCafe API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(dynamicDoc)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    };
  </script>
</body>
</html>
    `.trim());
  });
};
