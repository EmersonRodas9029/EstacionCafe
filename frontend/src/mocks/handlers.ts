import { http, HttpResponse } from 'msw'
import { DEMO_PASSWORD, products, users } from './data'

const ok = <T>(data: T, message = 'OK') => HttpResponse.json({ status: 'success', message, data })
const fail = (status: number, message: string) =>
  HttpResponse.json({ status: 'error', message }, { status })

// Token simulado: "mock-<userId>"
const userFromRequest = (request: Request) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  return users.find((u) => token === `mock-${u.userId}`)
}

export const handlers = [
  http.post('*/api/users/login', async ({ request }) => {
    const { username, password } = (await request.json()) as Record<string, string>
    const user = users.find((u) => u.username === username)
    if (!user || password !== DEMO_PASSWORD) return fail(401, 'Usuario o contraseña incorrectos')
    return ok({ token: `mock-${user.userId}`, expiresIn: 43200 }, 'Inicio de sesión exitoso')
  }),
  http.post('*/api/users/logout', () => ok(null, 'Sesión cerrada')),
  http.get('*/api/users/me', ({ request }) => {
    const user = userFromRequest(request)
    return user ? ok(user, 'Usuario autenticado') : fail(401, 'Token inválido')
  }),
  http.get('*/api/products', () => ok(products, 'Productos obtenidos correctamente')),
  http.get('*/api/products/active', () =>
    ok(
      products.filter((p) => p.active),
      'Productos activos obtenidos correctamente',
    ),
  ),
]
