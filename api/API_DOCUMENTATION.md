# EstacionCafé API — Documentación

- **Base URL:** `http://localhost:3484/api`
- **Swagger UI:** `http://localhost:3484/api/docs`
- **OpenAPI JSON:** `http://localhost:3484/api/docs.json` (de aquí orval genera el cliente del frontend)
- **Health:** `GET http://localhost:3484/health` (fuera de `/api`)

La referencia completa de cada campo está en Swagger. Este documento resume las convenciones y los flujos.

---

## Convenciones

### Formato de respuesta

```json
{ "status": "success", "message": "…", "data": { } }
```

Con paginación (`GET /bills?page=…`) se agrega `meta`:

```json
{ "status": "success", "message": "…", "data": [], "meta": { "page": 1, "limit": 20, "total": 57 } }
```

Errores:

```json
{ "status": "error", "message": "Datos inválidos: …", "campo": ["tableId"], "error": "custom", "type": "stock_error" }
```

`campo`, `error` y `type` solo aparecen cuando aplican. `type: "stock_error"` indica stock insuficiente.

### Códigos HTTP

| Código | Uso |
|---|---|
| 200 / 201 / 202 | OK / creado / detalle eliminado |
| 400 | Validación o regla de negocio (incluye `stock_error`) |
| 401 | Sin token, token inválido/expirado o credenciales incorrectas |
| 403 | Rol sin permiso |
| 404 | Recurso inexistente |
| 409 | Conflicto: duplicado, cuenta cerrada, stock de compra ya consumido |
| 500 | Error interno |

### Fechas y dinero

- Fechas en ISO 8601 y guardadas como `timestamptz`. El cliente muestra en `America/El_Salvador`.
- Montos en USD con 2 decimales. Los totales de cuentas y compras con detalle **los calcula el servidor**.

---

## Autenticación y roles

1. `POST /users/login` con `{ "username", "password" }` → `data: { token, expiresIn }` (`expiresIn` en segundos). También fija la cookie httpOnly `auth_token`.
2. Enviar `Authorization: Bearer <token>` (o la cookie) en el resto de rutas.
3. `GET /users/me` → usuario actual con `role`.
4. `POST /users/logout` borra la cookie.

El rol sale de `user_types.role`: `admin`, `mesero` o `cajero`.

| Grupo | Lectura | Escritura |
|---|---|---|
| Productos, categorías | todos | admin |
| Mesas | todos | admin (crear/editar/eliminar); `PATCH /tables/{id}/status`: todos |
| Cuentas (`/bills`) | todos | admin, mesero, cajero; `DELETE`: admin |
| Detalles (`/bill-details`) | por cuenta: todos; listado global: admin | admin, mesero, cajero |
| Cajas | activas/por id/por número: todos; listado completo: admin | admin |
| Usuarios, tipos de usuario | admin | admin |
| Consumibles, tipos, ingredientes, proveedores, compras | admin | admin |
| Reportes | admin | — |

Usuarios demo del seeder (`npm run seed:run`): `admin.demo`, `mesero.demo`, `cajero.demo` con contraseña `AdminDemo123!`.

---

## Enums

| Enum | Valores |
|---|---|
| Rol | `admin`, `mesero`, `cajero` |
| Estado de cuenta | `draft` (en edición), `open` (activa), `finished` (para llevar entregada), `closed` (cobrada), `void` (anulada por un admin) |
| Tipo de orden | `dine_in` (en mesa, requiere `tableId`), `takeaway` (sin mesa) |
| Estado de mesa | `disponible`, `ocupada`, `reservada` |
| Unidad | `g`, `kg`, `l`, `ml`, `oz`, `lb`, `unit`, `tbsp`, `tsp`, `cup`, `piece` |

---

## Flujo del mesero

### 1. Mesas

- `GET /tables` (incluye `bills`), `/tables/available`, `/tables/zone/{zone}`, `/tables/status/{status}`, `/tables/{id}`.
- Abrir una cuenta en mesa la marca `ocupada`; cerrar la última cuenta activa la deja `disponible`.

### 2. Abrir cuenta

`POST /bills`

```json
{ "customer": "Cuenta 1", "tableId": "M1" }
```

- Sin `orderType`: con `tableId` → `dine_in`; sin `tableId` → `takeaway`.
- `waiterId` se toma del token. `status` por defecto `open`. `total` inicia en 0.
- Varias cuentas en la misma mesa = varias `bills` con el mismo `tableId`.

### 3. Agregar productos

`POST /bill-details`

```json
{ "billId": 12, "billDetails": [ { "productId": 2, "quantity": 2 } ] }
```

- Si el producto ya está en la cuenta se suma a esa línea.
- El servidor fija `unitPrice` (precio actual), calcula `subTotal`, descuenta stock según la receta y recalcula `bills.total`, todo en una transacción.
- Errores: producto inexistente o inactivo (400), stock insuficiente (400, `type: "stock_error"`), cuenta no `open`/`draft` (409).

### 4. Ver y editar líneas

- `GET /bill-details/bill/{billId}` → `[{ billDetailId, productId, name, quantity, price, subTotal }]` (`[]` si no hay líneas).
- `PATCH /bill-details/{id}` con `{ "quantity": 3 }` → ajusta stock por la diferencia.
- `DELETE /bill-details/{id}` → devuelve stock (respuesta 202).

### 5. Cobrar

- Una cuenta: `PUT /bills/{id}` con `{ "status": "closed", "cashRegisterId": 1 }`. Cerrar sin caja → 400.
- Toda la mesa: `POST /bills/table/{tableId}/close` con `{ "cashRegisterId": 1 }` → `data: { updated }`.
- Cajas disponibles: `GET /cash-registers/active`.

### 6. Otras operaciones

- Mover de mesa: `PUT /bills/{id}` con `{ "tableId": "M2" }`.
- `PUT /bills/{id}` es estricto: solo acepta `customer`, `tableId`, `status`, `cashRegisterId`, `date`. **No acepta `total`.**
- Para llevar: `POST /bills` con `{ "customer": "Ana" }` y al entregar `PUT` con `status: "finished"`.

### Listado de cuentas

`GET /bills` con filtros opcionales:

| Query | Descripción |
|---|---|
| `status` | Estado |
| `orderType` | `dine_in` / `takeaway` |
| `tableId` | Mesa |
| `waiterId` | Mesero |
| `mine=true` | Solo las del usuario del token |
| `from`, `to` | Rango de fechas (ISO) |
| `page`, `limit` | Paginación (limit por defecto 20, máximo 200) |

Cada cuenta trae `waiter` (sin contraseña), `table` y `cashRegister`.

También existen `GET /bills/{id}`, `/bills/table/{tableId}`, `/bills/customer/{customer}` y `/bills/date-range?startDate&endDate`.

- `POST /bills/{id}/void` (admin) anula: la factura pasa a `void`, conserva sus líneas y deja de contar como venta. Si estaba en curso devuelve el stock y libera la mesa; si ya se cobró no devuelve stock. Una factura anulada no se modifica (409).
- `DELETE /bills/{id}` (admin) borra solo cuentas `open`/`draft` y devuelve su stock; las cobradas responden 409 (se anulan).
- `PUT` no acepta `status: "void"` (400).

Un job elimina cada 10 min los `draft` **sin productos** con más de 2 h.

---

## Administración

### Productos y recetas

- `POST /products` `{ name, description, price, cost, productTypeId }`; `price` debe ser mayor a `cost`.
- `PUT /products/{id}` acepta los mismos campos (número o string) y `active`; valida precio > costo contra el resultado.
- `DELETE /products/{id}` desactiva (baja lógica).
- Categorías: `/product-type`. `DELETE` responde 409 si la categoría aún tiene productos.
- Receta: `/ingredient` `{ name, quantity, productId, consumableId }` y `GET /ingredient/product/{productId}`.

### Inventario

- `/consumable` `{ supplierId, name, consumableTypeId, quantity, unitMeasurement, cost, minStock }`.
- El listado incluye `lowStock` (`quantity <= minStock`).
- `GET /consumable/low-stock` → consumibles activos con stock bajo.
- `DELETE` desactiva. Tipos: `/consumable-type`.

### Compras

`POST /purchases`

```json
{
  "date": "2026-10-01T15:00:00Z",
  "supplierId": 1,
  "cashRegisterId": 1,
  "details": [ { "consumableId": 3, "quantity": 1000, "unitCost": 0.08 } ]
}
```

- Con `details`: suma stock, actualiza `cost` del consumible y calcula `total`.
- Sin `details`: enviar `total` (gasto sin inventario). No se aceptan ambos.
- `GET /purchases/{id}` incluye `details` con su `consumable`.
- `PUT` solo cambia datos generales (`total` solo sin detalles).
- `DELETE` revierte el stock; 409 si ya se consumió.

### Mesas, cajas, usuarios

- Mesas: `POST /tables` `{ tableId (A-Z0-9), zone, status? }` (409 si existe).
- Cajas: `/cash-registers` `{ number, active }`; `number` único (409); `DELETE` desactiva.
- Usuarios: `/users` `{ username, password, email, typeId }`; las respuestas nunca incluyen la contraseña; `DELETE` desactiva y `PUT` con `active: true` reactiva. `username` único (409) y `typeId` debe existir (400). Un admin no puede desactivarse ni quitarse el rol de admin (409).
- Tipos de usuario: `/user-types` `{ name, permissionLevel (0–10), role }`. `DELETE` responde 409 si tiene usuarios; no se puede quitar `role: admin` al tipo del propio usuario.

### Reportes

`GET /reports/sales?from=2026-10-01&to=2026-10-31&top=10`

Cuenta como venta: cuentas `closed` o `finished` en el rango.

```json
{
  "range": { "from": "…", "to": "…" },
  "summary": { "totalSales": 0, "billsCount": 0, "averageTicket": 0, "costOfGoods": 0, "grossProfit": 0, "purchasesTotal": 0 },
  "byDay": [ { "date": "2026-10-01", "total": 0, "bills": 0 } ],
  "topProducts": [ { "productId": 1, "name": "…", "quantity": 0, "total": 0 } ],
  "byProductType": [ { "productTypeId": 1, "name": "…", "quantity": 0, "total": 0 } ],
  "byWaiter": [ { "waiterId": 1, "username": "…", "bills": 0, "total": 0 } ],
  "byOrderType": [ { "orderType": "dine_in", "bills": 0, "total": 0 } ]
}
```

`byDay` agrupa por día en `America/El_Salvador`.

---

## Resumen de endpoints

| Método | Ruta | Roles |
|---|---|---|
| POST | `/users/login`, `/users/logout` | pública |
| GET | `/users/me` | todos |
| GET/POST | `/users` | admin |
| GET | `/users/type/{typeId}` | admin |
| GET/PUT/DELETE | `/users/{id}` | admin |
| GET/POST | `/user-types` | admin |
| GET/PUT/DELETE | `/user-types/{id}` | admin |
| GET | `/products`, `/products/active`, `/products/{id}` | todos |
| POST/PUT/DELETE | `/products`, `/products/{id}` | admin |
| GET | `/product-type`, `/product-type/{id}` | todos |
| POST/PUT/DELETE | `/product-type`, `/product-type/{id}` | admin |
| GET | `/bills`, `/bills/{id}`, `/bills/date-range`, `/bills/customer/{c}`, `/bills/table/{t}` | todos |
| POST | `/bills`, `/bills/table/{t}/close` | admin, mesero, cajero |
| PUT | `/bills/{id}` | admin, mesero, cajero |
| POST | `/bills/{id}/void` | admin |
| DELETE | `/bills/{id}` | admin |
| GET | `/bill-details` | admin |
| GET | `/bill-details/bill/{billId}` | todos |
| POST/PATCH/DELETE | `/bill-details`, `/bill-details/{id}` | admin, mesero, cajero |
| GET | `/tables`, `/tables/available`, `/tables/zone/{z}`, `/tables/status/{s}`, `/tables/{id}` | todos |
| PATCH | `/tables/{id}/status` | admin, mesero, cajero |
| POST/PUT/DELETE | `/tables`, `/tables/{id}` | admin |
| GET | `/cash-registers` | admin |
| GET | `/cash-registers/active`, `/cash-registers/number/{n}`, `/cash-registers/{id}` | todos |
| POST/PUT/DELETE | `/cash-registers`, `/cash-registers/{id}` | admin |
| * | `/consumable` (+ `/low-stock`, `/supplier/{id}`, `/{id}`) | admin |
| * | `/consumable-type`, `/ingredient` (+ `/product/{id}`), `/suppliers` (+ `/active`), `/purchases` (+ `/supplier/{id}`) | admin |
| GET | `/reports/sales` | admin |
