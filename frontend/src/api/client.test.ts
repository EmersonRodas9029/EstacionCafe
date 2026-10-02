import { http, HttpResponse } from 'msw'
import { useSessionStore } from '@/features/auth/session-store'
import { server } from '@/mocks/server'
import { api } from './client'
import { ApiError } from './errors'

describe('apiRequest', () => {
  it('desempaqueta data del envelope', async () => {
    server.use(
      http.get('*/api/ping', () =>
        HttpResponse.json({ status: 'success', message: 'ok', data: { pong: true } }),
      ),
    )
    await expect(api.get('/ping')).resolves.toEqual({ pong: true })
  })

  it('no envía tokens: la sesión va en la cookie y cada petición lleva el header anti-CSRF', async () => {
    let auth: string | null = 'sin leer'
    let csrf: string | null = null
    server.use(
      http.post('*/api/ping', ({ request }) => {
        auth = request.headers.get('Authorization')
        csrf = request.headers.get('X-Requested-With')
        return HttpResponse.json({ status: 'success', message: 'ok', data: null })
      }),
    )
    await api.post('/ping', {})
    expect(auth).toBeNull()
    expect(csrf).toBe('EstacionCafe')
  })

  it('convierte errores de validación en ApiError con campo', async () => {
    server.use(
      http.post('*/api/products', () =>
        HttpResponse.json(
          { status: 'error', message: 'Datos inválidos', campo: ['price'], error: 'too_small' },
          { status: 400 },
        ),
      ),
    )
    const error = await api.post('/products', {}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      field: 'price',
      code: 'too_small',
      message: 'Datos inválidos',
    })
  })

  it('detecta stock_error', async () => {
    server.use(
      http.post('*/api/bill-details', () =>
        HttpResponse.json(
          { status: 'error', message: 'Stock insuficiente', type: 'stock_error' },
          { status: 400 },
        ),
      ),
    )
    const error = (await api.post('/bill-details', {}).catch((e: unknown) => e)) as ApiError
    expect(error.isStockError).toBe(true)
  })

  it('limpia la sesión en 401', async () => {
    useSessionStore.getState().setUser({ userId: 1, username: 'a', email: 'a@a.a', role: 'admin' })
    server.use(
      http.get('*/api/ping', () =>
        HttpResponse.json({ status: 'error', message: 'Token inválido' }, { status: 401 }),
      ),
    )
    await expect(api.get('/ping')).rejects.toBeInstanceOf(ApiError)
    expect(useSessionStore.getState().user).toBeNull()
  })
})
