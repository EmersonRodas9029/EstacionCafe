export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === 'true',
}
