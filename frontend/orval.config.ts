import { defineConfig } from 'orval'

// Genera tipos + hooks de TanStack Query desde el Swagger de la API.
// Requiere la API corriendo: `pnpm api:generate`
export default defineConfig({
  estacioncafe: {
    input: process.env.OPENAPI_URL ?? 'http://localhost:3484/api/docs.json',
    output: {
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'tags-split',
      clean: true,
      override: {
        mutator: { path: './src/api/client.ts', name: 'orvalMutator' },
        // Las funciones devuelven el body ({ status, message, data }) sin wrapper HTTP
        fetch: { includeHttpResponseReturnType: false },
      },
    },
  },
})
