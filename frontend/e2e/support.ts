import { expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test'
import { API_URL } from '../playwright.config'

export const PASSWORD = 'AdminDemo123!'
export type DemoUser = 'admin.demo' | 'mesero.demo' | 'cajero.demo'

/** Inicia sesión por la UI y espera el panel de su rol. */
export async function login(page: Page, username: DemoUser, path = '/login') {
  await page.goto(path)
  await page.getByLabel('Usuario', { exact: true }).fill(username)
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

/** Cliente de la API para preparar datos o comprobar efectos sin pasar por la UI. */
export async function api(request: APIRequestContext, username: DemoUser = 'admin.demo') {
  // La API solo entrega el token en el body si se pide (scripts con Bearer)
  const response = await request.post(`${API_URL}/users/login`, {
    data: { username, password: PASSWORD },
    headers: { 'X-Token-In-Body': 'true', 'X-Requested-With': 'EstacionCafe' },
  })
  expect(response.ok()).toBeTruthy()
  const token = (await response.json()).data.token as string
  const headers = { Authorization: `Bearer ${token}` }
  // Respuestas sin tipar a propósito: las pruebas leen solo los campos que verifican
  // oxlint-disable-next-line typescript/no-explicit-any
  const unwrap = async (res: APIResponse): Promise<any> => {
    expect(res.ok(), `${res.url()} → ${res.status()}`).toBeTruthy()
    return ((await res.json()) as { data: unknown }).data
  }
  return {
    get: async (path: string) => unwrap(await request.get(`${API_URL}${path}`, { headers })),
    post: async (path: string, data: unknown) =>
      unwrap(await request.post(`${API_URL}${path}`, { headers, data })),
    put: async (path: string, data: unknown) =>
      unwrap(await request.put(`${API_URL}${path}`, { headers, data })),
    delete: async (path: string) => unwrap(await request.delete(`${API_URL}${path}`, { headers })),
  }
}

/** Sufijo único para no chocar con datos de otras pruebas de la misma corrida. */
export const unique = (prefix: string) => `${prefix} ${Date.now().toString(36).slice(-5)}`
