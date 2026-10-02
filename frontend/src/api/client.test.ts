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

  it('envía el token Bearer de la sesión', async () => {
    useSessionStore.getState().setSession('abc123', 'mesero')
    let auth: string | null = null
    server.use(
      http.get('*/api/ping', ({ request }) => {
        auth = request.headers.get('Authorization')
        return HttpResponse.json({ status: 'success', message: 'ok', data: null })
      }),
    )
    await api.get('/ping')
    expect(auth).toBe('Bearer abc123')
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
    useSessionStore.getState().setSession('expirado', 'admin')
    server.use(
      http.get('*/api/ping', () =>
        HttpResponse.json({ status: 'error', message: 'Token inválido' }, { status: 401 }),
      ),
    )
    await expect(api.get('/ping')).rejects.toBeInstanceOf(ApiError)
    expect(useSessionStore.getState().token).toBeNull()
  })
})
