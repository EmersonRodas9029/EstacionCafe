# EstacionCafé — Plan del nuevo Frontend

> Basado en `api/API_DOCUMENTATION.md` y `api/README.md`. El repo contiene solo la documentación de la API, no su código fuente.

---

## Índice

1. [Análisis de la API](#1-análisis-de-la-api)
2. [Huecos detectados en la API](#2-huecos-detectados-en-la-api)
3. [Listado de vistas](#3-listado-de-vistas)
4. [Stack tecnológico](#4-stack-tecnológico)
5. [Sistema de diseño (paleta)](#5-sistema-de-diseño-paleta)
6. [Arquitectura del proyecto](#6-arquitectura-del-proyecto)
7. [Plan de implementación por fases](#7-plan-de-implementación-por-fases)
8. [Principios y buenas prácticas](#8-principios-y-buenas-prácticas)
9. [Decisiones tomadas](#9-decisiones-tomadas)

---

## 1. Análisis de la API

- **Base URL:** `http://localhost:3484/api`
- **Swagger:** `http://localhost:3484/api/docs`
- **Auth:** JWT por `Authorization: Bearer <token>` o cookie `auth_token`.
- **Roles:** `admin`, `mesero`, `cajero` (`all` = cualquier usuario autenticado).
- **Formato de respuesta:** `{ status, message, data }`. Los errores incluyen `campo` y `error` cuando fallan las validaciones de Zod.
- 13 recursos, unos 80 endpoints.

| Área       | Recursos                                                  | Uso en el frontend          |
| ---------- | --------------------------------------------------------- | --------------------------- |
| Operación  | `tables`, `bills`, `bill-details`, `cash-registers`       | Mesero y caja               |
| Catálogo   | `products`, `product-type`, `ingredient`                  | Admin, y el menú del mesero |
| Inventario | `consumable`, `consumable-type`, `suppliers`, `purchases` | Admin                       |
| Acceso     | `users`, `user-types`, `login` / `logout`                 | Admin y sesión              |

### Cómo se mapea el flujo del mesero

| Concepto                     | Implementación en la API                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| Mesa                         | `tables` — estados `disponible`, `ocupada`, `reservada`, con `zone`                   |
| Varias cuentas por mesa      | Varias `bills` con el mismo `tableId`, cada una con su `customer`                     |
| Orden para llevar            | `bill` sin `tableId`                                                                  |
| Agregar productos            | `POST /bill-details`: lote de líneas, con validación de stock (`type: "stock_error"`) |
| Ver la cuenta                | `GET /bill-details/bill/:billId`                                                      |
| Cerrar la mesa               | `POST /bills/table/:tableId/close`                                                    |
| Cambiar el estado de la mesa | `PATCH /tables/:id/status`                                                            |

### Enums

- **Bill status:** `open`, `closed`, `draft`, `finished`
- **TableStatus:** `disponible`, `ocupada`, `reservada`
- **UnitMeasurement:** `g`, `kg`, `l`, `ml`, `oz`, `lb`, `unit`, `tbsp`, `tsp`, `cup`, `piece`

**Semántica del estado de la bill (decidida, ver sección 9):**

| Estado     | Significado                  |
| ---------- | ---------------------------- |
| `draft`    | Orden en edición, no enviada |
| `open`     | Cuenta activa                |
| `finished` | Orden para llevar entregada  |
| `closed`   | Cuenta cobrada               |

---

## 2. Huecos detectados en la API

✅ **Resueltos en la rama `Christian` (Fase 0b).** La API ahora usa PostgreSQL (Supabase en producción).

| #   | Problema original          | Solución en la API                                                                   |
| --- | -------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Login sin rol ni usuario   | `GET /users/me`; el JWT incluye `userId`, `username` y `role` (de `user_types.role`) |
| 2   | `bill` sin mesero          | `bills.waiter_id`, tomado del token; filtro `GET /bills?mine=true`                   |
| 3   | Sin campo "para llevar"    | `orderType: dine_in \| takeaway` (dine_in exige mesa)                                |
| 4   | No se editaba la cantidad  | `PATCH /bill-details/:id { quantity }`; `POST` suma a la línea existente             |
| 5   | Sin reportes ni paginación | `GET /reports/sales?from&to` y `GET /bills?page&limit` (con `meta.total`)            |
| 6   | Rutas públicas             | Todas exigen JWT salvo login/logout; roles por ruta (403 si no aplica)               |
| 7   | Nombres inconsistentes     | `cashRegisterId` en todos lados; `consumableTypeId`; `active` en update de producto  |
| 8   | Compras sin líneas         | `purchases.details[]` suma stock y actualiza costo                                   |
| 9   | Permisos amplios           | Escrituras de catálogo, inventario, mesas, usuarios: solo `admin`                    |
| 10  | Sin tiempo real            | Sin cambio: el frontend usa polling (10–15 s) en mapa de mesas y cuentas             |
| 11  | Expiración inconsistente   | `JWT_EXPIRES_IN_HOURS` único; `expiresIn` en segundos                                |
| 12  | CORS a `:4321`             | Por defecto `http://localhost:5173`; en dev el proxy de Vite evita CORS              |

**Cambios de contrato a tener en cuenta en el frontend:**

- `POST /bills` → `{ customer, tableId?, orderType? }`; el total ya no se envía.
- Cerrar cuenta: `PUT /bills/:id { status: "closed", cashRegisterId }` o `POST /bills/table/:id/close { cashRegisterId }`.
- `POST /bill-details` → `{ billId, billDetails: [{ productId, quantity }] }`.
- `GET /bill-details/bill/:id` devuelve `billDetailId` y `[]` si no hay líneas.
- Abrir/cerrar cuentas actualiza el estado de la mesa automáticamente.

## 3. Listado de vistas

### 3.1 Compartidas

| ID  | Vista                     | Endpoints                              |
| --- | ------------------------- | -------------------------------------- |
| C1  | Login                     | `POST /users/login`                    |
| C2  | Redirección por rol       | `GET /users/me` (falta, hueco #1)      |
| C3  | Páginas 403 / 404 / error | —                                      |
| C4  | Perfil y logout           | `PUT /users/:id`, `POST /users/logout` |

### 3.2 Mesero (tablet y celular primero)

| ID  | Vista                      | Contenido                                                                                                                                                               | Endpoints                                                                                                  |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| M1  | **Mapa de mesas**          | Cuadrícula agrupada por zona; color e ícono según estado; insignias con el número de cuentas abiertas y el total acumulado; filtros por zona y estado; se refresca sola | `GET /tables`, `GET /tables/zone/:zone`, `GET /tables/status/:status`                                      |
| M2  | **Detalle de mesa**        | Lista de cuentas abiertas (cliente, subtotal, número de items); botones "Nueva cuenta", "Cambiar estado", "Cerrar mesa"                                                 | `GET /bills/table/:tableId`, `POST /bills`, `PATCH /tables/:id/status`, `POST /bills/table/:tableId/close` |
| M3  | **Detalle de cuenta**      | Líneas con cantidad, precio y subtotal; total; eliminar línea; renombrar cliente; mover la cuenta a otra mesa; pedir la cuenta                                          | `GET /bill-details/bill/:billId`, `DELETE /bill-details/:id`, `PUT /bills/:id`                             |
| M4  | **Tomar orden (catálogo)** | Productos activos con pestañas por categoría y búsqueda; carrito local con +/−; "Enviar" manda el lote; aviso cuando falta stock                                        | `GET /products/active`, `GET /product-type`, `POST /bill-details`                                          |
| M5  | **Para llevar: lista**     | Órdenes sin mesa, en tabs (en preparación / listas / entregadas); botón "Nueva orden"                                                                                   | `GET /bills` (filtrado), `POST /bills`                                                                     |
| M6  | **Para llevar: detalle**   | Reutiliza M3 y M4; marcar como entregada                                                                                                                                | `PUT /bills/:id`                                                                                           |
| M7  | **Cobro / cierre**         | Resumen, selección de caja activa, cerrar cuenta                                                                                                                        | `GET /cash-registers/active`, `PUT /bills/:id`                                                             |
| M8  | **Pre-cuenta / ticket**    | Vista imprimible (`@media print`)                                                                                                                                       | `GET /bill-details/bill/:billId`                                                                           |
| M9  | **Historial del turno**    | Cuentas cerradas del día                                                                                                                                                | `GET /bills/date-range`                                                                                    |

> **Decidido:** el rol `cajero` usa el layout del mesero con acceso a M7, M8, M9 y A2, sin vistas nuevas.

### 3.3 Admin (escritorio primero)

| ID  | Vista                               | Contenido                                                                                                                                         | Endpoints                                                                                                  |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A1  | **Dashboard**                       | KPIs: ventas de hoy, de la semana y del mes, ticket promedio, mesas ocupadas, órdenes abiertas, top productos, margen, consumibles con stock bajo | `GET /bills/date-range`, `GET /bill-details`, `GET /tables`, `GET /consumable`                             |
| A2  | **Facturas: lista**                 | Tabla filtrable por fecha, cliente, mesa y estado; exportar a CSV                                                                                 | `GET /bills`, `GET /bills/date-range`, `GET /bills/customer/:customer`                                     |
| A3  | **Factura: detalle**                | Líneas; editar o anular                                                                                                                           | `GET /bills/:id`, `GET /bill-details/bill/:billId`, `PUT /bills/:id`, `DELETE /bills/:id`                  |
| A4  | **Reportes**                        | Ventas por rango, producto y categoría; margen (precio − costo); compras vs ventas                                                                | Calculado en el cliente hasta que exista `/reports` (hueco #5)                                             |
| A5  | **Productos: lista**                | Tabla con precio, costo, margen %, categoría y estado activo                                                                                      | `GET /products`                                                                                            |
| A6  | **Producto: crear/editar + receta** | Formulario (validar precio > costo); sección de ingredientes (consumible + cantidad)                                                              | `POST /products`, `PUT /products/:id`, `GET /ingredient/product/:productId`, `POST/PUT/DELETE /ingredient` |
| A7  | **Categorías de producto**          | CRUD en un modal                                                                                                                                  | `/product-type`                                                                                            |
| A8  | **Inventario: consumibles**         | Tabla con stock, unidad, costo, proveedor y tipo; alerta de stock bajo; ajuste de stock                                                           | `/consumable`, `GET /consumable/supplier/:supplierId`                                                      |
| A9  | **Tipos de consumible**             | CRUD en un modal                                                                                                                                  | `/consumable-type`                                                                                         |
| A10 | **Proveedores: lista**              | Activos/inactivos; validación de teléfono SV (`^(\+503)?[2-9]\d{3}-?\d{4}$`)                                                                      | `GET /suppliers`, `GET /suppliers/active`, `POST/PUT/DELETE /suppliers`                                    |
| A11 | **Proveedor: detalle**              | Datos, sus consumibles y su historial de compras                                                                                                  | `GET /suppliers/:id`, `GET /consumable/supplier/:id`, `GET /purchases/supplier/:id`                        |
| A12 | **Compras**                         | Lista, registro de compra, detalle                                                                                                                | `/purchases`                                                                                               |
| A13 | **Mesas y zonas**                   | CRUD agrupado por zona; `tableId` en mayúsculas (`[A-Z0-9]+`)                                                                                     | `/tables`                                                                                                  |
| A14 | **Cajas registradoras**             | CRUD y activar/desactivar                                                                                                                         | `/cash-registers`                                                                                          |
| A15 | **Usuarios**                        | CRUD y asignación de rol                                                                                                                          | `/users`, `GET /users/type/:typeId`                                                                        |
| A16 | **Roles**                           | CRUD con `permissionLevel` de 0 a 10                                                                                                              | `/user-types`                                                                                              |

**Total:** 4 vistas compartidas, 9 de mesero y 16 de admin. A7, A9 y A16 son modales; M6 reutiliza M3 y M4.

### 3.4 Mapa de rutas

```
/login
/mesero
  /mesas                     M1
  /mesas/:tableId            M2
  /cuentas/:billId           M3
  /cuentas/:billId/orden     M4
  /cuentas/:billId/cobro     M7
  /cuentas/:billId/ticket    M8
  /para-llevar               M5
  /para-llevar/:billId       M6
  /historial                 M9
/admin
  /                          A1
  /facturas                  A2
  /facturas/:billId          A3
  /reportes                  A4
  /productos                 A5 (+A7 modal)
  /productos/nuevo           A6
  /productos/:id             A6
  /inventario                A8 (+A9 modal)
  /proveedores               A10
  /proveedores/:id           A11
  /compras                   A12
  /mesas                     A13
  /cajas                     A14
  /usuarios                  A15 (+A16 modal)
/perfil                      C4
```

---

## 4. Stack tecnológico

Criterios: fácil de mantener, tipado de extremo a extremo y la menor cantidad de piezas posible.

| Capa                | Elección                                                                      | Motivo                                                                                    |
| ------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Build               | **Vite + React 19 + TypeScript (strict)**                                     | App interna sin necesidad de SEO; una SPA es más simple que Next.js                       |
| Routing             | **React Router 7 (modo data)**                                                | Rutas protegidas por rol, loaders y lazy loading                                          |
| Estado del servidor | **TanStack Query**                                                            | Caché, refetch, polling del mapa de mesas, optimistic updates                             |
| Cliente API         | **orval** generado desde el Swagger                                           | Tipos, hooks de Query y schemas Zod generados automáticamente; cero tipos escritos a mano |
| Formularios         | **React Hook Form + Zod**                                                     | Las mismas reglas que el backend, que también usa Zod                                     |
| UI                  | **Tailwind CSS v4 + shadcn/ui** (Radix)                                       | Accesible; el código de los componentes vive en el repo y se puede modificar              |
| Tablas              | **TanStack Table** (shadcn DataTable)                                         | Orden, filtros y paginación                                                               |
| Gráficas            | **Recharts** (shadcn charts)                                                  | Integradas con los tokens de diseño                                                       |
| Estado local        | **Zustand**, solo para sesión y carrito                                       | Liviano; no duplica el estado del servidor                                                |
| Tests unitarios     | **Vitest + Testing Library**                                                  | Rápidos y nativos de Vite                                                                 |
| Mock de la API      | **MSW**                                                                       | Permite desarrollar mientras se resuelven los huecos de la API                            |
| Tests e2e           | **Playwright**                                                                | Flujos críticos en CI                                                                     |
| Calidad             | oxlint, Prettier, Husky + lint-staged, commits convencionales, GitHub Actions | CI desde el día 1                                                                         |
| Extra               | **vite-plugin-pwa**                                                           | Tablets de meseros con pantalla completa y menú en caché                                  |

---

## 5. Sistema de diseño (paleta)

| Token       | Color               | Uso                                                                |
| ----------- | ------------------- | ------------------------------------------------------------------ |
| `--primary` | `#3d1c42` (ciruela) | Sidebar, header, texto principal, botones primarios                |
| `--accent`  | `#d5682a` (naranja) | Acciones clave (Enviar orden, Cobrar), insignias, estado "ocupada" |
| `--surface` | `#d5be9a` (latte)   | Tarjetas, mesas libres; aclarado (~20%) como fondo general         |

### Contraste (WCAG)

| Combinación               | Ratio   | Resultado                                 |
| ------------------------- | ------- | ----------------------------------------- |
| Blanco sobre `#3d1c42`    | ~14.7:1 | ✅ AA/AAA                                 |
| `#3d1c42` sobre `#d5be9a` | ~8:1    | ✅ AA/AAA                                 |
| Blanco sobre `#d5682a`    | ~3.6:1  | ⚠️ Solo texto grande o en negrita (≥18px) |

Para botones naranjas con texto normal, agregar un tono `--accent-strong` más oscuro (~`#b5531c`).

### Estados de mesa

Cada estado lleva color, ícono y etiqueta, nunca solo color:

| Estado     | Color               | Ícono |
| ---------- | ------------------- | ----- |
| Disponible | Latte / verde suave | ✓     |
| Ocupada    | Naranja             | 🍽     |
| Reservada  | Ciruela             | 🕒    |

### Ejemplo de tokens (Tailwind v4)

```css
@theme {
  --color-primary: #3d1c42;
  --color-accent: #d5682a;
  --color-accent-strong: #b5531c;
  --color-surface: #d5be9a;
  --color-surface-soft: #f5efe5;
}
```

---

## 6. Arquitectura del proyecto

Organización por features: cada dominio tiene sus componentes, hooks, rutas y schemas.

```
frontend/
  src/
    app/
      providers.tsx        # QueryClient, Router, Toaster
      router.tsx           # rutas + guards por rol
      layouts/             # MeseroLayout, AdminLayout, AuthLayout
    api/
      generated/           # salida de orval (no editar)
      client.ts            # fetch + auth + desempaquetar { status, data } + errores
    features/
      auth/
      tables/
      bills/
      orders/              # catálogo + carrito
      takeaway/
      products/
      inventory/
      suppliers/
      purchases/
      cash-registers/
      users/
      dashboard/
      reports/
        └─ components/ hooks/ routes/ schemas.ts
    components/ui/         # shadcn
    lib/
      format.ts            # moneda USD, fechas America/El_Salvador
      utils.ts
    styles/tokens.css
  tests/e2e/               # Playwright
  orval.config.ts
```

### Flujo de datos

```
Swagger ──orval──▶ tipos + hooks + Zod ──▶ features/*/hooks ──▶ componentes
                                             │
                               TanStack Query (caché de servidor)
                               Zustand (sesión, carrito)
```

---

## 7. Plan de implementación por fases

| Fase                               | Entregable                                                              | Detalle                                                                                                                                                           | Criterio de "hecho"                               |
| ---------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **0. Base**                        | Proyecto andando                                                        | Vite+TS, oxlint/Prettier, Husky, CI, Tailwind con tokens, shadcn, orval contra el Swagger, cliente fetch con manejo del formato `{status,data}` y de `campo`, MSW | CI verde; un hook generado consume `/products`    |
| **0b. API (bloquea la Fase 3)** ✅ | Huecos #1–#3 resueltos (obligatorios); #4–#7 y `minStock` en lo posible | `/users/me`, `waiterId`, `orderType` y `minStock` en `consumable`; después proteger rutas y `PATCH bill-details`                                                  | Swagger actualizado y orval regenerado            |
| **1. Auth y shell**                | C1–C4                                                                   | Login, guards por rol, layouts mesero/admin, logout automático en 401, error boundaries                                                                           | Cada rol aterriza en su panel                     |
| **2. Design system**               | Componentes base                                                        | Button, Input, TableCard, StatusBadge, Cart, DataTable, ConfirmDialog, toasts, skeletons, estados vacíos                                                          | Componentes revisados y usados en las vistas      |
| **3. Mesero: núcleo**              | M1–M4                                                                   | Mapa con polling, mesa con varias cuentas, toma de orden con carrito y manejo de `stock_error`                                                                    | e2e: abrir mesa → 2 cuentas → ordenar → ver total |
| **4. Mesero: para llevar y cobro** | M5–M9                                                                   | Órdenes sin mesa, cobro con caja, cierre de mesa, ticket imprimible, historial                                                                                    | e2e completo de una orden para llevar             |
| **5. Admin: catálogo**             | A5–A7                                                                   | Productos con receta integrada, categorías                                                                                                                        | CRUD completo; precio > costo validado en la UI   |
| **6. Admin: operación y accesos**  | A2, A3, A13–A16                                                         | Facturas, mesas/zonas, cajas, usuarios, roles                                                                                                                     | Permisos verificados por rol                      |
| **7. Admin: inventario y compras** | A8–A12                                                                  | Consumibles, tipos, proveedores con detalle, compras                                                                                                              | Alertas de stock bajo funcionando                 |
| **8. Dashboard y reportes**        | A1, A4                                                                  | KPIs, gráficas, export CSV                                                                                                                                        | Cifras cuadran con las facturas                   |
| **9. Pulido y release**            | Producción                                                              | Auditoría a11y (axe), Lighthouse, PWA, lazy loading por ruta, Dockerfile del frontend, deploy                                                                     | Lighthouse > 90; e2e de los flujos críticos en CI |

**MVP operable para meseros:** fases 0 → 1 → 2 → 3 → 4.
**Después:** 5 → 6 → 7 → 8 → 9. Catálogo, mesas y usuarios es lo mínimo que el admin necesita para operar.

### Checklist por fase

- [x] Fase 0 — Base (pendiente: correr `pnpm api:generate` cuando la API esté disponible)
- [x] Fase 0b — Ajustes de la API
- [x] Fase 1 — Auth y shell
- [x] Fase 2 — Design system (base; se amplía por vista)
- [x] Fase 3 — Mesero: núcleo
- [x] Fase 4 — Mesero: para llevar y cobro
- [x] Fase 5 — Admin: catálogo
- [x] Fase 6 — Admin: operación y accesos
- [ ] Fase 7 — Admin: inventario y compras
- [ ] Fase 8 — Dashboard y reportes
- [ ] Fase 9 — Pulido y release

---

## 8. Principios y buenas prácticas

- **Una sola fuente de verdad:** los tipos salen del Swagger; el estado del servidor vive solo en TanStack Query; nada se copia a Zustand.
- **Organización por features:** cada dominio es autocontenido; nada de carpetas globales gigantes.
- **Separar datos y UI:** la lógica va en hooks (`useTableBills`, `useSendOrder`) y los componentes reciben props.
- **Optimistic updates** en el carrito y el estado de la mesa, con rollback si falla.
- **Validación doble:** Zod en el cliente con las mismas reglas del backend, y se muestra el `campo` que devuelve la API.
- **Accesibilidad:** áreas táctiles de 44px o más para meseros, foco visible, estados con ícono y texto, contraste AA.
- **Formatos centralizados:** moneda (USD) y fechas (`America/El_Salvador`) en `lib/format.ts`.
- **Manejo de errores uniforme:** el interceptor normaliza los errores; toasts para errores de acción; error boundaries por ruta.
- **Rendimiento:** lazy loading por ruta; los paneles de admin y mesero en chunks separados.
- **Tests enfocados en flujos críticos:** orden, cobro, cierre de mesa, CRUD de productos.
- **Git:** commits convencionales, PRs pequeños por vista, CI obligatoria antes del merge.

---

## 9. Decisiones tomadas

| #   | Tema                   | Decisión                                                                                                                  | Consecuencia                                                                                             |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | Estados de la bill     | **4 estados:** `draft` = orden en edición, `open` = cuenta activa, `finished` = para llevar entregada, `closed` = cobrada | M5 usa tabs por estado; M7 pasa la cuenta a `closed`; M6 la marca como `finished`                        |
| 2   | Huecos #1–#3 de la API | **Se arreglan antes de la Fase 3** (dentro de la Fase 0b)                                                                 | `/users/me`, `waiterId` y `orderType` son requisito para empezar la Fase 3; M1 puede filtrar "mis mesas" |
| 3   | Rol `cajero`           | **Comparte vistas con el mesero**                                                                                         | El cajero usa el layout del mesero con acceso a M7, M8, M9 y A2; no hay vistas nuevas                    |
| 4   | Stock bajo             | **Nuevo campo `minStock` en `consumable`**                                                                                | Se edita en A8; la alerta aparece en A1 y A8 cuando `quantity <= minStock`; se agrega a la Fase 0b       |
