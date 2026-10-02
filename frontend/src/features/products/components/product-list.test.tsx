import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/render'
import { ProductList } from './product-list'

describe('ProductList', () => {
  it('muestra solo productos activos con precio formateado', async () => {
    renderWithProviders(<ProductList />)
    expect(await screen.findByText('Espresso')).toBeInTheDocument()
    expect(screen.getByText('$2.50')).toBeInTheDocument()
    expect(screen.queryByText('Croissant')).not.toBeInTheDocument()
  })

  it('muestra el error de la API', async () => {
    server.use(
      http.get('*/api/products/active', () =>
        HttpResponse.json({ status: 'error', message: 'Falla del servidor' }, { status: 500 }),
      ),
    )
    renderWithProviders(<ProductList />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Falla del servidor')
  })
})
