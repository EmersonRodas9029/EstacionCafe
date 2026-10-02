# EstacionCafé

Sistema de gestión de restaurante/cafetería: meseros (mesas, cuentas, órdenes para llevar) y administración (catálogo, inventario, compras, usuarios, reportes).

| Carpeta | Contenido | Stack |
|---|---|---|
| [`api/`](./api) | API REST | Node 22 · Express 5 · TypeORM · PostgreSQL (Supabase) · Zod · JWT |
| [`frontend/`](./frontend) | SPA | React 19 · Vite · TypeScript · TanStack Query · Tailwind v4 |

## Desarrollo local

```bash
# 1. API + base de datos
cd api
cp .env.example .env
npm install
npm run db:up          # Postgres en Docker
npm run migration:run
npm run seed:run       # usuarios demo: admin.demo / mesero.demo / cajero.demo (AdminDemo123!)
npm run dev            # http://localhost:3484/api  ·  docs: /api/docs

# 2. Frontend (otra terminal)
cd frontend
cp .env.example .env
pnpm install
pnpm dev               # http://localhost:5173 (proxy /api -> 3484)
```

## Documentación

- [API](./api/README.md) · [Referencia de endpoints](./api/API_DOCUMENTATION.md) · [Despliegue](./api/DEPLOYMENT.md)
- [Frontend](./frontend/README.md) · [Plan del frontend](./frontend/PLAN_FRONTEND.md)

## Flujo de trabajo

- Ramas por persona/feature → PR a `main`. CI corre lint, tipos, pruebas y build de cada proyecto.
- Commits convencionales (`feat:`, `fix:`, `chore:`…).
