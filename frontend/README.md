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
| `pnpm test:e2e` / `pnpm test:e2e:ui`                   | Playwright contra la API real (recrea la BD `estacioncafe_e2e`; requiere Postgres arriba)      |
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

## Pruebas

- **Unitarias y de flujo** (`pnpm test`): Vitest + Testing Library con la API simulada por MSW (`src/mocks`, en memoria y con las mismas reglas de negocio). Cada archivo `*-flow.test.tsx` recorre una vista completa con el router real.
- **E2E** (`pnpm test:e2e`): `e2e/*.spec.ts` con Playwright. `playwright.config.ts` levanta la API con una BD propia recreada desde las migraciones y el seeder, y Vite apuntando a ella. Proyecto `escritorio` (Chrome) y `movil` (Pixel 7, pruebas con `@movil`).
- **Accesibilidad**: `e2e/a11y.spec.ts` audita con axe (WCAG 2.1 AA) todas las vistas y falla con violaciones serias o críticas.

## Producción

- `Dockerfile` + `deploy/nginx.conf.template`: build estático servido por nginx con proxy `/api`, caché y headers de seguridad. Ver [Despliegue](../api/DEPLOYMENT.md#frontend-docker).
- PWA (`vite-plugin-pwa`): instalable, shell disponible sin red, la API nunca se cachea y las actualizaciones se aplican cuando el usuario acepta el aviso.
- Fuentes empaquetadas (`@fontsource-variable`), sin dependencias de CDN.
