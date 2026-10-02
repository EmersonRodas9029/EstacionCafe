# EstacionCafe API

API REST para la gestión de una cafetería. Está construida con TypeScript,
Express, TypeORM y PostgreSQL sobre Supabase.

## Características

- Arquitectura por capas: dominio, aplicación, controladores e infraestructura.
- CRUD de productos, tipos de producto, ingredientes, consumibles, proveedores,
  compras, mesas, usuarios, tipos de usuario, facturas y detalles de factura.
- Validación de entradas con Zod.
- Autenticación propia con JWT y bcrypt.
- Conexión PostgreSQL mediante TypeORM y Supabase.
- Documentación interactiva con Swagger.
- Pruebas unitarias con Jest.
- Limpieza programada de facturas en estado `draft`.

## Requisitos

- Node.js 18 o superior.
- Un proyecto de Supabase con acceso a PostgreSQL.
- La base de datos creada con [supabase_database.sql.txt](supabase_database.sql.txt).

## Instalación

```bash
npm install
```

Copia `.env.example` como `api/.env` y completa las variables:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-clave-privada-de-servidor
SUPABASE_DB_URL=postgresql://postgres:tu-password@db.tu-proyecto.supabase.co:5432/postgres
DB_SSL=true
DB_LOGGING=false
NODE_ENV=development
JWT_SECRET=una-clave-larga-y-aleatoria
SECURITY_MODE=develop
```

No subas `api/.env` al repositorio. La clave de servicio de Supabase es privada
y solo debe utilizarse en el backend.

## Base de datos

El esquema inicial está en `supabase_database.sql.txt`. Ejecútalo desde el SQL
Editor de Supabase antes de iniciar la API.

TypeORM utiliza `synchronize: false`, por lo que no modifica automáticamente el
esquema en producción. Los comandos de migración apuntan a
`api/infrastructure/db/Connection.ts`:

```bash
npm run migration:show
npm run migration:run
npm run migration:generate -- api/infrastructure/db/migrations/NombreMigracion
npm run migration:revert
```

Para cargar datos demo en la base de datos:

```bash
npm run seed:run
npm run seed:revert
```

El seeder es idempotente y crea productos, ingredientes, consumibles,
proveedores, mesas, usuarios, compras, facturas y detalles de factura. El
usuario demo es `admin.demo` con contraseña `AdminDemo123!`; cambia o elimina
estas credenciales antes de usar la aplicación en producción.

## Ejecución

```bash
npm run build
npm start
```

Para ejecutar la versión compilada sin `nodemon`:

```bash
npm run start:prod
```

La API queda disponible en `http://localhost:3000` o en el puerto definido por
`PORT`.

## Endpoints principales

La base URL de los recursos es `http://localhost:3000/api`.

### Estado y documentación

```http
GET /                  # Estado básico de la API
GET /health            # Estado de la conexión a la base de datos
GET /api/docs          # Swagger UI
```

### Productos e ingredientes

```http
GET    /api/products
GET    /api/products/active
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/product-type
GET    /api/ingredient
GET    /api/ingredient/product/:productId
```

### Facturación

```http
GET    /api/bills
GET    /api/bills/customer/:customer
GET    /api/bills/table/:tableId
POST   /api/bills/table/:tableId/close
GET    /api/bills/date-range
GET    /api/bills/:id
POST   /api/bills
PUT    /api/bills/:id
DELETE /api/bills/:id

GET    /api/bill-details
GET    /api/bill-details/bill/:billId
POST   /api/bill-details
DELETE /api/bill-details/:id
```

### Usuarios y seguridad

```http
POST   /api/users/login
POST   /api/users/logout
GET    /api/users
GET    /api/users/type/:typeId
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/user-types
POST   /api/user-types
PUT    /api/user-types/:id
DELETE /api/user-types/:id
```

### Inventario, compras y mesas

```http
GET|POST|PUT|DELETE /api/consumable
GET|POST|PUT|DELETE /api/consumable-type
GET|POST|PUT|DELETE /api/suppliers
GET|POST|PUT|DELETE /api/purchases
GET|POST|PUT|PATCH|DELETE /api/tables
GET|POST|PUT|DELETE /api/cash-registers
```

Los detalles de cada operación, parámetros y cuerpos de petición están
disponibles en Swagger.

Las operaciones `DELETE` y las rutas administrativas requieren autenticación
Bearer cuando `SECURITY_MODE` no está configurado como `develop`.

## Estructura

```text
api/
├── application/
│   ├── DTOs/
│   ├── Routes/
│   ├── services/
│   └── validations/
├── controller/
├── core/
│   ├── entities/
│   ├── enums/
│   └── interfaces/
├── infrastructure/
│   ├── db/
│   ├── jobs/
│   ├── security/
│   ├── supabase/
│   └── swagger/
└── server.ts
```

## Pruebas

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:verbose
```

La configuración de Jest busca las pruebas dentro de `api`.

## Licencia

ISC. Autor: Christian Carcamo.
