# EstacionCafé — Frontend

SPA en React para meseros, cajeros y administración. Plan completo: [PLAN_FRONTEND.md](./PLAN_FRONTEND.md).

## Stack

Vite · React 19 · TypeScript (strict) · React Router · TanStack Query · Zustand · React Hook Form + Zod · Tailwind CSS v4 · shadcn/ui · Vitest + Testing Library + MSW · orval · oxlint · Prettier

## Inicio rápido

```bash
cp .env.example .env
pnpm install
pnpm dev        # usa la API real vía proxy /api -> http://localhost:3484
pnpm dev:mock   # usa la API simulada (MSW), sin backend
```

## Scripts

| Script                                                 | Descripción                                                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm dev:mock`                           | Servidor de desarrollo (API real / simulada)                                                   |
| `pnpm build`                                           | Typecheck + build de producción                                                                |
| `pnpm lint`                                            | oxlint                                                                                         |
| `pnpm format` / `pnpm format:check`                    | Prettier                                                                                       |
| `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` | Vitest                                                                                         |
| `pnpm api:generate`                                    | Genera tipos y hooks desde el Swagger (requiere la API corriendo; `OPENAPI_URL` para otra URL) |

## Estructura

```
src/
  app/          # providers, router, query client, páginas globales
  api/          # cliente HTTP (envelope, token, ApiError) y código generado
  features/     # un folder por dominio: components/ hooks/ api.ts schemas.ts types.ts
  components/ui # componentes base (estilo shadcn)
  lib/          # utilidades: cn, formato de moneda/fecha, env
  mocks/        # handlers MSW (dev:mock y tests)
  styles/       # tokens de la paleta + Tailwind
  test/         # setup y helpers de testing
```

## Convenciones

- Datos del servidor solo en TanStack Query (`queryOptions` + query keys por feature). Zustand solo para sesión y carrito.
- Todas las llamadas pasan por `src/api/client.ts`; los errores llegan como `ApiError` (`field`, `isStockError`, `isUnauthorized`).
- Schemas Zod de formularios replican las reglas del backend.
- Colores siempre vía tokens (`bg-primary`, `text-accent-strong`, …), nunca hex en componentes.
- Commits convencionales; el pre-commit corre oxlint + Prettier sobre los archivos staged.
