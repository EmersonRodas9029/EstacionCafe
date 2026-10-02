import { http, HttpResponse } from 'msw'
import { products } from './data'

const ok = <T>(data: T, message = 'OK') => HttpResponse.json({ status: 'success', message, data })

export const handlers = [
  http.get('*/api/products', () => ok(products, 'Productos obtenidos correctamente')),
  http.get('*/api/products/active', () =>
    ok(
      products.filter((p) => p.active),
      'Productos activos obtenidos correctamente',
    ),
  ),
]
