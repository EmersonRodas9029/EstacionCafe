# EstacionCafé — API

API REST con arquitectura por capas: entidades (`core/`), servicios y validaciones (`application/`), controladores (`controller/`) e infraestructura (`infrastructure/`).

## Requisitos

- Node.js 20+ (recomendado 22)
- Docker (Postgres local) o un proyecto de Supabase

## Puesta en marcha

```bash
cp .env.example .env
npm install
npm run db:up            # Postgres 17 en Docker (puerto 5432)
npm run migration:run
npm run seed:run
npm run dev              # recarga automática
```

- API: `http://localhost:3484/api`
- Swagger: `http://localhost:3484/api/docs` · JSON: `/api/docs.json`
- Salud: `http://localhost:3484/health`

Usuarios demo (contraseña `AdminDemo123!`): `admin.demo`, `mesero.demo`, `cajero.demo`.

Para usar Supabase define `DATABASE_URL` y `DB_SSL=true` en `.env` (tiene prioridad sobre `DB_*`).

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor con recarga (ts-node) |
| `npm run build` / `npm start` | Compila a `dist/` / ejecuta compilado |
| `npm run start:prod` | Migraciones pendientes + servidor compilado (Docker) |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Pruebas unitarias (sin BD) |
| `npm run test:int` | Pruebas de integración contra Postgres (crea `estacioncafe_test`) |
| `npm run migration:generate -- infrastructure/db/migrations/Nombre` | Genera migración desde las entidades |
| `npm run migration:run` · `migration:revert` | Aplica / revierte |
| `npm run seed:run` · `seed:revert` | Datos demo |

## Autenticación y roles

- `POST /api/users/login` devuelve `{ token, expiresIn }` y la cookie `auth_token`.
- Todas las demás rutas exigen `Authorization: Bearer <token>` (o la cookie).
- El rol sale de `user_types.role`: `admin`, `mesero`, `cajero`.
- `GET /api/users/me` devuelve el usuario autenticado con su rol.

| Recurso | Lectura | Escritura |
|---|---|---|
| Productos, categorías, mesas, cajas activas | todos | admin (mesas: cambiar estado = todos) |
| Cuentas y detalles | todos | todos (anular cuenta = admin) |
| Inventario, proveedores, compras, ingredientes | admin | admin |
| Usuarios, tipos de usuario, reportes | admin | admin |

## Reglas de negocio clave

- **Cuentas:** `orderType` `dine_in` (requiere mesa) o `takeaway` (sin mesa). El mesero se toma del token. Abrir una cuenta ocupa la mesa; cerrar la última cuenta activa la libera. Cerrar requiere `cashRegisterId`.
- **Estados:** `draft` orden en edición · `open` cuenta activa · `finished` para llevar entregada · `closed` cobrada.
- **Detalles:** se envía `productId` + `quantity`; precio y total los calcula el servidor. Agregar el mismo producto suma a la línea. Cada cambio ajusta el stock según la receta (ingredientes) dentro de una transacción; si falta stock responde `400` con `type: "stock_error"`.
- **Compras:** con `details` suman stock y actualizan el costo del consumible.
- **Stock bajo:** `quantity <= minStock` (`GET /api/consumable/low-stock`).
- **Drafts abandonados:** un job borra cada 10 min los drafts vacíos con más de 2 h.

Detalle de cada endpoint: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).
